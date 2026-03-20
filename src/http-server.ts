import express from 'express';
import path from 'path';
import stripeWebhookRouter from './webhooks/stripe.js';
import twilioWebhookRouter from './webhooks/twilio.js';
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
import {
  getBillingOverview,
  getChurnRisk,
  getRevenueByDay,
  getTopCustomers,
} from './services/supabaseBilling.js';

export function startHttpServer(): void {
  const app = express();

  // Serve static files from public/ (manifest.json, sw.js, icons, etc.)
  // __dirname in CommonJS = dist/  →  ../public = project root /public
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Stripe webhook route MUST be mounted before express.json() so it
  // can read the raw request body required for signature verification.
  app.use('/webhooks', stripeWebhookRouter);

  // Twilio sends form-encoded bodies; mount before the JSON parser but after Stripe
  app.use('/webhooks/twilio', express.urlencoded({ extended: false }), twilioWebhookRouter);

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

  // ── Revenue API ───────────────────────────────────────────────────────────
  app.get('/api/revenue/mrr', async (_req, res) => {
    try {
      const [overview, churnRisk, topCustomers] = await Promise.all([
        getBillingOverview(),
        getChurnRisk(),
        getTopCustomers(5),
      ]);
      res.json({
        activeSubscriptions: overview.activeSubscriptions,
        totalRevenueCents: overview.totalRevenueCents,
        churnRiskCount: churnRisk.length,
        topCustomers,
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/revenue/churn', async (_req, res) => {
    try {
      res.json(await getChurnRisk());
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get('/api/revenue/daily', async (req, res) => {
    const days = parseInt(String(req.query['days'] ?? '30'), 10);
    try {
      res.json(await getRevenueByDay(days));
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  // ── POST /api/push/notify — Server-side push payload trigger ─────────────
  app.post('/api/push/notify', (req, res) => {
    const { title, body } = req.body as { title?: string; body?: string };
    if (!body) {
      res.status(400).json({ error: 'body is required' });
      return;
    }
    // Accepts push notification payloads. Integrate with a Web Push library
    // (e.g. web-push) and stored PushSubscription objects to deliver real
    // push messages to clients.
    logger.info(`Push notify requested — title: ${title ?? 'MCP Hub'}, body: ${body}`);
    res.json({ ok: true, message: 'Push notification queued', title: title ?? 'MCP Hub', body });
  });

  app.listen(config.port, () => {
    logger.info(`HTTP server listening on port ${config.port}`);
    logger.info(`  GET  /                 — Dashboard UI`);
    logger.info(`  POST /webhooks/stripe  — Stripe event receiver`);
    logger.info(`  GET  /events           — Live billing event stream (SSE)`);
    logger.info(`  GET  /health           — Health check`);
    logger.info(`  GET  /api/n8n/*        — n8n REST API`);
    logger.info(`  POST /api/push/notify  — Push notification trigger`);
    logger.info(`  POST /webhooks/twilio/sms — Twilio inbound SMS receiver`);
  });
}
