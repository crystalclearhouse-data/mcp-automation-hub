import os from 'os';
import { config } from '../config.js';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  version: string;
  environment: string;
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
    memory: {
      totalMB: number;
      freeMB: number;
      usedPercent: number;
    };
    cpuCount: number;
  };
  services: {
    n8n: { configured: boolean; url: string };
    supabase: { configured: boolean };
    anthropic: { configured: boolean };
    github: { configured: boolean };
    stripe: { configured: boolean };
  };
}

export function getHealthStatus(): HealthStatus {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

  const services = {
    n8n: {
      configured: Boolean(config.n8n.host && config.n8n.port),
      url: `${config.n8n.protocol}://${config.n8n.host}:${config.n8n.port}`,
    },
    supabase: { configured: Boolean(config.supabase.url && config.supabase.anonKey) },
    anthropic: { configured: Boolean(config.anthropic.apiKey) },
    github: { configured: Boolean(config.github.token) },
    stripe: { configured: Boolean(config.stripe.secretKey) },
  };

  const allCriticalConfigured = services.anthropic.configured;
  const status: HealthStatus['status'] = allCriticalConfigured ? 'healthy' : 'degraded';

  return {
    status,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      memory: {
        totalMB: Math.round(totalMem / 1024 / 1024),
        freeMB: Math.round(freeMem / 1024 / 1024),
        usedPercent,
      },
      cpuCount: os.cpus().length,
    },
    services,
  };
}
