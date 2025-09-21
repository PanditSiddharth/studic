// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  // CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  // Simple admin protection (replace with proper authentication)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Add your authentication logic here
    // For now, we'll allow all access
    return response;
  }
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};