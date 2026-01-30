import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('stai-aici-token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes - allow access
  if (
    pathname === '/' ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/property/') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/properties') ||
    pathname.startsWith('/api/amenities') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // API routes that need auth
  if (pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesiune expirată' }, { status: 401 });
    }
    // Admin-only API routes
    if (pathname.startsWith('/api/admin') && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acces interzis' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // Dashboard routes need auth
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    const session = await verifyToken(token);
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    // Role-based access
    if (pathname.startsWith('/dashboard/admin') && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/dashboard/host') && session.role !== 'HOST') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
