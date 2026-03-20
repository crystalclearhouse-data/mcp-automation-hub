import { Response } from 'express';
import { logger } from '../utils/logger.js';

interface SSEClient {
  id: string;
  res: Response;
  connectedAt: Date;
}

const clients = new Map<string, SSEClient>();
let counter = 0;

export function addSSEClient(res: Response): string {
  const id = `sse-${++counter}-${Date.now()}`;
  clients.set(id, { id, res, connectedAt: new Date() });
  logger.debug(`SSE client connected: ${id} (total: ${clients.size})`);

  res.write(
    `event: connected\ndata: ${JSON.stringify({
      clientId: id,
      timestamp: new Date().toISOString(),
      message: 'Listening for live billing events...',
    })}\n\n`
  );
  return id;
}

export function removeSSEClient(id: string): void {
  clients.delete(id);
  logger.debug(`SSE client disconnected: ${id} (total: ${clients.size})`);
}

export function broadcastBillingEvent(
  eventType: string,
  data: Record<string, unknown>
): void {
  if (clients.size === 0) return;

  const payload = `event: billing\ndata: ${JSON.stringify({
    type: eventType,
    timestamp: new Date().toISOString(),
    ...data,
  })}\n\n`;

  const dead: string[] = [];
  for (const [id, client] of clients) {
    try {
      client.res.write(payload);
    } catch {
      dead.push(id);
    }
  }
  dead.forEach(id => clients.delete(id));

  logger.debug(`SSE broadcast: ${eventType} → ${clients.size} client(s)`);
}

export function getSSEClientCount(): number {
  return clients.size;
}
