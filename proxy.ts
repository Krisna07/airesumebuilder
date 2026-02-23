import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://airesumebuilder-delta.vercel.app',
  'https://airesumebuilder.vercel.app',
  'https://airesumecraft.xyz',
  'http://localhost:5174',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

function normalizeOrigin(u: string | null | undefined) {
  if (!u) return '';
  return u.replace(/\/+$|\s+/g, '').toLowerCase();
}

function isOriginAllowed(origin: string | null, list: string[]) {
  if (!origin) return false;
  const norm = normalizeOrigin(origin);
  return list.map(x => normalizeOrigin(x)).includes(norm);
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiOrAuthRoute = pathname.startsWith('/api/') || pathname.startsWith('/auth/');
  if (!isApiOrAuthRoute) return NextResponse.next();

  const origin = request.headers.get('origin');
  const env = process.env.ALLOWED_ORIGINS || '';
  const envList = env.split(',').map(s => s.trim()).filter(Boolean);
  const allowedList = envList.length ? envList : DEFAULT_ALLOWED_ORIGINS;

  const hasOrigin = !!origin;

  // Handle preflight (OPTIONS)
  if (request.method === 'OPTIONS') {
    // if origin present and not allowed, reject preflight
    if (hasOrigin && !isOriginAllowed(origin, allowedList)) {
      return new NextResponse('Origin not allowed', { status: 403 });
    }

    const res = new NextResponse(null, { status: 204 });
    if (hasOrigin) {
      res.headers.set('Access-Control-Allow-Origin', origin!);
      res.headers.set('Vary', 'Origin');
      res.headers.set('Access-Control-Allow-Credentials', 'true');
    } else {
      // server-to-server or tooling requests without Origin
      res.headers.set('Access-Control-Allow-Origin', '*');
    }

    const requestedHeaders = request.headers.get('access-control-request-headers') || 'Content-Type, Authorization';
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', requestedHeaders);
    return res;
  }

  // For actual requests: if origin present and not allowed, reject
  if (hasOrigin && !isOriginAllowed(origin, allowedList)) {
    return new NextResponse('Origin not allowed', { status: 403 });
  }

  const response = NextResponse.next();

  if (hasOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin!);
    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return response;
}

export const config = {
  // Ensure CORS middleware runs for API and auth pages (callbacks/redirects)
  matcher: ['/api/:path*', '/auth/:path*']
};