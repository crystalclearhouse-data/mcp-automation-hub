import { config } from '../config.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  const configuredLevel = (config.logLevel as LogLevel) ?? 'info';
  return levels[level] >= (levels[configuredLevel] ?? levels.info);
}

function format(level: LogLevel, message: string, ...args: unknown[]): string {
  const ts = new Date().toISOString();
  const extra = args.length > 0 ? ' ' + args.map((a) => JSON.stringify(a)).join(' ') : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${extra}`;
}

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) process.stderr.write(format('debug', message, ...args) + '\n');
  },
  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) process.stderr.write(format('info', message, ...args) + '\n');
  },
  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) process.stderr.write(format('warn', message, ...args) + '\n');
  },
  error(message: string, ...args: unknown[]): void {
    if (shouldLog('error')) process.stderr.write(format('error', message, ...args) + '\n');
  },
};
