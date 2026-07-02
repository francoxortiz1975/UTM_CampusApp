import { NextResponse } from 'next/server';
import { getEstimate, getFullDay } from '@/src/lib/mock';

// Handles both crowd-data endpoints from the original backend:
//   GET /reports/<month>/<day>/<time>/<page>/<name>  -> { estimate }
//   GET /reports/<month>/<day>/<page>/<name>         -> [{ time, capacity }]
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;

  if (slug.length === 5) {
    const page = slug[3];
    const hour = parseInt(slug[2], 10) || 0;
    return NextResponse.json({ estimate: getEstimate(page, hour) });
  }

  if (slug.length === 4) {
    const day = slug[1];
    const page = slug[2];
    const name = slug[3];
    return NextResponse.json(getFullDay(page, name, day));
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
