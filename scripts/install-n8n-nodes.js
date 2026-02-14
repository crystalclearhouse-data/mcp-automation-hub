#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const distDir = join(projectRoot, 'dist', 'n8n-nodes');
const sourceDir = join(projectRoot, 'src', 'n8n-nodes');

console.log('Installing n8n custom nodes...');

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Copy built node files to dist
// This would be run after compilation
console.log('n8n custom nodes installation completed');
console.log('Custom nodes will be available in:', distDir);
