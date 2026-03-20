import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getHealthStatus } from './health-check.js';
import { BILLING_TOOL_DEFINITIONS, handleBillingTool } from './billing.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const BILLING_TOOL_NAMES = new Set(BILLING_TOOL_DEFINITIONS.map(t => t.name));

export function registerTools(server: Server): void {
  // List all available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'health_check',
        description:
          'Check the health and status of the MCP Automation Hub, including system resources and service configurations.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_n8n_status',
        description: 'Get the connection status and URL for the n8n workflow automation instance.',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'list_configured_services',
        description: 'List all configured integrations and their status (Stripe, Supabase, GitHub, etc.).',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      ...BILLING_TOOL_DEFINITIONS,
    ],
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    logger.debug(`Tool called: ${name}`);

    // Delegate billing tools to their own handler
    if (BILLING_TOOL_NAMES.has(name)) {
      const text = await handleBillingTool(name, args as Record<string, unknown>);
      return { content: [{ type: 'text', text }] };
    }

    switch (name) {
      case 'health_check': {
        const health = getHealthStatus();
        return {
          content: [{ type: 'text', text: JSON.stringify(health, null, 2) }],
        };
      }

      case 'get_n8n_status': {
        const n8nUrl = `${config.n8n.protocol}://${config.n8n.host}:${config.n8n.port}`;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  configured: Boolean(config.n8n.host),
                  url: n8nUrl,
                  webhookUrl: config.n8n.webhookUrl,
                  note: 'Use this URL to access n8n and trigger workflows.',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'list_configured_services': {
        const health = getHealthStatus();
        return {
          content: [{ type: 'text', text: JSON.stringify(health.services, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}
