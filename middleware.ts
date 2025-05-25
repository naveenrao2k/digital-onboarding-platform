// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // List of paths that should redirect to /access
  const redirectPaths = ['/signin', '/signup'];
  
  // Check if the current path is in the redirect list
  if (redirectPaths.includes(path)) {
    return NextResponse.redirect(new URL('/access', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/signin', '/signup'],
};
