import { NextResponse } from 'next/server';
import { getUser } from '@/src/lib/auth';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  return NextResponse.json(user);
}
