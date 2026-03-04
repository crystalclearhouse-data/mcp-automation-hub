import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';

/**
 * Registers all MCP tools on the given server.
 *
 * Available tools:
 * - health_check       : Returns server health status
 * - list_patterns      : Lists all golden patterns in the library
 * - get_pattern        : Retrieves a specific pattern by name
 */
export function registerTools(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'health_check',
          description: 'Check the health status of the MCP Automation Hub server',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'list_patterns',
          description: 'List all golden automation patterns available in the library',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'get_pattern',
          description: 'Retrieve details for a specific golden pattern by name',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'The name of the pattern to retrieve',
              },
            },
            required: ['name'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info(`Tool called: ${name}`);

    switch (name) {
      case 'health_check': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
            },
          ],
        };
      }

      case 'list_patterns': {
        const patterns = [
          'roadmap-planning',
          'infra-module-baseline',
          'mcp-server-golden-path',
          'cicd-github-actions',
          'n8n-pipeline-ingestion',
          'audit-refactor',
          'onboarding-docs',
        ];
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ patterns }),
            },
          ],
        };
      }

      case 'get_pattern': {
        const patternName = (args as Record<string, string>)?.name;
        if (!patternName) {
          throw new Error('Pattern name is required');
        }
        return {
          content: [
            {
              type: 'text',
              text: `Use the prompt with name "${patternName}" to get the full pattern template.`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}
