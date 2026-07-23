import { getEnv } from "./env";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: number;
  email?: string;
  action?: string;
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: any;
}

const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  const env = getEnv();
  const currentLevel = logLevels[env.logLevel];
  const messageLevel = logLevels[level];
  return messageLevel >= currentLevel;
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (shouldLog("debug")) console.log(formatLog("debug", message, context));
  },
  info: (message: string, context?: LogContext) => {
    if (shouldLog("info")) console.log(formatLog("info", message, context));
  },
  warn: (message: string, context?: LogContext) => {
    if (shouldLog("warn")) console.warn(formatLog("warn", message, context));
  },
  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    if (shouldLog("error")) {
      const errorStr = error instanceof Error ? error.stack : String(error);
      console.error(formatLog("error", message, context));
      if (errorStr) console.error(errorStr);
    }
  },
};

// Generate unique request ID for tracing
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
