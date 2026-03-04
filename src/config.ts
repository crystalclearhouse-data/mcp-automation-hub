import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.MCP_SERVER_PORT ?? process.env.PORT ?? '3000', 10),
  logLevel: process.env.MCP_LOG_LEVEL ?? 'info',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  n8n: {
    host: process.env.N8N_HOST ?? 'localhost',
    port: parseInt(process.env.N8N_PORT ?? '5678', 10),
    protocol: process.env.N8N_PROTOCOL ?? 'http',
    apiUrl: process.env.N8N_API_URL ?? 'http://localhost:5678',
    apiKey: process.env.N8N_API_KEY ?? '',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
  },
  supabase: {
    url: process.env.SUPABASE_URL ?? '',
    anonKey: process.env.SUPABASE_ANON_KEY ?? '',
  },
  github: {
    token: process.env.GITHUB_TOKEN ?? '',
  },
} as const;
