import express from 'express';
import stripeWebhookRouter from './webhooks/stripe.js';
import { addSSEClient, removeSSEClient } from './webhooks/events-bus.js';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { dashboardHTML } from './dashboard.js';
import {
  pingN8n,
  listWorkflows,
  activateWorkflow,
  deactivateWorkflow,
  triggerWebhookWorkflow,
  listExecutions,
} from './services/n8n.js';

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

  // ── GET / — Dashboard UI ─────────────────────────────────────────────────
  app.get('/', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(dashboardHTML(config.n8n.baseUrl));
  });

  // ── n8n REST API (used by dashboard) ─────────────────────────────────────
  app.get('/api/n8n/ping', async (_req, res) => {
    try { res.json(await pingN8n()); }
    catch (e) { res.status(500).json({ ok: false, error: String(e) }); }
  });

  app.get('/api/n8n/workflows', async (_req, res) => {
    try { res.json(await listWorkflows()); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post('/api/n8n/workflows/:id/activate', async (req, res) => {
    try { res.json(await activateWorkflow(req.params.id)); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post('/api/n8n/workflows/:id/deactivate', async (req, res) => {
    try { res.json(await deactivateWorkflow(req.params.id)); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.post('/api/n8n/trigger', async (req, res) => {
    const { webhookPath, payload = {} } = req.body as { webhookPath: string; payload: Record<string, unknown> };
    if (!webhookPath) { res.status(400).json({ error: 'webhookPath required' }); return; }
    try { res.json(await triggerWebhookWorkflow(webhookPath, payload)); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.get('/api/n8n/executions', async (req, res) => {
    const limit = parseInt(String(req.query['limit'] ?? '20'), 10);
    const workflowId = req.query['workflowId'] as string | undefined;
    try { res.json(await listExecutions(workflowId, limit)); }
    catch (e) { res.status(500).json({ error: String(e) }); }
  });

  app.listen(config.port, () => {
    logger.info(`HTTP server listening on port ${config.port}`);
    logger.info(`  GET  /                 — Dashboard UI`);
    logger.info(`  POST /webhooks/stripe  — Stripe event receiver`);
    logger.info(`  GET  /events           — Live billing event stream (SSE)`);
    logger.info(`  GET  /health           — Health check`);
    logger.info(`  GET  /api/n8n/*        — n8n REST API`);
  });
}
