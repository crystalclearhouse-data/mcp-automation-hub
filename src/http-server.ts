import express from 'express';
import stripeWebhookRouter from './webhooks/stripe.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';

export function startHttpServer(): void {
  const app = express();

  // Stripe webhook route MUST be mounted before express.json() so it
  // can read the raw request body required for signature verification.
  app.use('/webhooks', stripeWebhookRouter);

  // JSON body parser for all other routes
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), port: config.port });
  });

  app.listen(config.port, () => {
    logger.info(`HTTP server listening on port ${config.port}`);
    logger.info(`  POST /webhooks/stripe  — Stripe event receiver`);
    logger.info(`  GET  /health           — Health check`);
  });
}
