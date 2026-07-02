import { NextResponse } from 'next/server';
import { addEvent } from '@/src/lib/mock';

export async function POST(req: Request) {
  const data = await req.json().catch(() => null);
  const required = ['name', 'date', 'location', 'desc', 'time', 'org'] as const;
  if (!data || !required.every((k) => k in data)) {
    return NextResponse.json({ error: `Missing required fields: ${required.join(', ')}` }, { status: 400 });
  }
  const ev = addEvent({
    name: data.name,
    date: data.date,
    location: data.location,
    desc: data.desc,
    time: data.time,
    org: data.org,
  });
  return NextResponse.json(ev, { status: 201 });
}
