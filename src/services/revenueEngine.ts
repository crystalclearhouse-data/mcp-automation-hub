import axios from 'axios';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

// ── Payment link generation ───────────────────────────────────────────────────

export interface PaymentLinkResult {
  url: string;
  id: string;
}

export async function generateStripePaymentLink(
  priceId: string,
  customerId?: string
): Promise<PaymentLinkResult> {
  if (!config.stripe.secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  const params = new URLSearchParams();
  params.append('line_items[0][price]', priceId);
  params.append('line_items[0][quantity]', '1');
  if (customerId) {
    params.append('customer', customerId);
  }

  const response = await axios.post<{ id: string; url: string }>(
    'https://api.stripe.com/v1/payment_links',
    params.toString(),
    {
      headers: {
        Authorization: `Bearer ${config.stripe.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  logger.debug(`generateStripePaymentLink: created ${response.data.id}`);
  return { url: response.data.url, id: response.data.id };
}

// ── Upsell messaging ──────────────────────────────────────────────────────────

export function buildUpsellMessage(customerEmail: string, planName: string): string {
  return (
    `Hi! This is MCP Automation Hub. We noticed you're getting great value from us — ` +
    `upgrade to ${planName} today and unlock even more powerful automation features. ` +
    `Reply UPGRADE or visit your account portal. Questions? Email ${customerEmail}.`
  );
}

// ── MRR / ARR calculation ─────────────────────────────────────────────────────

export interface MRRResult {
  mrr: number;
  arr: number;
  count: number;
  mrrFormatted: string;
  arrFormatted: string;
}

export function calculateMRR(subscriptions: Array<{ amount?: number; status?: string }>): MRRResult {
  const active = subscriptions.filter(s => s.status === 'active' || s.status == null);
  const totalCents = active.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const mrr = totalCents / 100;
  const arr = mrr * 12;

  return {
    mrr,
    arr,
    count: active.length,
    mrrFormatted: `$${mrr.toFixed(2)}`,
    arrFormatted: `$${arr.toFixed(2)}`,
  };
}
