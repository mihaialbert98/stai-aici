type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isProduction = process.env.NODE_ENV === 'production';
const minLevel = isProduction ? 'info' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function formatError(err: unknown): { message: string; stack?: string } | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
    };
  }
  return { message: String(err) };
}

function formatLogEntry(entry: LogEntry): string {
  if (isProduction) {
    // JSON format for production (Vercel logs)
    return JSON.stringify(entry);
  }

  // Pretty format for development
  const timestamp = new Date(entry.timestamp).toLocaleTimeString();
  const levelColor = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  }[entry.level];
  const reset = '\x1b[0m';

  let output = `${timestamp} ${levelColor}[${entry.level.toUpperCase()}]${reset} ${entry.message}`;

  if (entry.context && Object.keys(entry.context).length > 0) {
    output += ` ${JSON.stringify(entry.context)}`;
  }

  if (entry.error) {
    output += `\n  Error: ${entry.error.message}`;
    if (entry.error.stack && !isProduction) {
      output += `\n  ${entry.error.stack.split('\n').slice(1).join('\n  ')}`;
    }
  }

  return output;
}

function log(level: LogLevel, message: string, context?: LogContext, err?: unknown): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error: formatError(err),
  };

  const formatted = formatLogEntry(entry);

  switch (level) {
    case 'debug':
    case 'info':
      // eslint-disable-next-line no-console
      console.log(formatted);
      break;
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(formatted);
      break;
    case 'error':
      // eslint-disable-next-line no-console
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    log('debug', message, context);
  },

  info(message: string, context?: LogContext): void {
    log('info', message, context);
  },

  warn(message: string, context?: LogContext): void {
    log('warn', message, context);
  },

  error(message: string, err?: unknown, context?: LogContext): void {
    log('error', message, context, err);
  },

  /** Create a child logger with preset context */
  child(baseContext: LogContext) {
    return {
      debug: (message: string, context?: LogContext) =>
        log('debug', message, { ...baseContext, ...context }),
      info: (message: string, context?: LogContext) =>
        log('info', message, { ...baseContext, ...context }),
      warn: (message: string, context?: LogContext) =>
        log('warn', message, { ...baseContext, ...context }),
      error: (message: string, err?: unknown, context?: LogContext) =>
        log('error', message, { ...baseContext, ...context }, err),
    };
  },
};
