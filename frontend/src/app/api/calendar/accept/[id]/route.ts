import { NextResponse } from 'next/server';
import { acceptEvent } from '@/src/lib/mock';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ev = acceptEvent(parseInt(id, 10));
  if (!ev) return NextResponse.json({ error: 'Event with id does not exist' }, { status: 404 });
  return NextResponse.json(ev);
}
