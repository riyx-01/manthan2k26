import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains'
    );
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=()'
    );

    // Block direct API access without proper origin in production
    if (request.nextUrl.pathname.startsWith('/api/admin/')) {
        // Admin routes need Authorization header (checked in route handlers)
        // This middleware just adds headers
    }

    return response;
}

export const config = {
    matcher: [
        // Apply to all routes except static files and _next
        '/((?!_next/static|_next/image|favicon.ico|manthan_final_logo.png).*)',
    ],
};
