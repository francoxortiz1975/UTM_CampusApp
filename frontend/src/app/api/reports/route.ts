import { NextResponse } from 'next/server';
import { getUser } from '@/src/lib/auth';

// POST /reports/ — user-submitted crowd report. In the demo we accept it and
// echo it back (nothing is persisted to a database).
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to submit a report' }, { status: 401 });
  }
  const data = await req.json().catch(() => ({}));
  if (!data.title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  return NextResponse.json(
    { id: Date.now(), user_id: user.id, title: data.title, content: data.content ?? '' },
    { status: 201 },
  );
}
