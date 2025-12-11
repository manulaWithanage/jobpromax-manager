
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Fallback for dev

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;
    console.log(`[Middleware] Path: ${request.nextUrl.pathname}, Token: ${token ? 'Present' : 'Missing'}`);
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/manager') || request.nextUrl.pathname.startsWith('/dashboard');



    if (isProtectedRoute) {
        if (!token) {
            console.log(`[Middleware] Redirecting to / (No Token)`);
            return NextResponse.redirect(new URL('/', request.url));
        }
        // Trust the cookie presence for frontend navigation. 
        // Backend overrides strictly invalid tokens.
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
