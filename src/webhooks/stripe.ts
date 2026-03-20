import express, { Request, Response, Router } from 'express';
import Stripe from 'stripe';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import {
  upsertStripeCustomer,
  upsertStripeSubscription,
  insertStripePayment,
} from '../services/supabaseBilling.js';
import { broadcastBillingEvent } from './events-bus.js';

const stripe = new Stripe(config.stripe.secretKey);

const router: Router = express.Router();

// Raw body MUST be read before any JSON parsing — Stripe signature verification requires it
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      logger.warn('Stripe webhook received without signature header');
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Stripe webhook signature verification failed:', message);
      res.status(400).json({ error: `Webhook signature error: ${message}` });
      return;
    }

    logger.info(`Stripe webhook received: ${event.type} id=${event.id}`);

    try {
      await handleStripeEvent(event);
    } catch (err: unknown) {
      // Return 200 so Stripe does not retry — application errors are logged internally
      logger.error(`Stripe webhook handler error [${event.type}]:`, err);
      res.status(200).json({ received: true, warning: 'Handler error — check server logs' });
      return;
    }

    res.status(200).json({ received: true });
  }
);

// ── Event dispatcher ──────────────────────────────────────────────────────────

async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer) {
        await upsertStripeCustomer({
          stripe_customer_id: session.customer as string,
          email: session.customer_details?.email ?? undefined,
          user_id: session.metadata?.user_id,
        });
      }
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        await upsertStripeSubscription(mapSubscription(sub));
      }
      const checkoutPayload = {
        user_id: session.metadata?.user_id,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        email: session.customer_details?.email,
        status: 'active',
      };
      broadcastBillingEvent('checkout.session.completed', checkoutPayload);
      await notifyN8n('checkout.session.completed', { type: 'checkout.session.completed', ...checkoutPayload });
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await upsertStripeCustomer({ stripe_customer_id: sub.customer as string });
      await upsertStripeSubscription(mapSubscription(sub));
      const subPayload = {
        stripe_customer_id: sub.customer,
        stripe_subscription_id: sub.id,
        stripe_price_id: sub.items.data[0]?.price?.id,
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
      };
      broadcastBillingEvent(event.type, subPayload);
      await notifyN8n(event.type, { type: event.type, ...subPayload });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await upsertStripeSubscription({ ...mapSubscription(sub), status: 'canceled' });
      broadcastBillingEvent('customer.subscription.deleted', {
        stripe_customer_id: sub.customer,
        stripe_subscription_id: sub.id,
        status: 'canceled',
      });
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await insertStripePayment({
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: (invoice.payment_intent as string) ?? undefined,
        stripe_customer_id: invoice.customer as string,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
      });
      broadcastBillingEvent('invoice.payment_succeeded', {
        stripe_customer_id: invoice.customer,
        stripe_invoice_id: invoice.id,
        amount_paid: invoice.amount_paid,
        currency: invoice.currency,
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await insertStripePayment({
        stripe_invoice_id: invoice.id,
        stripe_payment_intent_id: (invoice.payment_intent as string) ?? undefined,
        stripe_customer_id: invoice.customer as string,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
      });
      const failedPayload = {
        stripe_customer_id: invoice.customer,
        stripe_invoice_id: invoice.id,
        amount_due: invoice.amount_due,
        currency: invoice.currency,
      };
      broadcastBillingEvent('invoice.payment_failed', failedPayload);
      await notifyN8n('invoice.payment_failed', { type: 'invoice.payment_failed', ...failedPayload });
      break;
    }

    default:
      logger.debug(`Stripe webhook: unhandled event type ${event.type}`);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapSubscription(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  return {
    stripe_subscription_id: sub.id,
    stripe_customer_id: sub.customer as string,
    stripe_price_id: item?.price?.id,
    status: sub.status,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    user_id: sub.metadata?.user_id,
  };
}

async function notifyN8n(eventName: string, payload: Record<string, unknown>): Promise<void> {
  const url = config.n8n.stripeWebhookUrl;
  if (!url) {
    logger.debug(`notifyN8n: N8N_STRIPE_WEBHOOK_URL not set, skipping ${eventName}`);
    return;
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`n8n responded with ${res.status}`);
      logger.debug(`notifyN8n: sent ${eventName} (attempt ${attempt})`);
      return;
    } catch (err: unknown) {
      logger.warn(`notifyN8n: attempt ${attempt}/${maxAttempts} failed for ${eventName}:`, err);
      if (attempt < maxAttempts) await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
  logger.error(`notifyN8n: all retries exhausted for ${eventName}`);
}

export default router;
