type ServerErrorSeverity = 'warning' | 'error' | 'critical';

type ServerErrorContext = {
  source: string;
  severity?: ServerErrorSeverity;
  tags?: string[];
  requestId?: string;
  extra?: Record<string, unknown>;
};

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development';
const RELEASE =
  process.env.NEXT_PUBLIC_RELEASE_VERSION ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  'local-dev';

const toErrorShape = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: 'UnknownError',
    message: typeof error === 'string' ? error : JSON.stringify(error),
    stack: undefined,
  };
};

export const captureServerError = async (
  error: unknown,
  context: ServerErrorContext
) => {
  const payload = {
    runtime: 'server',
    severity: context.severity || 'error',
    source: context.source,
    tags: context.tags || [],
    requestId: context.requestId,
    error: toErrorShape(error),
    metadata: {
      environment: APP_ENV,
      release: RELEASE,
      timestamp: new Date().toISOString(),
    },
    extra: context.extra || {},
  };

  console.error('[monitoring] server error captured', payload);

  const webhook = process.env.MONITORING_ALERT_WEBHOOK_URL;
  if (!webhook || payload.severity !== 'critical') {
    return;
  }

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Alert forwarding must never break request handling.
  }
};
