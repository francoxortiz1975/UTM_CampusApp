import { NextResponse } from 'next/server';
import { getUser } from '@/src/lib/auth';

// The lost & found page calls `${apiBase}/me` (which had no Flask route and
// always 404'd). We mirror /auth/profile so it resolves the current user.
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  return NextResponse.json(user);
}
