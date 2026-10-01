import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const IDLE = '5m';              // session dies after 5 minutes without activity
const MAX = 60 * 60 * 1000;     // hard cap: 1 hour since login, even if active

export async function middleware(req) {
  const key = new TextEncoder().encode(process.env.JWT_SECRET);
  try {
    const { payload } = await jwtVerify(req.cookies.get('mwa')?.value, key);
    if (payload.stage === 'ok' && Date.now() - payload.t0 < MAX) {
      const res = NextResponse.next();
      const tok = await new SignJWT({ stage: 'ok', t0: payload.t0 }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime(IDLE).sign(key);
      res.cookies.set('mwa', tok, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 300 });
      return res;
    }
  } catch {}
  if (req.nextUrl.pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.redirect(new URL('/', req.url));
}

export const config = { matcher: ['/works/:path*', '/api/works/:path*', '/api/auth/2fa-setup', '/api/auth/2fa-enable', '/api/auth/2fa-disable'] };