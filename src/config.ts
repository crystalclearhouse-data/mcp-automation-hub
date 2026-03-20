import 'dotenv/config';

export const config = {
  port: parseInt(process.env.MCP_SERVER_PORT || process.env.PORT || '3000', 10),
  logLevel: process.env.MCP_LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
  },

  github: {
    token: process.env.GITHUB_TOKEN || '',
    username: process.env.GITHUB_USERNAME || '',
  },

  n8n: {
    apiKey: process.env.N8N_API_KEY || '',
    baseUrl: process.env.N8N_BASE_URL || 'https://crystal-clear-data.app.n8n.cloud',
    webhookBaseUrl: process.env.N8N_WEBHOOK_BASE_URL || 'https://crystal-clear-data.app.n8n.cloud/webhook',
    // Legacy fields
    host: process.env.N8N_HOST || 'crystal-clear-data.app.n8n.cloud',
    port: parseInt(process.env.N8N_PORT || '443', 10),
    protocol: process.env.N8N_PROTOCOL || 'https',
    webhookUrl: process.env.N8N_WEBHOOK_URL || 'https://crystal-clear-data.app.n8n.cloud/webhook',
    stripeWebhookUrl: process.env.N8N_STRIPE_WEBHOOK_URL || '',
  },

  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    mcpSid: process.env.TWILIO_MCP_SID || '',
  },

  crewai: {
    apiKey: process.env.CREWAI_API_KEY || '',
  },

  ngrok: {
    authToken: process.env.NGROK_AUTH_TOKEN || '',
  },
} as const;

// Convenience exports for Anthropic SDK consumers
export const anthropicApiKey = config.anthropic.apiKey;
export const anthropicModel = config.anthropic.model;
