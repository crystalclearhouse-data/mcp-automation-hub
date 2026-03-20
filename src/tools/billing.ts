import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import {
  getBillingOverview,
  getCustomerBilling,
  listSubscriptions,
  getChurnRisk,
  getRevenueByDay,
  getTopCustomers,
} from '../services/supabaseBilling.js';
import {
  generateStripePaymentLink,
  calculateMRR,
} from '../services/revenueEngine.js';
import { getSSEClientCount } from '../webhooks/events-bus.js';

export const BILLING_TOOL_DEFINITIONS = [
  {
    name: 'billing_overview',
    description:
      'Get a live billing snapshot: active subscriptions, total customers, revenue from successful payments, and the 10 most recent payments. Requires SUPABASE_SERVICE_ROLE_KEY to be set.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_customer_billing',
    description:
      "Look up a customer's full billing history — subscriptions and payments — by email address or Stripe customer ID (cus_...).",
    inputSchema: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: 'Email address or Stripe customer ID (cus_...)',
        },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'list_subscriptions',
    description:
      'List up to 50 Stripe subscriptions stored in Supabase, newest first. Optionally filter by status.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status. Omit to return all.',
          enum: ['active', 'canceled', 'past_due', 'trialing', 'incomplete'],
        },
      },
      required: [],
    },
  },
  {
    name: 'live_event_stream_status',
    description:
      'Check the live billing event stream: how many SSE clients are connected and the URL to connect.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'revenue_mrr',
    description:
      'Get the current MRR/ARR summary plus the top 10 customers by revenue. Requires SUPABASE_SERVICE_ROLE_KEY.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'churn_risk_report',
    description:
      'List at-risk subscriptions: those that are past_due or whose active period ends within 7 days.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'generate_payment_link',
    description:
      'Generate a Stripe Payment Link for a given price ID. Optionally attach it to an existing customer.',
    inputSchema: {
      type: 'object',
      properties: {
        price_id: {
          type: 'string',
          description: 'Stripe Price ID (price_...)',
        },
        customer_id: {
          type: 'string',
          description: 'Optional Stripe Customer ID (cus_...)',
        },
      },
      required: ['price_id'],
    },
  },
  {
    name: 'revenue_by_day',
    description: 'Get total succeeded payment revenue grouped by day for the last N days.',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to look back (default 30)',
        },
      },
      required: [],
    },
  },
];

export async function handleBillingTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  logger.debug(`Billing tool called: ${name}`);

  switch (name) {
    case 'billing_overview': {
      if (!config.supabase.serviceRoleKey) {
        return JSON.stringify({
          error: 'Supabase not configured — set SUPABASE_SERVICE_ROLE_KEY in .env',
        });
      }
      const overview = await getBillingOverview();
      return JSON.stringify(overview, null, 2);
    }

    case 'get_customer_billing': {
      const identifier = args.identifier as string | undefined;
      if (!identifier) throw new Error('identifier is required');
      if (!config.supabase.serviceRoleKey) {
        return JSON.stringify({ error: 'Supabase not configured — set SUPABASE_SERVICE_ROLE_KEY' });
      }
      const result = await getCustomerBilling(identifier);
      if (!result) {
        return JSON.stringify({ found: false, identifier });
      }
      return JSON.stringify(result, null, 2);
    }

    case 'list_subscriptions': {
      if (!config.supabase.serviceRoleKey) {
        return JSON.stringify({ error: 'Supabase not configured — set SUPABASE_SERVICE_ROLE_KEY' });
      }
      const status = args.status as string | undefined;
      const subs = await listSubscriptions(status);
      return JSON.stringify(
        { count: subs.length, filter: status ?? 'all', subscriptions: subs },
        null,
        2
      );
    }

    case 'live_event_stream_status': {
      const count = getSSEClientCount();
      const streamUrl = `http://localhost:${config.port}/events`;
      return JSON.stringify(
        {
          connectedClients: count,
          streamUrl,
          curlCommand: `curl -N ${streamUrl}`,
          eventFormat: {
            type: 'billing',
            fields: ['type', 'timestamp', '...event-specific fields'],
          },
          supportedEvents: [
            'checkout.session.completed',
            'customer.subscription.created',
            'customer.subscription.updated',
            'customer.subscription.deleted',
            'invoice.payment_succeeded',
            'invoice.payment_failed',
          ],
        },
        null,
        2
      );
    }

    case 'revenue_mrr': {
      if (!config.supabase.serviceRoleKey) {
        return JSON.stringify({ error: 'Supabase not configured — set SUPABASE_SERVICE_ROLE_KEY' });
      }
      const [topCustomers, overview] = await Promise.all([
        getTopCustomers(10),
        getBillingOverview(),
      ]);
      // Build synthetic subscription list from overview for MRR calc
      // Use active subscription count × average payment as a proxy
      const avgPayment =
        overview.activeSubscriptions > 0
          ? Math.round(overview.totalRevenueCents / Math.max(overview.totalPaymentsSucceeded, 1))
          : 0;
      const syntheticSubs = Array.from({ length: overview.activeSubscriptions }, () => ({
        amount: avgPayment,
        status: 'active',
      }));
      const mrrData = calculateMRR(syntheticSubs);
      return JSON.stringify(
        {
          mrr: mrrData.mrrFormatted,
          arr: mrrData.arrFormatted,
          activeSubscriptions: mrrData.count,
          topCustomers,
        },
        null,
        2
      );
    }

    case 'churn_risk_report': {
      if (!config.supabase.serviceRoleKey) {
        return JSON.stringify({ error: 'Supabase not configured — set SUPABASE_SERVICE_ROLE_KEY' });
      }
      const atRisk = await getChurnRisk();
      return JSON.stringify(
        { count: atRisk.length, atRisk },
        null,
        2
      );
    }

    case 'generate_payment_link': {
      const priceId = args.price_id as string | undefined;
      if (!priceId) throw new Error('price_id is required');
      if (!config.stripe.secretKey) {
        return JSON.stringify({ error: 'Stripe not configured — set STRIPE_SECRET_KEY' });
      }
      const customerId = args.customer_id as string | undefined;
      const link = await generateStripePaymentLink(priceId, customerId);
      return JSON.stringify(link, null, 2);
    }

    case 'revenue_by_day': {
      if (!config.supabase.serviceRoleKey) {
        return JSON.stringify({ error: 'Supabase not configured — set SUPABASE_SERVICE_ROLE_KEY' });
      }
      const days = typeof args.days === 'number' ? args.days : 30;
      const data = await getRevenueByDay(days);
      return JSON.stringify({ days, data }, null, 2);
    }

    default:
      throw new Error(`Unknown billing tool: ${name}`);
  }
}
