import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getHealthStatus } from './health-check.js';
import { BILLING_TOOL_DEFINITIONS, handleBillingTool } from './billing.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import {
  listWorkflows,
  getWorkflow,
  activateWorkflow,
  deactivateWorkflow,
  triggerWebhookWorkflow,
  listExecutions,
  getExecution,
  pingN8n,
} from '../services/n8n.js';
import { sendSMS, makeCall } from '../services/twilio.js';
import { classifyIncomingSMS, generateCallScript, answerQuestion } from '../services/aiAgent.js';

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
      // ── n8n tools ─────────────────────────────────────────────────────────
      {
        name: 'n8n_ping',
        description: 'Ping the n8n cloud instance to verify API connectivity.',
        inputSchema: { type: 'object', properties: {}, required: [] },
      },
      {
        name: 'n8n_list_workflows',
        description: 'List all workflows in the n8n cloud instance.',
        inputSchema: { type: 'object', properties: {}, required: [] },
      },
      {
        name: 'n8n_get_workflow',
        description: 'Get details of a specific n8n workflow by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            workflow_id: { type: 'string', description: 'The n8n workflow ID' },
          },
          required: ['workflow_id'],
        },
      },
      {
        name: 'n8n_activate_workflow',
        description: 'Activate (enable) an n8n workflow by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            workflow_id: { type: 'string', description: 'The n8n workflow ID' },
          },
          required: ['workflow_id'],
        },
      },
      {
        name: 'n8n_deactivate_workflow',
        description: 'Deactivate (disable) an n8n workflow by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            workflow_id: { type: 'string', description: 'The n8n workflow ID' },
          },
          required: ['workflow_id'],
        },
      },
      {
        name: 'n8n_trigger_webhook',
        description: 'Trigger an n8n workflow via its webhook URL. Use the webhook path (e.g. "my-workflow") and optional JSON payload.',
        inputSchema: {
          type: 'object',
          properties: {
            webhook_path: { type: 'string', description: 'Webhook path segment after /webhook/' },
            payload: { type: 'object', description: 'Optional JSON payload to send', additionalProperties: true },
          },
          required: ['webhook_path'],
        },
      },
      {
        name: 'n8n_list_executions',
        description: 'List recent n8n workflow executions. Optionally filter by workflow ID.',
        inputSchema: {
          type: 'object',
          properties: {
            workflow_id: { type: 'string', description: 'Filter by workflow ID (optional)' },
            limit: { type: 'number', description: 'Max results (default 20)' },
          },
          required: [],
        },
      },
      {
        name: 'n8n_get_execution',
        description: 'Get details of a specific n8n execution by ID.',
        inputSchema: {
          type: 'object',
          properties: {
            execution_id: { type: 'string', description: 'The execution ID' },
          },
          required: ['execution_id'],
        },
      },
      ...BILLING_TOOL_DEFINITIONS,
      // ── Twilio tools ───────────────────────────────────────────────────────
      {
        name: 'twilio_send_sms',
        description: 'Send an SMS message via Twilio to a single recipient.',
        inputSchema: {
          type: 'object',
          properties: {
            to: { type: 'string', description: 'Recipient phone number in E.164 format (e.g. +15551234567)' },
            message: { type: 'string', description: 'SMS message body' },
          },
          required: ['to', 'message'],
        },
      },
      {
        name: 'twilio_make_call',
        description: 'Initiate an outbound phone call via Twilio with a TwiML URL to control call flow.',
        inputSchema: {
          type: 'object',
          properties: {
            to: { type: 'string', description: 'Recipient phone number in E.164 format' },
            twiml_url: { type: 'string', description: 'Publicly accessible URL returning TwiML instructions' },
          },
          required: ['to', 'twiml_url'],
        },
      },
      {
        name: 'twilio_sms_blast',
        description: 'Send the same SMS message to multiple recipients in parallel.',
        inputSchema: {
          type: 'object',
          properties: {
            numbers: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of recipient phone numbers in E.164 format',
            },
            message: { type: 'string', description: 'SMS message body to send to all recipients' },
          },
          required: ['numbers', 'message'],
        },
      },
      // ── AI / Claude tools ─────────────────────────────────────────────────
      {
        name: 'ai_classify_sms',
        description: 'Use Claude AI to classify an incoming SMS message intent and draft a short reply. Returns intent, reply, and optional action.',
        inputSchema: {
          type: 'object',
          properties: {
            from_number: { type: 'string', description: 'Sender phone number in E.164 format' },
            message: { type: 'string', description: 'Incoming SMS message body' },
          },
          required: ['from_number', 'message'],
        },
      },
      {
        name: 'ai_generate_call_script',
        description: 'Use Claude AI to generate a short TwiML-ready call script for a given purpose.',
        inputSchema: {
          type: 'object',
          properties: {
            purpose: { type: 'string', description: 'Purpose or topic of the phone call' },
            customer_name: { type: 'string', description: 'Optional customer name to personalise the script' },
          },
          required: ['purpose'],
        },
      },
      {
        name: 'ai_answer',
        description: 'Use Claude AI to answer a question given optional context from the automation hub.',
        inputSchema: {
          type: 'object',
          properties: {
            question: { type: 'string', description: 'The question to answer' },
            context: { type: 'string', description: 'Optional context to inform the answer' },
          },
          required: ['question'],
        },
      },
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
        const result = await pingN8n();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  configured: Boolean(config.n8n.apiKey),
                  url: config.n8n.baseUrl,
                  webhookBaseUrl: config.n8n.webhookBaseUrl,
                  connected: result.ok,
                  error: result.error,
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

      // ── n8n handlers ───────────────────────────────────────────────────────
      case 'n8n_ping': {
        const result = await pingN8n();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'n8n_list_workflows': {
        const workflows = await listWorkflows();
        return { content: [{ type: 'text', text: JSON.stringify(workflows, null, 2) }] };
      }

      case 'n8n_get_workflow': {
        const workflow = await getWorkflow(args['workflow_id'] as string);
        return { content: [{ type: 'text', text: JSON.stringify(workflow, null, 2) }] };
      }

      case 'n8n_activate_workflow': {
        const workflow = await activateWorkflow(args['workflow_id'] as string);
        return { content: [{ type: 'text', text: JSON.stringify(workflow, null, 2) }] };
      }

      case 'n8n_deactivate_workflow': {
        const workflow = await deactivateWorkflow(args['workflow_id'] as string);
        return { content: [{ type: 'text', text: JSON.stringify(workflow, null, 2) }] };
      }

      case 'n8n_trigger_webhook': {
        const result = await triggerWebhookWorkflow(
          args['webhook_path'] as string,
          (args['payload'] as Record<string, unknown>) ?? {}
        );
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'n8n_list_executions': {
        const executions = await listExecutions(
          args['workflow_id'] as string | undefined,
          (args['limit'] as number) ?? 20
        );
        return { content: [{ type: 'text', text: JSON.stringify(executions, null, 2) }] };
      }

      case 'n8n_get_execution': {
        const execution = await getExecution(args['execution_id'] as string);
        return { content: [{ type: 'text', text: JSON.stringify(execution, null, 2) }] };
      }

      // ── Twilio handlers ────────────────────────────────────────────────────
      case 'twilio_send_sms': {
        const result = await sendSMS(args['to'] as string, args['message'] as string);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'twilio_make_call': {
        const result = await makeCall(args['to'] as string, args['twiml_url'] as string);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }

      case 'twilio_sms_blast': {
        const numbers = args['numbers'] as string[];
        const message = args['message'] as string;
        const results = await Promise.all(
          numbers.map(async (to) => {
            try {
              const res = await sendSMS(to, message);
              return { to, success: true, sid: res.sid };
            } catch (err: unknown) {
              return { to, success: false, error: err instanceof Error ? err.message : String(err) };
            }
          })
        );
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}
