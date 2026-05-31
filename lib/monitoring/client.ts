'use client';

type ClientErrorSeverity = 'warning' | 'error' | 'critical';

type ClientErrorContext = {
  source: string;
  severity?: ClientErrorSeverity;
  tags?: string[];
  extra?: Record<string, unknown>;
};

const APP_ENV =
  process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development';

const RELEASE =
  process.env.NEXT_PUBLIC_RELEASE_VERSION ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  'local-dev';

const parseError = (error: unknown) => {
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

export const captureClientError = async (
  error: unknown,
  context: ClientErrorContext
) => {
  if (typeof window === 'undefined') {
    return;
  }

  const parsed = parseError(error);

  const payload = {
    runtime: 'client',
    severity: context.severity || 'error',
    source: context.source,
    tags: context.tags || [],
    error: parsed,
    metadata: {
      environment: APP_ENV,
      release: RELEASE,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    },
    extra: context.extra || {},
  };

  console.error('[monitoring] client error captured', payload);

  try {
    await fetch('/api/monitoring/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Never throw from monitoring paths.
  }
};
