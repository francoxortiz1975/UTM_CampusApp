// Demo data layer for the Vercel deployment.
//
// The original project used a Flask + SQLite backend on :5001. For a
// no-backend deployment we recreate the endpoints the frontend needs as
// Next.js API routes, and this module holds the shared demo data + logic.
// The crowd-level numbers are the same baselines the Flask backend fell back
// to when its database was empty (see backend/app/routes/reports.py).

export const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

// Hourly baselines (index = hour of day, 0..23).
const PARKING_BASELINE = [5, 5, 5, 5, 5, 10, 10, 20, 25, 40, 45, 70, 80, 95, 95, 80, 70, 60, 55, 50, 35, 20, 15, 10];
const GYM_BASELINE = [5, 5, 5, 5, 5, 10, 10, 20, 25, 40, 45, 70, 80, 95, 95, 80, 70, 60, 55, 50, 35, 20, 15, 10];
const FOOD_BASELINE = [5, 5, 5, 5, 5, 5, 5, 5, 10, 20, 10, 10, 20, 30, 30, 10, 10, 20, 30, 15, 10, 5, 5, 5];

type Hours = [number, number][];

const GYM_DEFAULT: Hours = [[10, 17], [7, 22], [7, 22], [7, 22], [7, 22], [7, 22], [10, 17]];
const GYM_HOURS: Record<string, Hours> = {
  gyma: GYM_DEFAULT,
  gymb: GYM_DEFAULT,
  gymc: GYM_DEFAULT,
  weightroom: GYM_DEFAULT,
  pool: GYM_DEFAULT,
  tennis: GYM_DEFAULT,
};

const FOOD_HOURS: Record<string, Hours> = {
  '1': [[0, 0], [10, 22], [10, 22], [10, 22], [10, 22], [10, 18], [0, 0]],
  '2': [[0, 0], [10, 21], [10, 21], [10, 21], [10, 21], [10, 16], [0, 0]],
  '3': [[0, 0], [8, 19], [8, 19], [8, 19], [8, 19], [8, 16], [0, 0]],
  '4': [[0, 0], [8, 17], [8, 17], [8, 17], [8, 17], [8, 15], [0, 0]],
  '5': [[0, 0], [11, 19], [11, 19], [11, 19], [11, 19], [11, 16], [0, 0]],
  '6': [[0, 0], [11, 19], [11, 19], [11, 19], [11, 19], [11, 16], [0, 0]],
  '7': [[0, 0], [10, 21], [10, 21], [10, 21], [10, 21], [10, 16], [0, 0]],
  '8': [[0, 0], [11, 19], [11, 19], [11, 19], [11, 19], [11, 16], [0, 0]],
  '9': [[0, 0], [8, 18], [8, 18], [8, 18], [8, 18], [8, 16], [0, 0]],
  '10': [[0, 0], [10, 19], [10, 19], [10, 19], [10, 19], [10, 16], [0, 0]],
  '11': [[0, 0], [11, 19], [11, 19], [11, 19], [11, 19], [11, 16], [0, 0]],
  '12': [[0, 0], [11, 19], [11, 19], [11, 19], [11, 19], [11, 16], [0, 0]],
  '13': [[0, 0], [11, 19], [11, 19], [11, 19], [11, 19], [11, 16], [0, 0]],
  '14': [[0, 0], [11, 19], [11, 19], [11, 19], [11, 19], [11, 16], [0, 0]],
  '15': [[0, 0], [8, 18], [8, 18], [8, 18], [8, 18], [8, 16], [0, 0]],
  '16': [[0, 0], [8, 18], [8, 18], [8, 18], [8, 18], [8, 16], [0, 0]],
  '17': [[0, 0], [8, 18], [8, 18], [8, 18], [8, 18], [8, 16], [0, 0]],
  '18': [[0, 0], [11, 21], [11, 21], [11, 21], [11, 21], [11, 15], [0, 0]],
  '19': [[0, 0], [8, 18], [8, 18], [8, 18], [8, 18], [8, 16], [0, 0]],
  '20': [[0, 0], [11, 16], [11, 16], [11, 16], [11, 16], [11, 15], [0, 0]],
  '21': [[0, 0], [11, 16], [11, 16], [11, 16], [11, 16], [11, 15], [0, 0]],
  '22': [[0, 0], [10, 18], [10, 18], [10, 18], [10, 18], [10, 14], [0, 0]],
  '23': [[0, 0], [8, 18], [8, 18], [8, 18], [8, 18], [8, 15], [0, 0]],
  '24': [[0, 0], [10, 17], [10, 17], [10, 17], [10, 17], [10, 14], [0, 0]],
  '25': [[0, 0], [10, 22], [10, 22], [10, 22], [10, 22], [10, 18], [0, 0]],
  '26': [[0, 0], [10, 18], [10, 18], [10, 18], [10, 18], [10, 18], [0, 0]],
  '27': [[0, 0], [7, 24], [7, 24], [7, 24], [7, 24], [7, 21], [0, 0]],
  '28': [[0, 0], [11, 21], [11, 21], [11, 21], [11, 21], [11, 20], [0, 0]],
  '29': [[0, 0], [10, 22], [10, 22], [10, 22], [10, 22], [12, 19], [0, 0]],
  '30': [[0, 0], [10, 21], [10, 21], [10, 21], [10, 21], [12, 18], [0, 0]],
  '31': [[0, 0], [10, 22], [10, 22], [10, 22], [10, 22], [12, 19], [0, 0]],
  '32': [[0, 0], [10, 19], [10, 19], [10, 19], [10, 19], [12, 18], [0, 0]],
  '33': [[0, 0], [13, 20], [13, 20], [13, 20], [13, 20], [13, 20], [0, 0]],
  '34': [[0, 0], [11, 21], [11, 21], [11, 21], [11, 21], [0, 0], [0, 0]],
  '35': [[0, 0], [7, 21], [7, 21], [7, 21], [7, 21], [7, 18], [0, 0]],
  '36': [[0, 0], [7, 24], [7, 24], [7, 24], [7, 24], [7, 21], [0, 0]],
  '37': [[0, 0], [7, 24], [7, 24], [7, 24], [7, 24], [7, 21], [0, 0]],
  '38': [[0, 0], [20, 24], [20, 24], [20, 24], [20, 24], [0, 0], [0, 0]],
  '39': [[0, 0], [7, 24], [7, 24], [7, 24], [7, 24], [7, 21], [0, 0]],
  '40': [[0, 0], [7, 24], [7, 24], [7, 24], [7, 24], [7, 21], [0, 0]],
  '41': [[0, 0], [7, 24], [7, 24], [7, 24], [7, 24], [7, 21], [0, 0]],
  '42': [[0, 0], [9, 16], [9, 16], [9, 16], [9, 16], [9, 15], [0, 0]],
  '43': [[0, 0], [8, 16], [8, 16], [8, 16], [8, 16], [8, 14], [0, 0]],
};

function baselineFor(page: string, hour: number): number {
  const h = Math.max(0, Math.min(23, hour));
  if (page === 'parking') return PARKING_BASELINE[h];
  if (page === 'food') return FOOD_BASELINE[h];
  return GYM_BASELINE[h];
}

/** Single-hour estimate. Mirrors get_average() with an empty database. */
export function getEstimate(page: string, hour: number): number {
  return Math.round(baselineFor(page, hour));
}

function hourLabel(hour: number): string {
  if (hour > 12) return `${hour - 12}pm`;
  if (hour === 12) return '12pm';
  if (hour === 0) return '12am';
  return `${hour}am`;
}

/** Full-day report. Mirrors full_day_report() with an empty database. */
export function getFullDay(page: string, name: string, day: string): { time: string; capacity: number }[] {
  const weekday = WEEKDAYS[day] ?? 1;
  let open = 0;
  let close = 23;
  if (page === 'gym') {
    const hours = GYM_HOURS[name] ?? GYM_DEFAULT;
    [open, close] = hours[weekday];
  } else if (page === 'food') {
    const hours = FOOD_HOURS[name];
    if (hours) [open, close] = hours[weekday];
  }

  const out: { time: string; capacity: number }[] = [];
  for (let hour = open; hour < close; hour++) {
    out.push({ time: hourLabel(hour), capacity: Math.round(baselineFor(page, hour)) });
  }
  return out;
}

// --- Demo events (the original seed script never created any) ---

type EventRecord = {
  id: number;
  name: string;
  org: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  desc: string;
  status: number; // 0 = accepted, 1 = pending
};

const EVENT_TEMPLATES = [
  { name: 'CSSU Game Night', org: 'Computer Science Student Union', time: '18:00', location: 'Deerfield Hall 2010', desc: 'Board games, snacks and a Smash Bros tournament. All majors welcome.' },
  { name: 'Career Fair: Tech & Data', org: 'UTM Career Centre', time: '11:00', location: 'RAWC Gym', desc: 'Meet recruiters from 40+ companies hiring co-op and new grads.' },
  { name: 'Intro to Machine Learning Workshop', org: 'UTM AI Society', time: '15:00', location: 'MN 1210', desc: 'Hands-on scikit-learn workshop. Bring a laptop; no experience needed.' },
  { name: 'Wellness Wednesday Yoga', org: 'Health & Counselling Centre', time: '12:00', location: 'RAWC Studio B', desc: 'Free drop-in yoga session to reset mid-week. Mats provided.' },
  { name: 'Startup Pitch Night', org: 'UTM Entrepreneurship Club', time: '17:30', location: 'IB 110', desc: 'Six student teams pitch to a panel of local founders and investors.' },
  { name: 'International Food Festival', org: 'UTM Student Union', time: '13:00', location: 'Five Minute Walk', desc: 'Taste dishes from 15 cultural clubs across campus.' },
  { name: 'Hack the Valley Info Session', org: 'HackTheValley', time: '16:00', location: 'CCT Building Atrium', desc: 'Learn about UofT’s biggest hackathon and how to form a team.' },
  { name: 'Live Music: Open Mic', org: 'The Blind Duck Pub', time: '19:00', location: 'The Blind Duck Pub', desc: 'Students perform live sets. Sign up at the door.' },
];

let createdEvents: EventRecord[] = [];
let nextEventId = 1000;

/** Deterministic demo events for a given month, plus any created in-session. */
export function eventsForMonth(month: number): EventRecord[] {
  const year = new Date().getFullYear();
  const mm = String(month).padStart(2, '0');
  const days = [3, 8, 12, 15, 17, 22, 25, 28];
  const generated: EventRecord[] = EVENT_TEMPLATES.map((tpl, i) => ({
    id: month * 100 + i,
    name: tpl.name,
    org: tpl.org,
    date: `${year}-${mm}-${String(days[i % days.length]).padStart(2, '0')}`,
    time: tpl.time,
    location: tpl.location,
    desc: tpl.desc,
    status: 0,
  }));
  const createdThisMonth = createdEvents.filter((e) => e.date.slice(5, 7) === mm);
  return [...generated, ...createdThisMonth];
}

export function addEvent(data: Omit<EventRecord, 'id' | 'status'>): EventRecord {
  const ev: EventRecord = { ...data, id: nextEventId++, status: 1 };
  createdEvents.push(ev);
  return ev;
}

export function pendingEvents(): EventRecord[] {
  return createdEvents.filter((e) => e.status === 1);
}

export function acceptEvent(id: number): EventRecord | null {
  const ev = createdEvents.find((e) => e.id === id);
  if (!ev) return null;
  ev.status = 0;
  return ev;
}

export function declineEvent(id: number): boolean {
  const before = createdEvents.length;
  createdEvents = createdEvents.filter((e) => e.id !== id);
  return createdEvents.length < before;
}

// --- Lost & Found (in-memory, seeded so the page is never empty) ---

type LafRecord = { id: number; user_id: number; item: string; desc: string; created_at: string };
type CommentRecord = { id: number; post_id: number; user_id: number; comment: string; created_at: string };

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

let lafItems: LafRecord[] = [
  { id: 1, user_id: 1, item: 'Blue Hydro Flask water bottle', desc: 'Left in Deerfield Hall room 2010 after the CSC301 lecture. Has a UTM sticker.', created_at: daysAgo(1) },
  { id: 2, user_id: 9, item: 'Set of keys with a red lanyard', desc: 'Found near the RAWC entrance. Three keys and a bike lock key.', created_at: daysAgo(2) },
  { id: 3, user_id: 1, item: 'Black umbrella', desc: 'Left at the Blind Duck Pub on Friday evening.', created_at: daysAgo(3) },
];
let nextLafId = 4;

let lafComments: CommentRecord[] = [
  { id: 1, post_id: 1, user_id: 9, comment: 'I think this is mine! How do I get it back?', created_at: daysAgo(1) },
];
let nextCommentId = 2;

export function lafGetAll(): LafRecord[] {
  return [...lafItems].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function lafCreate(user_id: number, item: string, desc: string): LafRecord {
  const rec: LafRecord = { id: nextLafId++, user_id, item, desc, created_at: new Date().toISOString() };
  lafItems.push(rec);
  return rec;
}

export function lafUpdate(id: number, item: string, desc: string): LafRecord | null {
  const rec = lafItems.find((r) => r.id === id);
  if (!rec) return null;
  rec.item = item;
  rec.desc = desc;
  return rec;
}

export function lafDelete(id: number): boolean {
  const before = lafItems.length;
  lafItems = lafItems.filter((r) => r.id !== id);
  lafComments = lafComments.filter((c) => c.post_id !== id);
  return lafItems.length < before;
}

export function lafComment(post_id: number, user_id: number, comment: string): CommentRecord {
  const rec: CommentRecord = { id: nextCommentId++, post_id, user_id, comment, created_at: new Date().toISOString() };
  lafComments.push(rec);
  return rec;
}

export function lafGetComments(post_id: number): CommentRecord[] {
  return lafComments.filter((c) => c.post_id === post_id);
}

// --- Planner calendar (in-memory per demo user) ---

let plannerCalendarText: string | null = null;
let plannerUpdatedAt: string | null = null;

export function plannerGet(): { calendar_text: string | null; updated_at: string | null } {
  return { calendar_text: plannerCalendarText, updated_at: plannerUpdatedAt };
}

export function plannerSave(text: string): { calendar_text: string; updated_at: string } {
  plannerCalendarText = text;
  plannerUpdatedAt = new Date().toISOString();
  return { calendar_text: plannerCalendarText, updated_at: plannerUpdatedAt };
}
