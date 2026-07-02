import { NextResponse } from 'next/server';
import { setUser } from '@/src/lib/auth';

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }
  // Demo mode: any email + password combination logs in.
  const user = await setUser(email);
  return NextResponse.json(user);
}
