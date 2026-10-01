import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { sign, session, isAuth, setCookie } from '@/lib/session';
import { limited } from '@/lib/limit';
export const dynamic = 'force-dynamic';
const J = (d, s = 200) => NextResponse.json(d, { status: s });
const full = async () => setCookie(J({ ok: 1 }), await sign({ stage: 'ok', t0: Date.now() }, '5m'), 300);
const adminHash = () => Buffer.from(process.env.ADMIN_HASH || '', 'base64').toString();
const okPass = async p => !!adminHash() && bcrypt.compare(String(p || ''), adminHash());
const cfg = async () => (await db()).collection('settings');

async function get(req, { params }) {
  if (params.action !== 'status') return J({}, 404);
  const u = await (await cfg()).findOne({ _id: 'auth' });
  const s = await session();
  return J({ auth: s?.stage === 'ok', pending: s?.stage === '2fa', totp: s?.stage === 'ok' ? !!u?.totp : undefined });
}

async function post(req, { params }) {
  const a = params.action, c = await cfg();
  const b = await req.json().catch(() => ({}));
  const ip = req.headers.get('x-forwarded-for') || 'local';
  const u = await c.findOne({ _id: 'auth' });

  if (a === 'login') {
    if (limited(ip)) return J({ error: 'Too many attempts, try later' }, 429);
    if (!(await okPass(b.password))) return J({ error: 'Wrong password' }, 401);
    if (u?.totp) return setCookie(J({ need2fa: true }), await sign({ stage: '2fa' }, '5m'), 300);
    return full();
  }
  if (a === 'verify') {
    if (limited(ip)) return J({ error: 'Too many attempts, try later' }, 429);
    if ((await session())?.stage !== '2fa' || !u?.totp) return J({ error: 'Unauthorized' }, 401);
    if (!authenticator.check(String(b.code || '').trim(), u.totp)) return J({ error: 'Invalid code' }, 401);
    return full();
  }
  if (a === 'logout') return setCookie(J({ ok: 1 }), '', 0);

  if (!(await isAuth())) return J({ error: 'Unauthorized' }, 401);
  if (a === '2fa-setup') {
    const secret = authenticator.generateSecret();
    await c.updateOne({ _id: 'auth' }, { $set: { pending: secret } }, { upsert: true });
    return J({ secret, qr: await QRCode.toDataURL(authenticator.keyuri('owner', 'MWA', secret)) });
  }
  if (a === '2fa-enable') {
    if (!u?.pending || !authenticator.check(String(b.code || '').trim(), u.pending)) return J({ error: 'Invalid code' }, 400);
    await c.updateOne({ _id: 'auth' }, { $set: { totp: u.pending }, $unset: { pending: '' } });
    return J({ ok: 1 });
  }
  if (a === '2fa-disable') {
    if (!(await okPass(b.password))) return J({ error: 'Wrong password' }, 401);
    await c.updateOne({ _id: 'auth' }, { $set: { totp: null } }, { upsert: true });
    return J({ ok: 1 });
  }
  return J({}, 404);
}

const safe = fn => async (req, ctx) => {
  try { return await fn(req, ctx); }
  catch (e) {
    console.error('[MWA]', e);
    return J({ error: 'Server error', detail: process.env.NODE_ENV !== 'production' ? String(e.message) : undefined }, 500);
  }
};
export const GET = safe(get);
export const POST = safe(post);