import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isAuth } from '@/lib/session';
import { clean } from '@/lib/clean';
export const dynamic = 'force-dynamic';
const J = (d, s = 200) => NextResponse.json(d, { status: s });
const col = async () => (await db()).collection('works');

export async function GET() {
  if (!(await isAuth())) return J({ error: 'Unauthorized' }, 401);
  const w = await (await col()).find().sort({ createdAt: -1 }).toArray();
  return J(w.map(x => ({ ...x, _id: String(x._id) })));
}
export async function POST(req) {
  if (!(await isAuth())) return J({ error: 'Unauthorized' }, 401);
  const { data, error } = clean(await req.json().catch(() => ({})));
  if (error) return J({ error }, 400);
  const r = await (await col()).insertOne({ ...data, createdAt: new Date() });
  return J({ _id: String(r.insertedId), ...data }, 201);
}
