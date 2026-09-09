import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // المسارات العامة المسموحة بدون تسجيل دخول
  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/telegram/webhook') ||
    pathname.startsWith('/api/cron') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js';

  // إذا لم يكن مسجلًا ويحاول الدخول لصفحة محمية
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  // إذا كان مسجلًا بالفعل ويحاول دخول صفحة تسجيل الدخول
  if (isLoggedIn && pathname === '/login') {
    const dashboardUrl = new URL('/', req.nextUrl.origin);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - sw.js (PWA service worker)
     * - public static files
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
  ],
};
