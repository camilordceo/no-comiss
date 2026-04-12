/**
 * Structured logger for NoComiss.
 * Dev: colored console output  |  Prod: JSON lines (ready for log aggregation)
 */

type LogLevel = "debug" | "info" | "warn" | "error";
type LogMeta = Record<string, unknown>;

const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m",   // gray
  info:  "\x1b[36m",   // cyan
  warn:  "\x1b[33m",   // yellow
  error: "\x1b[31m",   // red
};
const RESET = "\x1b[0m";

const IS_PROD = process.env.NODE_ENV === "production";

function log(level: LogLevel, event: string, meta?: LogMeta) {
  const ts = new Date().toISOString();

  if (IS_PROD) {
    // Structured JSON — parse-friendly for Vercel/Datadog/etc.
    process.stdout.write(
      JSON.stringify({ ts, level, event, ...meta }) + "\n"
    );
    return;
  }

  // Dev: human-readable colored output
  const color = COLORS[level];
  const label = level.toUpperCase().padEnd(5);
  const metaStr = meta && Object.keys(meta).length
    ? " " + JSON.stringify(meta)
    : "";
  console.log(`${color}[${label}]${RESET} ${ts} ${event}${metaStr}`);
}

export const logger = {
  debug: (event: string, meta?: LogMeta) => log("debug", event, meta),
  info:  (event: string, meta?: LogMeta) => log("info",  event, meta),
  warn:  (event: string, meta?: LogMeta) => log("warn",  event, meta),
  error: (event: string, meta?: LogMeta) => log("error", event, meta),
};
