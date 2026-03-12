#!/usr/bin/env node

/**
 * Deploy workflows to n8n
 * Run: node scripts/deploy-to-n8n.js
 */

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
      if (key && rest.length > 0) process.env[key.trim()] = rest.join('=').trim();
    }
  });
} catch {
  // No .env file
}

const N8N_HOST = process.env.N8N_HOST || 'localhost';
const N8N_PORT = process.env.N8N_PORT || '5678';
const N8N_PROTOCOL = process.env.N8N_PROTOCOL || 'http';
const N8N_BASE_URL = `${N8N_PROTOCOL}://${N8N_HOST}:${N8N_PORT}`;

console.log('\n=== MCP Automation Hub — Deploy to n8n ===\n');
console.log(`Target n8n instance: ${N8N_BASE_URL}`);

async function checkN8nConnection() {
  try {
    const res = await fetch(`${N8N_BASE_URL}/healthz`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      console.log('✓ n8n is reachable\n');
      return true;
    }
    console.log(`✗ n8n responded with status: ${res.status}\n`);
    return false;
  } catch (err) {
    console.log(`✗ Cannot reach n8n at ${N8N_BASE_URL}`);
    console.log(`  Error: ${err.message}`);
    console.log('\n  To start n8n:');
    console.log('    npx n8n start');
    console.log('  Or with Docker:');
    console.log('    docker run -it --rm -p 5678:5678 n8nio/n8n\n');
    return false;
  }
}

async function main() {
  const connected = await checkN8nConnection();

  if (!connected) {
    console.log('Deployment skipped — start n8n first, then re-run this script.\n');
    process.exit(1);
  }

  console.log('n8n is running. To deploy workflows:');
  console.log(`  1. Open ${N8N_BASE_URL} in your browser`);
  console.log('  2. Import workflow JSON files from the workflows/ directory');
  console.log('  3. Configure credentials for each workflow');
  console.log('  4. Activate workflows\n');

  console.log('n8n Webhook URL:', process.env.N8N_WEBHOOK_URL || `${N8N_BASE_URL}/webhook`);
  console.log('\nDone.\n');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
