import Stripe from 'stripe';
import { env } from '../../utils/env.js';
import { logger } from '../../utils/logger.js';

class StripeClient {
  private stripe: Stripe | null = null;

  private getClient(): Stripe {
    if (!this.stripe) {
      if (!env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
      }
      this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
      });
    }
    return this.stripe;
  }

  async createCustomer(params: {
    email: string;
    name?: string;
    metadata?: Record<string, string>;
  }) {
    logger.debug('Creating Stripe customer', { email: params.email });
    const customer = await this.getClient().customers.create(params);
    logger.info('Stripe customer created', { customerId: customer.id });
    return customer;
  }

  async listCustomers(params?: { limit?: number }) {
    logger.debug('Listing Stripe customers', params);
    const customers = await this.getClient().customers.list(params);
    logger.info('Stripe customers listed', { count: customers.data.length });
    return customers;
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customer?: string;
  }) {
    logger.debug('Creating payment intent', params);
    const paymentIntent = await this.getClient().paymentIntents.create(params);
    logger.info('Payment intent created', { id: paymentIntent.id });
    return paymentIntent;
  }
}

export const stripeClient = new StripeClient();
