type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getConfiguredLevel(): LogLevel {
  const level = (process.env.MCP_LOG_LEVEL ?? 'info').toLowerCase() as LogLevel;
  return level in LOG_LEVELS ? level : 'info';
}

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
  const ts = new Date().toISOString();
  const extra = args.length > 0 ? ' ' + args.map((a) => JSON.stringify(a)).join(' ') : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${extra}`;
}

function log(level: LogLevel, message: string, ...args: unknown[]): void {
  if (LOG_LEVELS[level] >= LOG_LEVELS[getConfiguredLevel()]) {
    const formatted = formatMessage(level, message, ...args);
    if (level === 'error') {
      process.stderr.write(formatted + '\n');
    } else {
      process.stdout.write(formatted + '\n');
    }
  }
}

export const logger = {
  debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
  info: (message: string, ...args: unknown[]) => log('info', message, ...args),
  warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
  error: (message: string, ...args: unknown[]) => log('error', message, ...args),
};
