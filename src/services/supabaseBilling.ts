import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

// Uses service role key — full DB access, never expose to clients
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

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
  const { error } = await supabase
    .from('stripe_customers')
    .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: 'stripe_customer_id' });

  if (error) {
    logger.error('supabaseBilling.upsertStripeCustomer failed:', error.message);
    throw error;
  }
  logger.debug(`upsertStripeCustomer: ${data.stripe_customer_id}`);
}

export async function upsertStripeSubscription(data: StripeSubscriptionData): Promise<void> {
  const { error } = await supabase
    .from('stripe_subscriptions')
    .upsert({ ...data, updated_at: new Date().toISOString() }, { onConflict: 'stripe_subscription_id' });

  if (error) {
    logger.error('supabaseBilling.upsertStripeSubscription failed:', error.message);
    throw error;
  }
  logger.debug(`upsertStripeSubscription: ${data.stripe_subscription_id} status=${data.status}`);
}

export async function insertStripePayment(data: StripePaymentData): Promise<void> {
  const { error } = await supabase
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
    supabase
      .from('stripe_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('stripe_customers')
      .select('*', { count: 'exact', head: true }),
    supabase
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
    ? await supabase
        .from('stripe_customers')
        .select('*')
        .eq('stripe_customer_id', identifier)
        .single()
    : await supabase
        .from('stripe_customers')
        .select('*')
        .eq('email', identifier)
        .single();

  if (error || !customer) return null;

  const [{ data: subs }, { data: payments }] = await Promise.all([
    supabase
      .from('stripe_subscriptions')
      .select('*')
      .eq('stripe_customer_id', customer.stripe_customer_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('stripe_payments')
      .select('*')
      .eq('stripe_customer_id', customer.stripe_customer_id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return { customer, subscriptions: subs ?? [], payments: payments ?? [] };
}

export async function listSubscriptions(status?: string): Promise<unknown[]> {
  let query = supabase
    .from('stripe_subscriptions')
    .select('stripe_subscription_id, stripe_customer_id, stripe_price_id, status, current_period_end, cancel_at_period_end, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) logger.warn('listSubscriptions query error:', error.message);
  return data ?? [];
}
