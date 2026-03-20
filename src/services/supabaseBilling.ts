import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

// Lazy singleton — avoids crash on startup when SUPABASE_URL is not yet set
let _client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!_client) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    }
    _client = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }
  return _client;
}

export interface StripeCustomerData {
  stripe_customer_id: string;
  email?: string;
  user_id?: string;
}

export interface StripeSubscriptionData {
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id?: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  user_id?: string;
}

export interface StripePaymentData {
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
  stripe_customer_id: string;
  amount: number;
  currency: string;
  status: string;
}

export async function upsertStripeCustomer(data: StripeCustomerData): Promise<void> {
  const { error } = await db()
    .from('stripe_customers')
    .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: 'stripe_customer_id' });

  if (error) {
    logger.error('supabaseBilling.upsertStripeCustomer failed:', error.message);
    throw error;
  }
  logger.debug(`upsertStripeCustomer: ${data.stripe_customer_id}`);
}

export async function upsertStripeSubscription(data: StripeSubscriptionData): Promise<void> {
  const { error } = await db()
    .from('stripe_subscriptions')
    .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: 'stripe_subscription_id' });

  if (error) {
    logger.error('supabaseBilling.upsertStripeSubscription failed:', error.message);
    throw error;
  }
  logger.debug(`upsertStripeSubscription: ${data.stripe_subscription_id} status=${data.status}`);
}

export async function insertStripePayment(data: StripePaymentData): Promise<void> {
  const { error } = await db()
    .from('stripe_payments')
    .insert({ ...data, created_at: new Date().toISOString() });

  if (error) {
    logger.error('supabaseBilling.insertStripePayment failed:', error.message);
    throw error;
  }
  logger.debug(`insertStripePayment: ${data.stripe_invoice_id} status=${data.status}`);
}

// ── Query functions for MCP billing tools ────────────────────────────────────

export interface BillingOverview {
  activeSubscriptions: number;
  totalCustomers: number;
  totalPaymentsSucceeded: number;
  totalRevenueCents: number;
  totalRevenueFormatted: string;
  recentPayments: Array<{
    stripe_customer_id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  }>;
}

export async function getBillingOverview(): Promise<BillingOverview> {
  const [
    { count: activeSubs, error: e1 },
    { count: totalCustomers, error: e2 },
    { data: payments, error: e3 },
  ] = await Promise.all([
    db()
      .from('stripe_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    db()
      .from('stripe_customers')
      .select('*', { count: 'exact', head: true }),
    db()
      .from('stripe_payments')
      .select('stripe_customer_id, amount, currency, status, created_at')
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (e1) logger.warn('getBillingOverview: active subs query error:', e1.message);
  if (e2) logger.warn('getBillingOverview: customers query error:', e2.message);
  if (e3) logger.warn('getBillingOverview: payments query error:', e3.message);

  const succeeded = payments ?? [];
  const totalRevenueCents = succeeded.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return {
    activeSubscriptions: activeSubs ?? 0,
    totalCustomers: totalCustomers ?? 0,
    totalPaymentsSucceeded: succeeded.length,
    totalRevenueCents,
    totalRevenueFormatted: `$${(totalRevenueCents / 100).toFixed(2)} USD`,
    recentPayments: succeeded,
  };
}

export async function getCustomerBilling(identifier: string): Promise<unknown | null> {
  const isCustomerId = identifier.startsWith('cus_');

  const { data: customer, error } = isCustomerId
    ? await db()
        .from('stripe_customers')
        .select('*')
        .eq('stripe_customer_id', identifier)
        .single()
    : await db()
        .from('stripe_customers')
        .select('*')
        .eq('email', identifier)
        .single();

  if (error || !customer) return null;

  const [{ data: subs }, { data: payments }] = await Promise.all([
    db()
      .from('stripe_subscriptions')
      .select('*')
      .eq('stripe_customer_id', customer.stripe_customer_id)
      .order('created_at', { ascending: false }),
    db()
      .from('stripe_payments')
      .select('*')
      .eq('stripe_customer_id', customer.stripe_customer_id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return { customer, subscriptions: subs ?? [], payments: payments ?? [] };
}

export async function listSubscriptions(status?: string): Promise<unknown[]> {
  let query = db()
    .from('stripe_subscriptions')
    .select('stripe_subscription_id, stripe_customer_id, stripe_price_id, status, current_period_end, cancel_at_period_end, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) logger.warn('listSubscriptions query error:', error.message);
  return data ?? [];
}

// ── Revenue analytics ─────────────────────────────────────────────────────────

export interface ChurnRiskEntry {
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_end: string;
  days_remaining: number;
}

export async function getChurnRisk(): Promise<ChurnRiskEntry[]> {
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: pastDue, error: e1 } = await db()
    .from('stripe_subscriptions')
    .select('stripe_subscription_id, stripe_customer_id, status, current_period_end')
    .eq('status', 'past_due');

  const { data: expiringSoon, error: e2 } = await db()
    .from('stripe_subscriptions')
    .select('stripe_subscription_id, stripe_customer_id, status, current_period_end')
    .eq('status', 'active')
    .lt('current_period_end', sevenDaysFromNow);

  if (e1) logger.warn('getChurnRisk: past_due query error:', e1.message);
  if (e2) logger.warn('getChurnRisk: expiring soon query error:', e2.message);

  const combined = [...(pastDue ?? []), ...(expiringSoon ?? [])];
  const now = Date.now();

  return combined.map(row => {
    const periodEnd = row.current_period_end ? new Date(row.current_period_end).getTime() : now;
    const daysRemaining = Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24));
    return {
      stripe_subscription_id: row.stripe_subscription_id,
      stripe_customer_id: row.stripe_customer_id,
      status: row.status,
      current_period_end: row.current_period_end ?? '',
      days_remaining: daysRemaining,
    };
  });
}

export interface RevenueByDayEntry {
  date: string;
  amount_total: number;
}

export async function getRevenueByDay(days: number): Promise<RevenueByDayEntry[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db()
    .from('stripe_payments')
    .select('amount, created_at')
    .eq('status', 'succeeded')
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error) {
    logger.warn('getRevenueByDay query error:', error.message);
    return [];
  }

  // Group by date (YYYY-MM-DD)
  const byDay: Record<string, number> = {};
  for (const row of data ?? []) {
    const date = new Date(row.created_at).toISOString().slice(0, 10);
    byDay[date] = (byDay[date] ?? 0) + (row.amount ?? 0);
  }

  return Object.entries(byDay)
    .map(([date, amount_total]) => ({ date, amount_total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface TopCustomerEntry {
  stripe_customer_id: string;
  email?: string;
  total_amount: number;
  payment_count: number;
}

export async function getTopCustomers(limit: number): Promise<TopCustomerEntry[]> {
  const { data: payments, error } = await db()
    .from('stripe_payments')
    .select('stripe_customer_id, amount')
    .eq('status', 'succeeded');

  if (error) {
    logger.warn('getTopCustomers: payments query error:', error.message);
    return [];
  }

  // Aggregate by customer
  const totals: Record<string, { total_amount: number; payment_count: number }> = {};
  for (const row of payments ?? []) {
    const cid = row.stripe_customer_id;
    if (!totals[cid]) totals[cid] = { total_amount: 0, payment_count: 0 };
    totals[cid].total_amount += row.amount ?? 0;
    totals[cid].payment_count += 1;
  }

  const sorted = Object.entries(totals)
    .sort((a, b) => b[1].total_amount - a[1].total_amount)
    .slice(0, limit);

  // Fetch email from stripe_customers for the top N
  const customerIds = sorted.map(([cid]) => cid);
  const { data: customers } = await db()
    .from('stripe_customers')
    .select('stripe_customer_id, email')
    .in('stripe_customer_id', customerIds);

  const emailMap: Record<string, string> = {};
  for (const c of customers ?? []) {
    emailMap[c.stripe_customer_id] = c.email ?? '';
  }

  return sorted.map(([cid, stats]) => ({
    stripe_customer_id: cid,
    email: emailMap[cid],
    total_amount: stats.total_amount,
    payment_count: stats.payment_count,
  }));
}
