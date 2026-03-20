import axios, { AxiosInstance } from 'axios';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: Array<{ id: string; name: string }>;
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  status: 'success' | 'error' | 'running' | 'waiting';
}

export interface N8nWorkflowRun {
  executionId?: string;
  status: 'triggered' | 'error';
  message?: string;
}

function createClient(): AxiosInstance {
  return axios.create({
    baseURL: `${config.n8n.baseUrl}/api/v1`,
    headers: {
      'X-N8N-API-KEY': config.n8n.apiKey,
      'Content-Type': 'application/json',
    },
    timeout: 15_000,
  });
}

export async function listWorkflows(): Promise<N8nWorkflow[]> {
  const client = createClient();
  const res = await client.get<{ data: N8nWorkflow[] }>('/workflows');
  return res.data.data ?? [];
}

export async function getWorkflow(id: string): Promise<N8nWorkflow> {
  const client = createClient();
  const res = await client.get<N8nWorkflow>(`/workflows/${id}`);
  return res.data;
}

export async function activateWorkflow(id: string): Promise<N8nWorkflow> {
  const client = createClient();
  const res = await client.patch<N8nWorkflow>(`/workflows/${id}`, { active: true });
  return res.data;
}

export async function deactivateWorkflow(id: string): Promise<N8nWorkflow> {
  const client = createClient();
  const res = await client.patch<N8nWorkflow>(`/workflows/${id}`, { active: false });
  return res.data;
}

export async function triggerWebhookWorkflow(
  webhookPath: string,
  payload: Record<string, unknown> = {}
): Promise<N8nWorkflowRun> {
  try {
    const url = `${config.n8n.webhookBaseUrl}/${webhookPath}`;
    logger.debug(`Triggering n8n webhook: ${url}`);
    const res = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30_000,
    });
    return { status: 'triggered', executionId: res.data?.executionId, message: JSON.stringify(res.data) };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('n8n webhook trigger failed:', message);
    return { status: 'error', message };
  }
}

export async function listExecutions(workflowId?: string, limit = 20): Promise<N8nExecution[]> {
  const client = createClient();
  const params: Record<string, unknown> = { limit };
  if (workflowId) params.workflowId = workflowId;
  const res = await client.get<{ data: N8nExecution[] }>('/executions', { params });
  return res.data.data ?? [];
}

export async function getExecution(id: string): Promise<N8nExecution> {
  const client = createClient();
  const res = await client.get<N8nExecution>(`/executions/${id}`);
  return res.data;
}

export async function pingN8n(): Promise<{ ok: boolean; url: string; error?: string }> {
  try {
    const client = createClient();
    await client.get('/workflows', { params: { limit: 1 } });
    return { ok: true, url: config.n8n.baseUrl };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return { ok: false, url: config.n8n.baseUrl, error };
  }
}
