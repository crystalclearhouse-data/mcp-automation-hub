#!/usr/bin/env node
/**
 * Wave 3 — Deploy SMS Automation workflow to n8n Cloud
 * Run: node scripts/deploy-wave3.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env ─────────────────────────────────────────────────────────────────
try {
  const envPath = join(__dirname, '..', '.env');
  readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      if (key && rest.length > 0) process.env[key.trim()] = rest.join('=').trim();
    }
  });
} catch { /* no .env */ }

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://crystal-clear-data.app.n8n.cloud';
const N8N_API_KEY  = process.env.N8N_API_KEY || '';
const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || '';
const SERVER_URL   = process.env.PUBLIC_SERVER_URL || 'https://YOUR_SERVER_URL';

console.log('\n=== Wave 3 — SMS Automation Deploy ===\n');

if (!N8N_API_KEY) {
  console.error('✗ N8N_API_KEY missing in .env');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function n8nFetch(path, options = {}) {
  const res = await fetch(`${N8N_BASE_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Check credentials ─────────────────────────────────────────────────────────
function checkCredentials() {
  console.log('Credential check:');
  const checks = [
    ['N8N_API_KEY',          !!N8N_API_KEY,   N8N_API_KEY   ? '✓ set' : '✗ MISSING'],
    ['TWILIO_ACCOUNT_SID',   !!TWILIO_SID,    TWILIO_SID    ? `✓ ${TWILIO_SID.slice(0,8)}…` : '✗ MISSING'],
    ['TWILIO_AUTH_TOKEN',    !!TWILIO_TOKEN,  TWILIO_TOKEN  ? '✓ set' : '✗ MISSING'],
    ['TWILIO_PHONE_NUMBER',  !!TWILIO_PHONE,  TWILIO_PHONE  ? `✓ ${TWILIO_PHONE}` : '✗ MISSING — add after buying number'],
    ['PUBLIC_SERVER_URL',    SERVER_URL !== 'https://YOUR_SERVER_URL', SERVER_URL !== 'https://YOUR_SERVER_URL' ? `✓ ${SERVER_URL}` : '✗ MISSING — set your public URL'],
  ];
  let allGood = true;
  for (const [name, ok, label] of checks) {
    console.log(`  ${label}  (${name})`);
    if (!ok && name !== 'TWILIO_PHONE_NUMBER' && name !== 'PUBLIC_SERVER_URL') allGood = false;
  }
  console.log('');
  return allGood;
}

// ── Deploy workflow ───────────────────────────────────────────────────────────
async function deployWorkflow() {
  const workflowPath = join(__dirname, '..', 'workflows', 'sms-automation.json');
  const workflow = JSON.parse(readFileSync(workflowPath, 'utf8'));

  // Check if already deployed
  const existing = await n8nFetch('/workflows?name=SMS+Automation+%E2%80%94+Wave+3');
  const existingWorkflow = existing.data?.find(w => w.name === workflow.name);

  let workflowId;
  if (existingWorkflow) {
    console.log(`↻ Updating existing workflow (id=${existingWorkflow.id})`);
    const updated = await n8nFetch(`/workflows/${existingWorkflow.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...workflow, id: existingWorkflow.id }),
    });
    workflowId = updated.id;
    console.log(`✓ Workflow updated\n`);
  } else {
    console.log('+ Creating new workflow "SMS Automation — Wave 3"');
    const created = await n8nFetch('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
    workflowId = created.id;
    console.log(`✓ Workflow created (id=${workflowId})\n`);
  }

  // Activate it
  await n8nFetch(`/workflows/${workflowId}/activate`, { method: 'POST' });
  console.log('✓ Workflow activated\n');

  return workflowId;
}

// ── Print Twilio config instructions ─────────────────────────────────────────
function printTwilioSetup(webhookUrl) {
  console.log('─────────────────────────────────────────────');
  console.log('Twilio webhook setup (one-time):');
  console.log('');
  console.log('  1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
  console.log('  2. Click your phone number');
  console.log('  3. Under "Messaging Configuration":');
  console.log(`     A MESSAGE COMES IN → Webhook → ${webhookUrl}`);
  console.log('     HTTP POST');
  console.log('  4. Save');
  console.log('');
  console.log('Once set, every SMS to your number flows through the AI pipeline.');
  console.log('─────────────────────────────────────────────\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const credOk = checkCredentials();
  if (!credOk) {
    console.log('Fix missing credentials above, then re-run.\n');
    process.exit(1);
  }

  try {
    const workflowId = await deployWorkflow();
    const n8nWebhookUrl = `${N8N_BASE_URL}/webhook/sms-event`;
    const serverSmsUrl  = `${SERVER_URL}/webhooks/twilio/sms`;

    console.log('Webhook URLs:');
    console.log(`  n8n trigger:  ${n8nWebhookUrl}`);
    console.log(`  Server SMS:   ${serverSmsUrl}`);
    console.log('');
    console.log('Point Twilio to the Server SMS URL (your Express server handles AI + TwiML reply).');
    console.log('The server will forward events to n8n automatically for extended automation.\n');

    printTwilioSetup(serverSmsUrl);
    console.log('Wave 3 deployed successfully.\n');
  } catch (err) {
    console.error('Deploy failed:', err.message);
    process.exit(1);
  }
}

main();
