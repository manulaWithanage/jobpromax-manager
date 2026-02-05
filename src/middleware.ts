
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;

    const isProtectedRoute = request.nextUrl.pathname.startsWith('/manager') ||
        request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/finance');

    // Explicitly allow public routes (shared links) even if they start with a protected prefix (though they don't here)
    const isPublicRoute = request.nextUrl.pathname.startsWith('/p/');

    if (isProtectedRoute && !isPublicRoute) {
        if (!token) {
            console.log(`[Middleware] Redirecting to / (No Token) from ${request.nextUrl.pathname}`);
            return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.next();
    }

    if (token && request.nextUrl.pathname === '/') {
        // If already logged in and visiting home/login page, redirect to Dashboard
        return NextResponse.redirect(new URL('/roadmap', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
