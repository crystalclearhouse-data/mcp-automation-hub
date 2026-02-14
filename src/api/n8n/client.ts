import axios from 'axios';
import { env } from '../../utils/env.js';
import { logger } from '../../utils/logger.js';

class N8nClient {
  private getBaseUrl(): string {
    return `${env.N8N_PROTOCOL}://${env.N8N_HOST}:${env.N8N_PORT}`;
  }

  async triggerWorkflow(params: { workflowId: string; data?: Record<string, unknown> }) {
    logger.debug('Triggering n8n workflow', { workflowId: params.workflowId });

    try {
      const response = await axios.post(
        `${this.getBaseUrl()}/webhook/${params.workflowId}`,
        params.data || {}
      );
      logger.info('n8n workflow triggered', { workflowId: params.workflowId });
      return response.data;
    } catch (error) {
      logger.error('Failed to trigger n8n workflow', { error });
      throw error;
    }
  }

  async getExecution(params: { executionId: string }) {
    logger.debug('Getting n8n execution', { executionId: params.executionId });

    try {
      const response = await axios.get(
        `${this.getBaseUrl()}/api/v1/executions/${params.executionId}`
      );
      logger.info('n8n execution retrieved', { executionId: params.executionId });
      return response.data;
    } catch (error) {
      logger.error('Failed to get n8n execution', { error });
      throw error;
    }
  }

  async listWorkflows(params?: { active?: boolean }) {
    logger.debug('Listing n8n workflows', params);

    try {
      const response = await axios.get(`${this.getBaseUrl()}/api/v1/workflows`, {
        params: { active: params?.active },
      });
      logger.info('n8n workflows listed', { count: response.data.data?.length });
      return response.data;
    } catch (error) {
      logger.error('Failed to list n8n workflows', { error });
      throw error;
    }
  }
}

export const n8nClient = new N8nClient();
