import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { broadcastSSEEvent } from './events-bus.js';
import { logger } from '../utils/logger.js';
import { classifyIncomingSMS } from '../services/aiAgent.js';
import { generateStripePaymentLink, buildUpsellMessage } from '../services/revenueEngine.js';
import { sendSMS, type TwilioBlastResult } from '../services/twilio.js';
import { config } from '../config.js';

const router: ExpressRouter = Router();

/** Wrap text in a TwiML <Response><Message> envelope. */
function twimlMessage(text: string): string {
  // Truncate to 160 chars to stay within a single SMS segment
  const safe = text.slice(0, 160).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<?xml version="1.0"?><Response><Message>${safe}</Message></Response>`;
}

// Twilio sends form-encoded POST bodies; express.urlencoded must be active upstream.
router.post('/sms', async (req: Request, res: Response): Promise<void> => {
  const from: string = (req.body as Record<string, string>)['From'] ?? '';
  const body: string = (req.body as Record<string, string>)['Body'] ?? '';

  logger.info(`Twilio inbound SMS from ${from}: ${body}`);

  let intent = 'other';
  let action: string | null = null;
  let reply = 'Got it';

  try {
    const classification = await classifyIncomingSMS(from, body);
    intent = classification.intent;
    action = classification.action;
    reply = classification.reply || reply;

    if (intent === 'payment') {
      try {
        const priceId = config.stripe.defaultPriceId;
        const paymentLink = await generateStripePaymentLink(priceId);
        const upsell = buildUpsellMessage('support@mcpautomationhub.com', 'Pro');
        // Combine upsell + link, keep under 160 chars
        const combined = `${upsell} Pay here: ${paymentLink.url}`;
        reply = combined.slice(0, 160);
        action = `payment_link:${paymentLink.id}`;
        logger.info(`Generated Stripe payment link ${paymentLink.id} for ${from}`);
      } catch (err) {
        logger.error('Failed to generate Stripe payment link:', err);
        // Fall back to the AI reply so we still respond
      }
    } else if (intent === 'opt-out') {
      reply = "You've been unsubscribed. Reply START to resubscribe.";
      action = 'opt_out';
      logger.info(`Opt-out received from ${from}`);
    }
    // 'support' | 'question' | 'other' — use the AI reply as-is
  } catch (err) {
    logger.error('SMS classification error:', err);
    reply = 'Sorry, we could not process your message. Please try again.';
    intent = 'error';
    action = null;
  }

  // Broadcast SSE event
  broadcastSSEEvent('sms_pipeline', { from, intent, action, reply });

  // Respond with TwiML
  res.setHeader('Content-Type', 'text/xml');
  res.send(twimlMessage(reply));
});

// POST /sms/blast — send an SMS to multiple numbers in parallel
router.post('/sms/blast', async (req: Request, res: Response): Promise<void> => {
  const { numbers, message } = req.body as { numbers?: unknown; message?: unknown };

  if (!Array.isArray(numbers) || numbers.length === 0) {
    res.status(400).json({ error: 'numbers must be a non-empty array of strings' });
    return;
  }
  if (typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'message must be a non-empty string' });
    return;
  }

  logger.info(`SMS blast to ${numbers.length} number(s)`);

  const results: TwilioBlastResult[] = await Promise.all(
    (numbers as string[]).map(async (to) => {
      try {
        const smsResult = await sendSMS(to, message);
        return { to, success: true, sid: smsResult.sid };
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        logger.error(`SMS blast failed for ${to}: ${errMsg}`);
        return { to, success: false, error: errMsg };
      }
    })
  );

  const succeeded = results.filter((r) => r.success).length;
  logger.info(`SMS blast complete: ${succeeded}/${results.length} succeeded`);

  res.json({ results, summary: { total: results.length, succeeded, failed: results.length - succeeded } });
});

export default router;
