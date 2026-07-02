import { NextResponse } from 'next/server';
import { pendingEvents } from '@/src/lib/mock';

export async function GET() {
  return NextResponse.json(pendingEvents());
}
