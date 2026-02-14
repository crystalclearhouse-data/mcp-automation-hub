#!/usr/bin/env node

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const logsDir = join(process.cwd(), 'logs');

if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
  console.log('Created logs directory');
}

console.log('Prepare script completed');
