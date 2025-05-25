// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Only redirect if path is exactly /user/signin or /user/signup
  const redirectPaths = ['/user/signin', '/user/signup'];

  if (redirectPaths.includes(path)) {
    return NextResponse.redirect(new URL('/access', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Only run middleware for /user/signin or /user/signup
  matcher: ['/user/signin', '/user/signup'],
};
