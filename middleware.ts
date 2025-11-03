import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle CORS for all API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    // For actual requests, continue with the request and add CORS headers to response
    const response = NextResponse.next();
    
    // For production, replace '*' with specific origins
    const allowedOrigins = [
      'chrome-extension://your-extension-id',
      'https://airesumebuilder-delta.vercel.app'
    ];

    const origin = request.headers.get('origin');
    const corsOrigin = allowedOrigins.includes(origin || '') ? origin : 'null';

    response.headers.set('Access-Control-Allow-Origin', corsOrigin || 'null');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*'
  ],
};