import { config } from './config.js';
import { logger } from './utils/logger.js';

export interface AppServer {
  port: number;
  startTime: Date;
}

/**
 * Creates the application server context.
 * For MCP stdio transport, this is lightweight — the real server
 * is the MCP Server instance in index.ts.
 */
export function createServer(): AppServer {
  logger.debug(`Server context created for port ${config.port}`);
  return {
    port: config.port,
    startTime: new Date(),
  };
}
