import { NextResponse } from 'next/server';
import { clearUser } from '@/src/lib/auth';

export async function POST() {
  await clearUser();
  return NextResponse.json({ message: 'Logged out' });
}
