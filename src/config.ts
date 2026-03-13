import 'dotenv/config';

export const config = {
  port: parseInt(process.env.MCP_SERVER_PORT || process.env.PORT || '3000', 10),
  logLevel: process.env.MCP_LOG_LEVEL || 'info',
  nodeEnv: process.env.NODE_ENV || 'development',

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  },

  github: {
    token: process.env.GITHUB_TOKEN || '',
    username: process.env.GITHUB_USERNAME || '',
  },

  n8n: {
    host: process.env.N8N_HOST || 'localhost',
    port: parseInt(process.env.N8N_PORT || '5678', 10),
    protocol: process.env.N8N_PROTOCOL || 'http',
    webhookUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook',
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
} as const;
