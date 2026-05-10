import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAMES } from '@/lib/auth';

const PROTECTED_PREFIXES = ['/admin', '/api/admin'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const token = AUTH_COOKIE_NAMES.map((name) => request.cookies.get(name)?.value).find(Boolean);
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Connexion owner requise' }, { status: 401 });
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
