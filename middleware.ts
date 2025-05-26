// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Auth redirects
  const authRedirectPaths = ['/user/signin', '/user/signup'];
  if (authRedirectPaths.includes(path)) {
    return NextResponse.redirect(new URL('/access', request.url));
  }

  // Admin route protection
  if (path.startsWith('/admin') && path !== '/admin/login') {
    const session = request.cookies.get('session');
    
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const sessionData = JSON.parse(session.value);
      if (!sessionData.isAdmin || !['ADMIN', 'SUPER_ADMIN'].includes(sessionData.role)) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/user/signin',
    '/user/signup',
    '/admin/:path*'
  ],
};
