/**
 * Structured logging used everywhere across the app.
 * - Dev: human-readable colored output.
 * - Prod: JSON lines, ready to ship to an aggregator (Datadog, Logtail, etc.).
 */

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown> | undefined;

const isProd = process.env.NODE_ENV === "production";
const isBrowser = typeof window !== "undefined";

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m",
  info: "\x1b[36m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, (_key, val) => {
      if (val instanceof Error) {
        return { name: val.name, message: val.message, stack: val.stack };
      }
      return val;
    });
  } catch {
    return "[unserializable]";
  }
}

function emit(level: LogLevel, event: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const payload = {
    timestamp,
    level,
    event,
    ...(context ?? {}),
  };

  if (isProd) {
    // Structured JSON for production aggregation.
    const output = safeStringify(payload);
    if (level === "error") console.error(output);
    else if (level === "warn") console.warn(output);
    else console.log(output);
    return;
  }

  // Pretty dev output.
  if (isBrowser) {
    const prefix = `%c[${level.toUpperCase()}] %c${event}`;
    const levelColor = level === "error" ? "#dc2626" : level === "warn" ? "#f59e0b" : level === "info" ? "#40d99d" : "#6b7280";
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    fn(prefix, `color: ${levelColor}; font-weight: bold`, "color: #1a1a1a; font-weight: 500", context ?? "");
    return;
  }

  const color = LEVEL_COLORS[level];
  const head = `${DIM}${timestamp}${RESET} ${color}${BOLD}${level.toUpperCase().padEnd(5)}${RESET} ${event}`;
  const tail = context ? ` ${DIM}${safeStringify(context)}${RESET}` : "";
  const line = head + tail;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, context?: LogContext): void => emit("debug", event, context),
  info: (event: string, context?: LogContext): void => emit("info", event, context),
  warn: (event: string, context?: LogContext): void => emit("warn", event, context),
  error: (event: string, context?: LogContext): void => emit("error", event, context),
};

export type Logger = typeof logger;
