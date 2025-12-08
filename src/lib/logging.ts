type LogContext = Record<string, string | number | boolean | undefined>;

export function logError(message: string, context: LogContext = {}) {
  if (process.env.SENTRY_DSN) {
    // Placeholder for future Sentry integration
    // eslint-disable-next-line no-console
    console.error(`[sentry] ${message}`, context);
  } else {
    // eslint-disable-next-line no-console
    console.warn(`[app-error] ${message}`, context);
  }
}
