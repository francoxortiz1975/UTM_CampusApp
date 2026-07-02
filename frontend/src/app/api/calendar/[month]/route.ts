import { NextResponse } from 'next/server';
import { eventsForMonth } from '@/src/lib/mock';

export async function GET(_req: Request, { params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  return NextResponse.json(eventsForMonth(parseInt(month, 10) || 1));
}
