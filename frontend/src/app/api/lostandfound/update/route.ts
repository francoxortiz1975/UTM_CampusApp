import { NextResponse } from 'next/server';
import { lafUpdate } from '@/src/lib/mock';

export async function POST(req: Request) {
  const data = await req.json().catch(() => ({}));
  if (!data.id) return NextResponse.json({ error: 'An id is required' }, { status: 400 });
  if (!data.item) return NextResponse.json({ error: 'item is required' }, { status: 400 });
  if (!data.desc) return NextResponse.json({ error: 'desc is required' }, { status: 400 });
  const rec = lafUpdate(parseInt(String(data.id), 10), data.item, data.desc);
  if (!rec) return NextResponse.json({ error: 'No matching id' }, { status: 400 });
  return NextResponse.json(rec);
}
