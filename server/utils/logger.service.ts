import { appendFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export type LogLevel = "DEBUG" | "INFO" | "ERROR" | "WARN";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
  };
}

const LOG_DIR = join(process.cwd(), "storage", "logs");
const LOG_FILE = join(LOG_DIR, "app.log");

const logLevelPriority = (level: LogLevel): number => {
  switch (level) {
    case "DEBUG": return 0;
    case "INFO": return 1;
    case "WARN": return 2;
    case "ERROR": return 3;
    default: return 1;
  }
};

const currentLogLevel = (): LogLevel => {
  const env = process.env.LOG_LEVEL?.toUpperCase() as LogLevel;
  if (["DEBUG", "INFO", "WARN", "ERROR"].includes(env)) {
    return env;
  }
  return "INFO";
};

const shouldLog = (level: LogLevel): boolean => {
  return logLevelPriority(level) >= logLevelPriority(currentLogLevel());
};

const ensureLogDir = async (): Promise<void> => {
  if (!existsSync(LOG_DIR)) {
    await mkdir(LOG_DIR, { recursive: true });
  }
};

const formatLogEntry = (entry: LogEntry): string => {
  const base = `[${entry.timestamp}] [${entry.level}] ${entry.message}`;
  if (entry.context && Object.keys(entry.context).length > 0) {
    return `${base} | ${JSON.stringify(entry.context)}`;
  }
  return base;
};

export const loggerService = () => {
  const log = async (level: LogLevel, message: string, context?: Record<string, unknown>): Promise<void> => {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };

    const line = formatLogEntry(entry) + "\n";

    try {
      await ensureLogDir();
      await appendFile(LOG_FILE, line);
    } catch (error) {
      console.error("[Logger] Failed to write to log file:", error);
    }
  };

  const debug = (message: string, context?: Record<string, unknown>): Promise<void> =>
    log("DEBUG", message, context);

  const info = (message: string, context?: Record<string, unknown>): Promise<void> =>
    log("INFO", message, context);

  const warn = (message: string, context?: Record<string, unknown>): Promise<void> =>
    log("WARN", message, context);

  const error = (
    message: string,
    errorOrContext?: Error | Record<string, unknown>,
    maybeContext?: Record<string, unknown>
  ): Promise<void> => {
    let errorObj: Error | undefined;
    let context: Record<string, unknown> | undefined;

    if (errorOrContext instanceof Error) {
      errorObj = errorOrContext;
      context = maybeContext;
    } else if (errorOrContext) {
      context = errorOrContext;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      message,
      context,
      error: errorObj
        ? { message: errorObj.message, stack: errorObj.stack }
        : undefined
    };

    const line = formatLogEntry(entry) + "\n";

    return (async () => {
      try {
        await ensureLogDir();
        await appendFile(LOG_FILE, line);
      } catch (e) {
        console.error("[Logger] Failed to write to log file:", e);
      }
    })();
  };

  return {
    debug,
    info,
    warn,
    error
  };
};

export type LoggerService = ReturnType<typeof loggerService>;