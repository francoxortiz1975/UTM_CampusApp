import { NextResponse } from 'next/server';
import { declineEvent } from '@/src/lib/mock';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = declineEvent(parseInt(id, 10));
  if (!ok) return NextResponse.json({ error: 'Event with id does not exist' }, { status: 404 });
  return NextResponse.json({ message: 'deleted' });
}
