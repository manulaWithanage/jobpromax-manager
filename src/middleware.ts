import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth/jwt';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;
    const { pathname } = request.nextUrl;

    const isProtectedRoute = pathname.startsWith('/manager') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/finance') ||
        pathname.startsWith('/roadmap') ||
        pathname.startsWith('/timesheets') ||
        pathname.startsWith('/settings');

    const isPublicRoute = pathname.startsWith('/p/') || pathname === '/';

    if (isProtectedRoute) {
        if (!token) {
            console.log(`[Middleware] 🔒 Redirecting to / (No Token) from ${pathname}`);
            return NextResponse.redirect(new URL('/', request.url));
        }

        // Verify token validity
        const payload = await verifyToken(token);
        if (!payload) {
            console.log(`[Middleware] ❌ Invalid Token for ${pathname}. Redirecting to /`);
            const response = NextResponse.redirect(new URL('/', request.url));
            // Clear invalid cookie to prevent loops
            response.cookies.delete('auth-token');
            return response;
        }

        return NextResponse.next();
    }

    if (token && pathname === '/') {
        // If already logged in and visiting home/login page, verify token
        const payload = await verifyToken(token);
        if (payload) {
            console.log(`[Middleware] 🚀 Auth found, redirecting from / to /roadmap`);
            return NextResponse.redirect(new URL('/roadmap', request.url));
        } else {
            // Token found but invalid on login page, clear it
            const response = NextResponse.next();
            response.cookies.delete('auth-token');
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
