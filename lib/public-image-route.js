import { NextResponse } from 'next/server';
import { db, ObjectId } from '@/lib/db';
import { cors } from '@/lib/cors';
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const h = cors(req);
  if (!ObjectId.isValid(params.id)) return new NextResponse(null, { status: 404 });
  const w = await (await db()).collection('works').findOne({ _id: new ObjectId(params.id), type: 'created' }, { projection: { img: 1 } });
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(w?.img || '');
  if (!m) return new NextResponse(null, { status: 404 });
  return new NextResponse(Buffer.from(m[2], 'base64'), { headers: { ...h, 'Content-Type': m[1], 'Cache-Control': 'public, max-age=86400' } });
}
