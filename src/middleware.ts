import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Protect all routes except login, signup, auth flows, and public assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - api/health (health check)
     * - login, signup (auth pages)
     * - forgot-password, reset-password (password reset flow - must be public)
     * - welcome (onboarding)
     * - _next/static, _next/image, favicon, images
     */
    '/((?!api/auth|api/health|login|signup|forgot-password|reset-password|welcome|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
