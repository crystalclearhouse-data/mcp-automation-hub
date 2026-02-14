import { ToolHandler } from './index.js';
import { stripeClient } from '../../api/stripe/client.js';
import { logger } from '../../utils/logger.js';

export const stripeToolHandlers: Record<string, ToolHandler> = {
  stripe_create_customer: {
    name: 'stripe_create_customer',
    description: 'Create a new Stripe customer',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Customer email' },
        name: { type: 'string', description: 'Customer name' },
        metadata: { type: 'object', description: 'Additional metadata' },
      },
      required: ['email'],
    },
    execute: async (args) => {
      try {
        const customer = await stripeClient.createCustomer({
          email: args.email as string,
          name: args.name as string,
          metadata: args.metadata as Record<string, string>,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(customer, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to create Stripe customer', { error });
        throw error;
      }
    },
  },

  stripe_list_customers: {
    name: 'stripe_list_customers',
    description: 'List Stripe customers',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of customers to return' },
      },
    },
    execute: async (args) => {
      try {
        const customers = await stripeClient.listCustomers({
          limit: (args.limit as number) || 10,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(customers, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to list Stripe customers', { error });
        throw error;
      }
    },
  },

  stripe_create_payment_intent: {
    name: 'stripe_create_payment_intent',
    description: 'Create a Stripe payment intent',
    inputSchema: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Amount in cents' },
        currency: { type: 'string', description: 'Currency code (e.g., usd)' },
        customer: { type: 'string', description: 'Customer ID' },
      },
      required: ['amount', 'currency'],
    },
    execute: async (args) => {
      try {
        const paymentIntent = await stripeClient.createPaymentIntent({
          amount: args.amount as number,
          currency: args.currency as string,
          customer: args.customer as string,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(paymentIntent, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to create payment intent', { error });
        throw error;
      }
    },
  },
};
