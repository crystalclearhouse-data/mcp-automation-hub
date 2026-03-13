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
