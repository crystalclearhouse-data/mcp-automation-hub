import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export function registerResources(server: Server): void {
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: 'config://server',
        name: 'Server Configuration',
        description: 'Current MCP Automation Hub server configuration (non-sensitive fields).',
        mimeType: 'application/json',
      },
      {
        uri: 'config://integrations',
        name: 'Integration Status',
        description: 'Status of all configured third-party integrations.',
        mimeType: 'application/json',
      },
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    logger.debug(`Resource read: ${uri}`);

    switch (uri) {
      case 'config://server':
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  port: config.port,
                  logLevel: config.logLevel,
                  environment: config.nodeEnv,
                  n8n: {
                    host: config.n8n.host,
                    port: config.n8n.port,
                    protocol: config.n8n.protocol,
                  },
                },
                null,
                2
              ),
            },
          ],
        };

      case 'config://integrations':
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(
                {
                  anthropic: { configured: Boolean(config.anthropic.apiKey) },
                  github: {
                    configured: Boolean(config.github.token),
                    username: config.github.username || null,
                  },
                  supabase: { configured: Boolean(config.supabase.url) },
                  stripe: { configured: Boolean(config.stripe.secretKey) },
                  n8n: {
                    configured: true,
                    url: `${config.n8n.protocol}://${config.n8n.host}:${config.n8n.port}`,
                  },
                },
                null,
                2
              ),
            },
          ],
        };

      default:
        throw new Error(`Unknown resource URI: ${uri}`);
    }
  });
}
