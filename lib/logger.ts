type LogContext = Record<string, unknown>;

type LogLevel = 'info' | 'warn' | 'error';

function writeLog(level: LogLevel, event: string, context: LogContext = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  };

  const message = JSON.stringify(entry);

  if (level === 'error') {
    console.error(message);
    return;
  }

  if (level === 'warn') {
    console.warn(message);
    return;
  }

  console.info(message);
}

function getSafeErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      type: typeof error,
    };
  }

  if (process.env.NODE_ENV === 'production') {
    return {
      name: error.name,
    };
  }

  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

export function logInfo(event: string, context: LogContext = {}) {
  writeLog('info', event, context);
}

export function logWarn(event: string, context: LogContext = {}) {
  writeLog('warn', event, context);
}

export function logError(
  event: string,
  error: unknown,
  context: LogContext = {}
) {
  writeLog('error', event, {
    ...context,
    error: getSafeErrorDetails(error),
  });
}

export function logErrorEvent(event: string, context: LogContext = {}) {
  writeLog('error', event, context);
}

