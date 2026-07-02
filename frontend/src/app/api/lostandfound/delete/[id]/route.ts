import { NextResponse } from 'next/server';
import { lafDelete } from '@/src/lib/mock';

// GET (matches the original backend, which used GET for deletion).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = lafDelete(parseInt(id, 10));
  if (!ok) return NextResponse.json({ error: 'No matching id' }, { status: 400 });
  return NextResponse.json({ message: 'Deleted' });
}
