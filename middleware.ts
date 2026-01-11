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
            'Access-Control-Allow-Origin': '*', // Allow all for development
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    // For actual requests, continue with the request and add CORS headers to response
    const response = NextResponse.next();
    
      // For development, allow all origins
      // For production, you can restrict this
      const origin = request.headers.get('origin');

      if (process.env.NODE_ENV === 'development') {
          response.headers.set('Access-Control-Allow-Origin', '*');
      } else {
          const allowedOrigins = [
            'https://airesumebuilder-delta.vercel.app',
            'https://airesumebuilder.vercel.app',
            'https://airesumecraft.xyz/'
          ];

        // Check if origin is in allowed list, otherwise allow all for now
        if (origin && allowedOrigins.includes(origin)) {
          response.headers.set('Access-Control-Allow-Origin', origin);
        } else {
          response.headers.set('Access-Control-Allow-Origin', '*');
        }
      }

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