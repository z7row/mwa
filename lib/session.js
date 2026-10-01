import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
const key = () => new TextEncoder().encode(process.env.JWT_SECRET);
export const sign = (p, exp = '7d') => new SignJWT(p).setProtectedHeader({ alg: 'HS256' }).setExpirationTime(exp).sign(key());
export async function session() {
  const t = cookies().get('mwa')?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload; } catch { return null; }
}
export const isAuth = async () => (await session())?.stage === 'ok';
export function setCookie(res, token, maxAge) {
  res.cookies.set('mwa', token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge });
  return res;
}
