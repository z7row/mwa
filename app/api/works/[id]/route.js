import { NextResponse } from 'next/server';
import { db, ObjectId } from '@/lib/db';
import { isAuth } from '@/lib/session';
import { clean } from '@/lib/clean';
export const dynamic = 'force-dynamic';
const J = (d, s = 200) => NextResponse.json(d, { status: s });
const col = async () => (await db()).collection('works');

export async function PUT(req, { params }) {
  if (!(await isAuth())) return J({ error: 'Unauthorized' }, 401);
  if (!ObjectId.isValid(params.id)) return J({ error: 'Bad id' }, 400);
  const { data, error } = clean(await req.json().catch(() => ({})));
  if (error) return J({ error }, 400);
  await (await col()).updateOne({ _id: new ObjectId(params.id) }, { $set: data });
  return J({ ok: 1 });
}
export async function DELETE(req, { params }) {
  if (!(await isAuth())) return J({ error: 'Unauthorized' }, 401);
  if (!ObjectId.isValid(params.id)) return J({ error: 'Bad id' }, 400);
  await (await col()).deleteOne({ _id: new ObjectId(params.id) });
  return J({ ok: 1 });
}
