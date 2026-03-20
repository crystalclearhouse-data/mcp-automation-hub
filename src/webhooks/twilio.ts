import { Router, type Router as ExpressRouter } from 'express';
import { broadcastBillingEvent } from './events-bus.js';
import { logger } from '../utils/logger.js';

const router: ExpressRouter = Router();

// Twilio sends form-encoded POST bodies; express.urlencoded must be active upstream.
router.post('/sms', (req, res) => {
  const from: string = (req.body as Record<string, string>)['From'] ?? '';
  const body: string = (req.body as Record<string, string>)['Body'] ?? '';

  logger.info(`Twilio inbound SMS from ${from}: ${body}`);

  broadcastBillingEvent('sms_received', { from, body });

  // Respond with TwiML
  res.setHeader('Content-Type', 'text/xml');
  res.send('<?xml version="1.0"?><Response><Message>Got it</Message></Response>');
});

export default router;
