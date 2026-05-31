'use client';

import { useEffect } from 'react';
import { captureClientError } from '@/lib/monitoring/client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void captureClientError(error, {
      source: 'global-error-boundary',
      severity: 'critical',
      tags: ['frontend', 'error-boundary'],
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex items-center justify-center px-4">
        <main className="max-w-lg w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            The incident was recorded for monitoring. You can retry the action now.
          </p>
          <button
            className="mt-4 inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            onClick={() => reset()}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
