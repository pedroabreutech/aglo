const ANSI = {
  reset: "\x1b[0m",
  info: "\x1b[32m", // green
  error: "\x1b[31m", // red
  warn: "\x1b[33m", // yellow
};

type LogLevel = "INFO" | "WARN" | "ERROR";

interface LogFields {
  [key: string]: unknown;
}

const colorize = (level: LogLevel, str: string): string => {
  if (!process.stdout.isTTY) return str;

  const colors: Record<LogLevel, string> = {
    INFO: ANSI.info,
    WARN: ANSI.warn,
    ERROR: ANSI.error,
  };

  return `${colors[level] || ANSI.reset}${str}${ANSI.reset}`;
};

export const createLogger = (handler: string) => {
  const log = (
    level: LogLevel,
    event: string,
    fields: LogFields = {},
    err?: Error | unknown,
  ) => {
    const timestamp = new Date().toISOString();

    const payload: Record<string, unknown> = {
      timestamp,
      level,
      handler,
      event,
      ...fields,
    };
    if (err) {
      if (err instanceof Error) {
        payload.error = err.message;
        payload.stack = err.stack;
      } else {
        payload.error = String(err);
      }
    }

    const jsonLine = JSON.stringify(payload);
    const finalLog = colorize(level, jsonLine);

    if (level === "ERROR") console.error(finalLog);
    else if (level === "WARN") console.warn(finalLog);
    else console.log(finalLog);
  };

  return {
    info: (event: string, fields?: LogFields) => log("INFO", event, fields),
    warn: (event: string, fields?: LogFields) => log("WARN", event, fields),
    error: (event: string, err?: Error | unknown, fields?: LogFields) =>
      log("ERROR", event, fields, err),
  };
};
