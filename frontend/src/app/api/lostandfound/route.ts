import { NextResponse } from 'next/server';
import { getUser } from '@/src/lib/auth';
import { lafGetAll, lafCreate } from '@/src/lib/mock';

export async function GET() {
  return NextResponse.json(lafGetAll());
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to submit a lost item' }, { status: 401 });
  }
  const data = await req.json().catch(() => ({}));
  if (!data.item) return NextResponse.json({ error: 'item is required' }, { status: 400 });
  if (!data.desc) return NextResponse.json({ error: 'desc is required' }, { status: 400 });
  const rec = lafCreate(user.id, data.item, data.desc);
  return NextResponse.json(rec, { status: 201 });
}
