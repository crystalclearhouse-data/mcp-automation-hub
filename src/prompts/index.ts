import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger.js';

export function registerPrompts(server: Server): void {
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: 'automation_setup',
        description: 'Get step-by-step guidance for setting up a new automation workflow.',
        arguments: [
          {
            name: 'workflow_type',
            description: 'Type of workflow (e.g., "content-publishing", "data-sync", "notifications")',
            required: true,
          },
        ],
      },
      {
        name: 'debug_workflow',
        description: 'Get help debugging a failing n8n workflow or integration.',
        arguments: [
          {
            name: 'error_description',
            description: 'Describe the error or issue you are experiencing.',
            required: true,
          },
        ],
      },
    ],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.debug(`Prompt requested: ${name}`);

    switch (name) {
      case 'automation_setup': {
        const workflowType = args?.workflow_type ?? 'general';
        return {
          description: `Setup guide for ${workflowType} automation`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I need help setting up a "${workflowType}" automation workflow using the MCP Automation Hub and n8n.

Please guide me through:
1. What n8n nodes I'll need
2. How to configure the relevant API integrations (check which services are configured using list_configured_services)
3. Step-by-step workflow setup
4. How to test and deploy it

Start by checking the current health and configured services.`,
              },
            },
          ],
        };
      }

      case 'debug_workflow': {
        const errorDescription = args?.error_description ?? 'unknown error';
        return {
          description: 'Workflow debugging assistant',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I'm experiencing an issue with my automation workflow: "${errorDescription}"

Please help me debug this by:
1. First running health_check to verify the server and services are operational
2. Checking which integrations are configured with list_configured_services
3. Identifying likely root causes based on the error description
4. Providing specific steps to resolve the issue

Be specific and actionable in your recommendations.`,
              },
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  });
}
