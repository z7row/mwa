import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cors } from '@/lib/cors';
export const dynamic = 'force-dynamic';

// Public, read-only: only works with type "created" (my own projects)
export async function GET(req) {
  const w = await (await db()).collection('works').aggregate([
    { $match: { type: 'created' } },
    { $sort: { date: -1 } },
    { $project: { name: 1, description: 1, date: 1, link: 1, hasImg: { $gt: [{ $strLenCP: { $ifNull: ['$img', ''] } }, 0] } } },
  ]).toArray();
  const origin = new URL(req.url).origin;
  const out = w.map(x => ({
    id: String(x._id), name: x.name, description: x.description, date: x.date, link: x.link,
    image: x.hasImg ? `${origin}/api/public/works/${x._id}/image` : null,
  }));
  return NextResponse.json(out, { headers: { ...cors(req), 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
}