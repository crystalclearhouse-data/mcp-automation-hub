import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: config.anthropic.apiKey });
  }
  return client;
}

export interface SMSClassification {
  intent: string;
  reply: string;
  action: string | null;
}

/**
 * Classify an incoming SMS message and draft a short reply.
 * Returns a typed object with intent, reply, and optional action.
 */
export async function classifyIncomingSMS(
  fromNumber: string,
  messageBody: string
): Promise<SMSClassification> {
  const anthropic = getClient();

  logger.debug(`Classifying SMS from ${fromNumber}: ${messageBody}`);

  const response = await anthropic.messages.create({
    model: config.anthropic.model,
    max_tokens: 256,
    system:
      'You are a phone automation agent. Classify the SMS intent (support/payment/opt-out/question/other) and draft a helpful short reply under 160 chars. Return JSON: {intent, reply, action}',
    messages: [
      {
        role: 'user',
        content: `From: ${fromNumber}\nMessage: ${messageBody}`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('');

  // Extract JSON from the response (handle markdown code fences if present)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    logger.error('AI response did not contain JSON:', text);
    throw new Error('AI response did not contain valid JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]) as SMSClassification;
  return {
    intent: parsed.intent ?? 'other',
    reply: parsed.reply ?? '',
    action: parsed.action ?? null,
  };
}

/**
 * Generate a short TwiML-ready call script for the given purpose.
 */
export async function generateCallScript(
  purpose: string,
  customerName?: string
): Promise<string> {
  const anthropic = getClient();

  logger.debug(`Generating call script for purpose: ${purpose}`);

  const nameClause = customerName ? ` The customer's name is ${customerName}.` : '';

  const response = await anthropic.messages.create({
    model: config.anthropic.model,
    max_tokens: 512,
    system:
      'You are a phone automation agent. Write concise, natural-sounding call scripts suitable for TwiML <Say> elements. Keep scripts under 30 seconds when spoken aloud.',
    messages: [
      {
        role: 'user',
        content: `Write a TwiML-ready call script for the following purpose:${nameClause}\n\n${purpose}`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('');

  return text.trim();
}

/**
 * Answer a general question using the provided context.
 */
export async function answerQuestion(
  question: string,
  context: string
): Promise<string> {
  const anthropic = getClient();

  logger.debug(`Answering question: ${question}`);

  const response = await anthropic.messages.create({
    model: config.anthropic.model,
    max_tokens: 1024,
    system:
      'You are a helpful assistant for a phone and workflow automation hub. Answer questions accurately and concisely based on the provided context.',
    messages: [
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as { type: 'text'; text: string }).text)
    .join('');

  return text.trim();
}
