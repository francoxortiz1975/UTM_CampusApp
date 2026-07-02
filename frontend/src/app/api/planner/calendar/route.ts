import { NextResponse } from 'next/server';
import { getUser } from '@/src/lib/auth';
import { plannerGet, plannerSave } from '@/src/lib/mock';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  return NextResponse.json(plannerGet());
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  const data = await req.json().catch(() => ({}));
  const text = data.calendar_text;
  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'A non-empty calendar_text value is required' }, { status: 400 });
  }
  return NextResponse.json(plannerSave(text));
}
