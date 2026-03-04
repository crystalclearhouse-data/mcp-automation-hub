import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';

/** Static resource definitions exposed by the hub. */
const RESOURCES = [
  {
    uri: 'automation-hub://status',
    name: 'Hub Status',
    description: 'Current operational status of the MCP Automation Hub',
    mimeType: 'application/json',
  },
  {
    uri: 'automation-hub://patterns',
    name: 'Pattern Library',
    description: 'Full catalogue of golden automation patterns',
    mimeType: 'application/json',
  },
];

/**
 * Registers all MCP resources on the given server.
 */
export function registerResources(server: Server): void {
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: RESOURCES };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    logger.info(`Resource read: ${uri}`);

    switch (uri) {
      case 'automation-hub://status': {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                status: 'operational',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
              }),
            },
          ],
        };
      }

      case 'automation-hub://patterns': {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({
                patterns: [
                  'roadmap-planning',
                  'infra-module-baseline',
                  'mcp-server-golden-path',
                  'cicd-github-actions',
                  'n8n-pipeline-ingestion',
                  'audit-refactor',
                  'onboarding-docs',
                ],
              }),
            },
          ],
        };
      }

      default:
        throw new Error(`Resource not found: ${uri}`);
    }
  });
}
