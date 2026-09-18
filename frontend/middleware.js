import { NextResponse } from 'next/server';

function decodeTokenPayload(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const isSellerPath = pathname.startsWith('/seller');
  const isAdminPath = pathname.startsWith('/admin');
  const isBuyerPath = pathname.startsWith('/buyer');

  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const payload = decodeTokenPayload(token);
  const role = payload?.role;

  if (isAdminPath && role !== 'admin') {
    return NextResponse.redirect(new URL('/?unauthorized=admin', request.url));
  }

  if (isSellerPath && role !== 'seller' && role !== 'admin') {
    return NextResponse.redirect(new URL('/?unauthorized=seller', request.url));
  }

  if (isBuyerPath && role !== 'buyer') {
    return NextResponse.redirect(new URL('/?unauthorized=buyer', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/seller/:path*', '/admin/:path*', '/buyer/:path*'],
};
