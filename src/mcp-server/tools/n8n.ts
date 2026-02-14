import { ToolHandler } from './index.js';
import { n8nClient } from '../../api/n8n/client.js';
import { logger } from '../../utils/logger.js';

export const n8nToolHandlers: Record<string, ToolHandler> = {
  n8n_trigger_workflow: {
    name: 'n8n_trigger_workflow',
    description: 'Trigger an n8n workflow',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Workflow ID' },
        data: { type: 'object', description: 'Input data for workflow' },
      },
      required: ['workflowId'],
    },
    execute: async (args) => {
      try {
        const result = await n8nClient.triggerWorkflow({
          workflowId: args.workflowId as string,
          data: args.data as Record<string, unknown>,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('n8n workflow trigger failed', { error });
        throw error;
      }
    },
  },

  n8n_get_execution: {
    name: 'n8n_get_execution',
    description: 'Get execution status of an n8n workflow',
    inputSchema: {
      type: 'object',
      properties: {
        executionId: { type: 'string', description: 'Execution ID' },
      },
      required: ['executionId'],
    },
    execute: async (args) => {
      try {
        const result = await n8nClient.getExecution({
          executionId: args.executionId as string,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('n8n execution query failed', { error });
        throw error;
      }
    },
  },

  n8n_list_workflows: {
    name: 'n8n_list_workflows',
    description: 'List all n8n workflows',
    inputSchema: {
      type: 'object',
      properties: {
        active: { type: 'boolean', description: 'Filter by active status' },
      },
    },
    execute: async (args) => {
      try {
        const result = await n8nClient.listWorkflows({
          active: args.active as boolean,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error('n8n workflow list failed', { error });
        throw error;
      }
    },
  },
};
