import { config } from 'dotenv';
import { z } from 'zod';
import { logger } from './logger.js';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  MCP_SERVER_NAME: z.string().default('mcp-automation-hub'),
  MCP_SERVER_VERSION: z.string().default('1.0.0'),
  
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_API_VERSION: z.string().default('2024-01-01'),
  
  TWITTER_API_KEY: z.string().optional(),
  TWITTER_API_SECRET: z.string().optional(),
  TWITTER_BEARER_TOKEN: z.string().optional(),
  
  FACEBOOK_ACCESS_TOKEN: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  
  N8N_HOST: z.string().default('localhost'),
  N8N_PORT: z.string().default('5678'),
  N8N_PROTOCOL: z.enum(['http', 'https']).default('http'),
  N8N_WEBHOOK_URL: z.string().default('http://localhost:5678'),
  
  API_KEY_ROTATION_ENABLED: z.string().default('true'),
  API_KEY_ROTATION_INTERVAL_DAYS: z.string().default('90'),
  API_KEY_ROTATION_NOTIFICATION_DAYS: z.string().default('7'),
});

export type Environment = z.infer<typeof envSchema>;

let env: Environment;

try {
  env = envSchema.parse(process.env);
  logger.info('Environment configuration loaded successfully');
} catch (error) {
  logger.error('Environment configuration validation failed', { error });
  throw new Error('Invalid environment configuration');
}

export { env };
