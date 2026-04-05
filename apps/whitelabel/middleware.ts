import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Extract subdomain from host
  // techfest.owambe.com → subdomain = "techfest"
  // events.techlagos.com → custom domain
  const parts = host.split('.');
  let subdomain: string | null = null;
  let customDomain: string | null = null;

  if (parts.length >= 3 && (parts[1] === 'owambe' && parts[2] === 'com')) {
    subdomain = parts[0];
    if (['www', 'app', 'api', 'admin', 'dashboard'].includes(subdomain)) {
      subdomain = null; // Not a tenant subdomain
    }
  } else if (!host.includes('owambe.com') && !host.includes('localhost')) {
    // Custom domain e.g. events.techlagos.com
    customDomain = host.replace(/:\d+$/, ''); // strip port
  }

  const response = NextResponse.next();

  if (subdomain) {
    response.headers.set('x-owambe-subdomain', subdomain);
  }
  if (customDomain) {
    response.headers.set('x-owambe-custom-domain', customDomain);
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and API
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};
