import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Grab the NextAuth token from the cookies
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 1. If the user is NOT logged in, redirect them to the login page
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    // Optional: Save the URL they were trying to visit so you can redirect them back after login
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Protect Organizer routes (Only Organizers and Admins allowed)
  if (pathname.startsWith('/dashboard/organizer')) {
    if (token.role !== 'organizer' && token.role !== 'admin') {
      // If a customer tries to get in, redirect them to the homepage
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // 3. Protect Admin routes (Strictly Admins only)
  if (pathname.startsWith('/dashboard/admin')) {
    if (token.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // If they pass all the checks, let them proceed to the page!
  return NextResponse.next();
}

// Specify exactly which routes this middleware should run on to save performance
export const config = {
  matcher: [
    /*
     * Match all request paths that start with /dashboard
     */
    '/dashboard/:path*',
  ],
};