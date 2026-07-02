import { NextResponse } from 'next/server';
import { lafGetComments } from '@/src/lib/mock';

export async function GET(_req: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  return NextResponse.json(lafGetComments(parseInt(postId, 10)));
}
