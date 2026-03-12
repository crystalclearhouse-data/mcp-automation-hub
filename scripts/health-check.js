#!/usr/bin/env node

/**
 * Health Check Script for MCP Automation Hub
 * Run: node scripts/health-check.js
 */

import os from 'os';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env if present
try {
  const envPath = join(__dirname, '..', '.env');
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      if (key && rest.length > 0) {
        process.env[key.trim()] = rest.join('=').trim();
      }
    }
  });
} catch {
  // No .env file — that's fine
}

const totalMem = os.totalmem();
const freeMem = os.freemem();
const usedPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

const services = {
  anthropic: Boolean(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('YOUR')),
  github: Boolean(process.env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN.includes('YOUR')),
  supabase: Boolean(process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('your-project')),
  stripe: Boolean(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('YOUR')),
  n8n: {
    host: process.env.N8N_HOST || 'localhost',
    port: process.env.N8N_PORT || '5678',
    url: `${process.env.N8N_PROTOCOL || 'http'}://${process.env.N8N_HOST || 'localhost'}:${process.env.N8N_PORT || '5678'}`,
  },
};

const configuredCount = [services.anthropic, services.github, services.supabase, services.stripe].filter(Boolean).length;
const status = configuredCount === 0 ? 'unconfigured' : configuredCount < 2 ? 'degraded' : 'healthy';

const report = {
  status,
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
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
  configuredServicesCount: configuredCount,
};

console.log('\n=== MCP Automation Hub Health Check ===\n');
console.log(JSON.stringify(report, null, 2));
console.log('\n');

if (status === 'healthy') {
  console.log('✓ Status: HEALTHY — All key services configured\n');
} else if (status === 'degraded') {
  console.log('⚠ Status: DEGRADED — Some services not configured\n');
} else {
  console.log('✗ Status: UNCONFIGURED — Copy .env.example to .env and fill in your keys\n');
}
