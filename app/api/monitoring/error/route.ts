import { NextRequest, NextResponse } from 'next/server';
import { captureServerError } from '@/lib/monitoring/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const severity = body?.severity === 'critical' ? 'critical' : body?.severity === 'warning' ? 'warning' : 'error';

    await captureServerError(body?.error || body, {
      source: body?.source || 'client-monitoring-endpoint',
      severity,
      tags: Array.isArray(body?.tags) ? body.tags : ['frontend'],
      extra: {
        runtime: body?.runtime,
        metadata: body?.metadata,
        context: body?.extra,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await captureServerError(error, {
      source: 'monitoring.route',
      severity: 'error',
      tags: ['monitoring', 'route-error'],
    });

    return NextResponse.json({ success: false }, { status: 500 });
  }
}
