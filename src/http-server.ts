import express from 'express';
import stripeWebhookRouter from './webhooks/stripe.js';
import { addSSEClient, removeSSEClient } from './webhooks/events-bus.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';

export function startHttpServer(): void {
  const app = express();

  // Stripe webhook route MUST be mounted before express.json() so it
  // can read the raw request body required for signature verification.
  app.use('/webhooks', stripeWebhookRouter);

  // JSON body parser for all other routes
  app.use(express.json());

  // ── GET /events — Server-Sent Events live billing stream ────────────────
  // Usage: curl -N http://localhost:3000/events
  // Events: billing (checkout, subscription, payment), connected (on join), ping
  app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // prevent nginx buffering
    res.flushHeaders();

    const id = addSSEClient(res);

    // Keep-alive ping every 25s to prevent proxy timeouts
    const ping = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(ping);
      }
    }, 25_000);

    req.on('close', () => {
      clearInterval(ping);
      removeSSEClient(id);
    });
  });

  // ── GET /health ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), port: config.port });
  });

  app.listen(config.port, () => {
    logger.info(`HTTP server listening on port ${config.port}`);
    logger.info(`  POST /webhooks/stripe  — Stripe event receiver`);
    logger.info(`  GET  /events           — Live billing event stream (SSE)`);
    logger.info(`  GET  /health           — Health check`);
  });
}
