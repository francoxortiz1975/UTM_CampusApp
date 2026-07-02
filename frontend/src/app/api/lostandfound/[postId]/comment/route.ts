import { NextResponse } from 'next/server';
import { getUser } from '@/src/lib/auth';
import { lafComment } from '@/src/lib/mock';

export async function POST(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be logged in to submit a lost item' }, { status: 401 });
  }
  const { postId } = await params;
  const data = await req.json().catch(() => ({}));
  if (!data.comment) return NextResponse.json({ error: 'No comment provided' }, { status: 400 });
  const rec = lafComment(parseInt(postId, 10), user.id, data.comment);
  return NextResponse.json(rec, { status: 201 });
}
