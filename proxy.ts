import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CORS Proxy - PUBLIC API MODE
 * All origins allowed, no restrictions
 * All APIs publicly available
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApiOrAuthRoute = pathname.startsWith('/api/') || pathname.startsWith('/auth/');
  if (!isApiOrAuthRoute) return NextResponse.next();

  const origin = request.headers.get('origin') || '*';

  // Handle preflight (OPTIONS) - Always allow
  if (request.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 });
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.headers.set('Access-Control-Max-Age', '86400');
    return res;
  }

  // For actual requests - Always allow all origins
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  response.headers.set('Access-Control-Expose-Headers', 'Content-Type, X-Requested-With');

  return response;
}

export const config = {
  // CORS middleware runs for all API and auth pages
  matcher: ['/api/:path*', '/auth/:path*']
};