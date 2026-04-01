import type { CampusEvent } from '../events/mockEvents';
import type { MapBuildingStatus } from '../map/mapAvailability';

export type PlannerTransportMode = 'drive' | 'transit' | 'walk';
export type PlannerMealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type PlannerPreferences = {
  alreadyOnCampus: boolean;
  transportMode: PlannerTransportMode;
  arrivalMinutes: number;
  meals: PlannerMealType[];
  wantsGym: boolean;
  wantsEvents: boolean;
  studyHours: number; // 0 = no study blocks, 1-8 = desired study hours
};

export type PlannerCalendarEvent = {
  id: string;
  title: string;
  location: string;
  description?: string;
  start: Date;
  end: Date;
  buildingId: string | null;
  source: 'ics' | 'demo';
};

export type PlannerTimelineItem = {
  id: string;
  time: string;
  title: string;
  detail: string;
  kind: 'travel' | 'class' | 'walk' | 'food' | 'gym' | 'event' | 'study' | 'note';
  startAt: Date | null;
  endAt: Date | null;
  durationMinutes: number;
};

export type PlannerResult = {
  summary: string;
  timeline: PlannerTimelineItem[];
  notes: string[];
};

const CAMPUS_CENTER = {
  lat: 43.5486,
  lng: -79.6627,
};

const BUILDING_POINTS: Record<string, { x: number; y: number; name: string }> = {
  mn: { x: 228, y: 278, name: 'Maanjiwe Nendamowinan' },
  dh: { x: 264, y: 372, name: 'Deerfield Hall' },
  oph: { x: 260, y: 628, name: 'Oscar Peterson Hall' },
  ib: { x: 562, y: 215, name: 'Instructional Building' },
  ccit: { x: 678, y: 430, name: 'CCIT' },
  student: { x: 508, y: 580, name: 'Student Centre' },
  kn: { x: 618, y: 670, name: 'Kaneff Centre' },
  davis_rawc: { x: 870, y: 672, name: 'Davis / RAWC' },
};

const FOOD_BUILDINGS = ['mn', 'dh', 'oph', 'ib', 'ccit', 'student', 'kn', 'davis_rawc'] as const;
const GYM_BUILDING = 'davis_rawc';
const PARKING_BUILDING = 'ccit';

const weekdayTokens = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;
const mealOrder: PlannerMealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

export const MEAL_CONFIG: Record<
  PlannerMealType,
  {
    label: string;
    startHour: number;
    startMinute: number;
    durationMinutes: number;
    windowStartHour: number;
    windowEndHour: number;
  }
> = {
  breakfast: {
    label: 'Breakfast',
    startHour: 8,
    startMinute: 30,
    durationMinutes: 35,
    windowStartHour: 7,
    windowEndHour: 10,
  },
  lunch: {
    label: 'Lunch',
    startHour: 12,
    startMinute: 15,
    durationMinutes: 45,
    windowStartHour: 11,
    windowEndHour: 14,
  },
  snack: {
    label: 'Snack',
    startHour: 15,
    startMinute: 15,
    durationMinutes: 25,
    windowStartHour: 14,
    windowEndHour: 17,
  },
  dinner: {
    label: 'Dinner',
    startHour: 18,
    startMinute: 0,
    durationMinutes: 50,
    windowStartHour: 17,
    windowEndHour: 20,
  },
};

// Operating hours for gyms (indexed by JS weekday: 0=Sun..6=Sat)
// Matches GYM_HOURS in reports.py
const GYM_OPERATING_HOURS: Record<string, [number, number][]> = {
  gyma:       [[10,17],[7,22],[7,22],[7,22],[7,22],[7,22],[10,17]],
  gymb:       [[10,17],[7,22],[7,22],[7,22],[7,22],[7,22],[10,17]],
  gymc:       [[10,17],[7,22],[7,22],[7,22],[7,22],[7,22],[10,17]],
  weightroom: [[10,17],[7,22],[7,22],[7,22],[7,22],[7,22],[10,17]],
  pool:       [[10,17],[7,22],[7,22],[7,22],[7,22],[7,22],[10,17]],
};

// Latest restaurant close hour per weekday (0=Sun..6=Sat)
// Derived from FOOD_HOURS: latest close across all restaurants for each weekday
const LATEST_FOOD_CLOSE: number[] = [0, 24, 24, 24, 24, 21, 0];

function getGymCloseHour(dateKey: string): number {
  const dayOfWeek = new Date(`${dateKey}T12:00:00`).getDay();
  const hours = GYM_OPERATING_HOURS['gyma']?.[dayOfWeek];
  return hours ? hours[1] : 22;
}

function getLatestFoodClose(dateKey: string): number {
  const dayOfWeek = new Date(`${dateKey}T12:00:00`).getDay();
  return LATEST_FOOD_CLOSE[dayOfWeek] ?? 21;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatHumanDate(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatPlannerTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function decodeIcsText(value: string) {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function unfoldIcs(text: string) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const unfolded: string[] = [];

  for (const line of lines) {
    if (!line) continue;

    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }

  return unfolded;
}

function parseProperty(line: string) {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return null;

  const left = line.slice(0, colonIndex);
  const value = line.slice(colonIndex + 1);
  const [name, ...paramParts] = left.split(';');
  const params = Object.fromEntries(
    paramParts
      .map((part) => {
        const [key, rawValue] = part.split('=');
        return key && rawValue ? [key.toUpperCase(), rawValue] : null;
      })
      .filter((entry): entry is [string, string] => entry !== null)
  );

  return {
    name: name.toUpperCase(),
    params,
    value: decodeIcsText(value),
  };
}

function parseIcsDate(value: string) {
  if (/^\d{8}$/.test(value)) {
    return new Date(
      Number(value.slice(0, 4)),
      Number(value.slice(4, 6)) - 1,
      Number(value.slice(6, 8)),
      9,
      0,
      0
    );
  }

  const utcMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (utcMatch) {
    const [, year, month, day, hour, minute, second] = utcMatch;
    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      )
    );
  }

  const localMatch = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (localMatch) {
    const [, year, month, day, hour, minute, second] = localMatch;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
  }

  return null;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function differenceInMinutes(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 60_000);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function combineDateAndTime(date: Date, template: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    template.getHours(),
    template.getMinutes(),
    template.getSeconds()
  );
}

function weekdayToken(date: Date) {
  return weekdayTokens[date.getDay()];
}

function parseRRule(rule: string) {
  return Object.fromEntries(
    rule.split(';').map((part) => {
      const [key, value] = part.split('=');
      return [key.toUpperCase(), value];
    })
  );
}

function inferBuildingId(location: string) {
  const normalized = location.toUpperCase();

  if (normalized.includes('STUDENT') || /\bSC\b/.test(normalized) || normalized.includes('BLIND DUCK')) {
    return 'student';
  }
  if (normalized.includes('RAWC') || normalized.includes('DAVIS') || /\bDV\b/.test(normalized)) {
    return 'davis_rawc';
  }
  if (normalized.includes('CCIT') || normalized.includes('CCT') || normalized.includes('COMMUNICATION')) {
    return 'ccit';
  }
  if (normalized.includes('INSTRUCTIONAL') || /\bIB\b/.test(normalized)) {
    return 'ib';
  }
  if (normalized.includes('DEERFIELD') || /\bDH\b/.test(normalized)) {
    return 'dh';
  }
  if (normalized.includes('MAANJIWE') || /\bMN\b/.test(normalized)) {
    return 'mn';
  }
  if (normalized.includes('OSCAR') || /\bOPH\b/.test(normalized)) {
    return 'oph';
  }
  if (normalized.includes('KANEFF') || /\bKN\b/.test(normalized)) {
    return 'kn';
  }

  return null;
}

function buildEventId(seed: string, start: Date) {
  return `${seed}-${start.getTime()}`;
}

type RawCalendarEvent = {
  uid?: string;
  summary?: string;
  location?: string;
  description?: string;
  dtstart?: Date;
  dtend?: Date;
  rrule?: string;
};

function expandEvent(raw: RawCalendarEvent, horizonDays = 400): PlannerCalendarEvent[] {
  if (!raw.dtstart) return [];

  const summary = raw.summary?.trim() || 'Class';
  const location = raw.location?.trim() || 'Campus location unavailable';
  const end = raw.dtend && raw.dtend > raw.dtstart ? raw.dtend : addMinutes(raw.dtstart, 60);
  const duration = differenceInMinutes(end, raw.dtstart);
  const buildingId = inferBuildingId(location);
  const seed = raw.uid || summary.replace(/\s+/g, '-').toLowerCase();

  if (!raw.rrule) {
    return [
      {
        id: buildEventId(seed, raw.dtstart),
        title: summary,
        location,
        description: raw.description,
        start: raw.dtstart,
        end,
        buildingId,
        source: 'ics',
      },
    ];
  }

  const rule = parseRRule(raw.rrule);
  if (rule.FREQ !== 'WEEKLY') {
    return [
      {
        id: buildEventId(seed, raw.dtstart),
        title: summary,
        location,
        description: raw.description,
        start: raw.dtstart,
        end,
        buildingId,
        source: 'ics',
      },
    ];
  }

  const until = rule.UNTIL ? parseIcsDate(rule.UNTIL) : null;
  const interval = Number(rule.INTERVAL || '1');
  const byDays = (rule.BYDAY ? rule.BYDAY.split(',') : [weekdayToken(raw.dtstart)]).filter(Boolean);
  const seriesStart = startOfDay(raw.dtstart);
  const horizon = addMinutes(seriesStart, horizonDays * 24 * 60);
  const limit = until && until < horizon ? until : horizon;
  const expanded: PlannerCalendarEvent[] = [];

  for (let cursor = new Date(seriesStart); cursor <= limit; cursor = addMinutes(cursor, 24 * 60)) {
    if (!byDays.includes(weekdayToken(cursor))) continue;

    const daysApart = differenceInMinutes(cursor, seriesStart) / (24 * 60);
    const weeksApart = Math.floor(daysApart / 7);
    if (weeksApart % interval !== 0) continue;

    const start = combineDateAndTime(cursor, raw.dtstart);
    if (start < raw.dtstart) continue;

    const occurrenceEnd = addMinutes(start, duration);
    expanded.push({
      id: buildEventId(seed, start),
      title: summary,
      location,
      description: raw.description,
      start,
      end: occurrenceEnd,
      buildingId,
      source: 'ics',
    });
  }

  return expanded;
}

export function parseIcsCalendar(text: string) {
  const unfolded = unfoldIcs(text);
  const rawEvents: RawCalendarEvent[] = [];
  let current: RawCalendarEvent | null = null;

  for (const line of unfolded) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }

    if (line === 'END:VEVENT') {
      if (current) rawEvents.push(current);
      current = null;
      continue;
    }

    if (!current) continue;

    const parsed = parseProperty(line);
    if (!parsed) continue;

    if (parsed.name === 'UID') current.uid = parsed.value;
    if (parsed.name === 'SUMMARY') current.summary = parsed.value;
    if (parsed.name === 'LOCATION') current.location = parsed.value;
    if (parsed.name === 'DESCRIPTION') current.description = parsed.value;
    if (parsed.name === 'DTSTART') current.dtstart = parseIcsDate(parsed.value) ?? undefined;
    if (parsed.name === 'DTEND') current.dtend = parseIcsDate(parsed.value) ?? undefined;
    if (parsed.name === 'RRULE') current.rrule = parsed.value;
  }

  const events = rawEvents
    .flatMap((event) => expandEvent(event))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return {
    events,
    warnings: text.trim().length === 0 ? ['This calendar file is empty.'] : [],
  };
}

export function buildDemoClasses(referenceDate = new Date()): PlannerCalendarEvent[] {
  const day = startOfDay(referenceDate);

  return [
    {
      id: `demo-1-${day.getTime()}`,
      title: 'CSC301 Lecture',
      location: 'IB 120',
      start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 10, 0),
      end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 11, 0),
      buildingId: 'ib',
      source: 'demo',
    },
    {
      id: `demo-2-${day.getTime()}`,
      title: 'Statistics Tutorial',
      location: 'CCIT 1020',
      start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12, 30),
      end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 13, 30),
      buildingId: 'ccit',
      source: 'demo',
    },
    {
      id: `demo-3-${day.getTime()}`,
      title: 'Linear Algebra Lecture',
      location: 'DV 2040',
      start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 15, 0),
      end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 16, 30),
      buildingId: 'davis_rawc',
      source: 'demo',
    },
  ];
}

export function getAvailableDateKeys(events: PlannerCalendarEvent[]) {
  return Array.from(new Set(events.map((event) => formatDateKey(event.start)))).sort();
}

export function getEventsForDate(events: PlannerCalendarEvent[], dateKey: string) {
  return events
    .filter((event) => formatDateKey(event.start) === dateKey)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function estimateDistanceToCampusKm(lat: number, lng: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(CAMPUS_CENTER.lat - lat);
  const dLng = toRadians(CAMPUS_CENTER.lng - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat)) *
      Math.cos(toRadians(CAMPUS_CENTER.lat)) *
      Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateArrivalMinutes(distanceKm: number, mode: PlannerTransportMode) {
  const speedKmPerHour =
    mode === 'walk' ? 5 : mode === 'transit' ? 22 : 35;

  return Math.max(8, Math.round((distanceKm / speedKmPerHour) * 60));
}

function walkingMinutes(fromId: string | null, toId: string | null) {
  if (!fromId || !toId || fromId === toId) return 4;

  const from = BUILDING_POINTS[fromId];
  const to = BUILDING_POINTS[toId];
  if (!from || !to) return 7;

  const distance = Math.hypot(from.x - to.x, from.y - to.y);
  return Math.max(3, Math.round(distance * 0.02 + 2));
}

function getBuildingStatus(statuses: Record<string, MapBuildingStatus>, buildingId: string) {
  return statuses[buildingId];
}

export type FoodVenueOption = {
  buildingId: string;
  buildingName: string;
  venueName: string;
  displayValue: string;
  score: number;
  walkMinutes: number;
};

export function getAllFoodVenues(
  statuses: Record<string, MapBuildingStatus>,
  anchorBuildingId: string | null
): FoodVenueOption[] {
  const venues: FoodVenueOption[] = [];
  for (const buildingId of FOOD_BUILDINGS) {
    const status = getBuildingStatus(statuses, buildingId);
    if (!status) continue;
    for (const venue of status.resources.food) {
      const walk = walkingMinutes(anchorBuildingId, buildingId);
      venues.push({
        buildingId,
        buildingName: BUILDING_POINTS[buildingId].name,
        venueName: venue.name,
        displayValue: venue.displayValue,
        score: venue.value + walk * 1.5,
        walkMinutes: walk,
      });
    }
  }
  return venues.sort((a, b) => a.score - b.score);
}

function pickFoodRecommendation(
  statuses: Record<string, MapBuildingStatus>,
  anchorBuildingId: string | null
) {
  const candidates = FOOD_BUILDINGS
    .map((buildingId) => {
      const status = getBuildingStatus(statuses, buildingId);
      if (!status || status.resources.food.length === 0) return null;
      const bestVenue = [...status.resources.food].sort((a, b) => a.value - b.value)[0];
      const penalty = walkingMinutes(anchorBuildingId, buildingId) * 1.5;
      return {
        buildingId,
        bestVenue,
        buildingName: BUILDING_POINTS[buildingId].name,
        score: bestVenue.value + penalty,
        walkMinutes: walkingMinutes(anchorBuildingId, buildingId),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => a.score - b.score);

  return candidates[0] ?? null;
}

function pickGymRecommendation(statuses: Record<string, MapBuildingStatus>) {
  const status = getBuildingStatus(statuses, GYM_BUILDING);
  if (!status || status.resources.gym.length === 0) return null;

  const bestSpot = [...status.resources.gym].sort((a, b) => a.value - b.value)[0];
  return {
    bestSpot,
    buildingName: BUILDING_POINTS[GYM_BUILDING].name,
  };
}

function pickParkingRecommendation(statuses: Record<string, MapBuildingStatus>) {
  const status = getBuildingStatus(statuses, PARKING_BUILDING);
  if (!status || status.resources.parking.length === 0) return null;

  const bestLot = [...status.resources.parking].sort((a, b) => a.value - b.value)[0];
  return {
    bestLot,
    buildingName: BUILDING_POINTS[PARKING_BUILDING].name,
  };
}

function getCampusEventRecommendation(campusEvents: CampusEvent[], dateKey: string, after: Date | null) {
  const sameDay = campusEvents
    .filter((event) => event.date === dateKey)
    .map((event) => ({
      ...event,
      start: new Date(`${event.date}T${event.startTime}:00`),
    }))
    .filter((event) => (after ? event.start >= after : true))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return sameDay[0] ?? null;
}

function atTime(dateKey: string, hour: number, minute = 0) {
  return new Date(`${dateKey}T${pad(hour)}:${pad(minute)}:00`);
}

function getMealAnchorBuilding(
  classes: PlannerCalendarEvent[],
  mealTime: Date
) {
  const precedingClass = [...classes]
    .filter((course) => course.end <= mealTime)
    .sort((a, b) => b.end.getTime() - a.end.getTime())[0];
  if (precedingClass?.buildingId) return precedingClass.buildingId;

  const nextClass = [...classes]
    .filter((course) => course.start >= mealTime)
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  return nextClass?.buildingId ?? null;
}

function findMealTime(
  meal: PlannerMealType,
  classes: PlannerCalendarEvent[],
  dateKey: string
) {
  const config = MEAL_CONFIG[meal];
  const target = atTime(dateKey, config.startHour, config.startMinute);
  const windowStart = atTime(dateKey, config.windowStartHour, 0);
  const windowEnd = atTime(dateKey, config.windowEndHour, 0);
  const duration = config.durationMinutes;
  const gapPadding = 10;

  if (classes.length === 0) {
    return target;
  }

  const sorted = [...classes].sort((a, b) => a.start.getTime() - b.start.getTime());
  const windows: Array<{ start: Date; end: Date }> = [];

  if (windowStart < sorted[0].start) {
    windows.push({
      start: windowStart,
      end: new Date(Math.min(windowEnd.getTime(), sorted[0].start.getTime())),
    });
  }

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const start = new Date(Math.max(sorted[index].end.getTime(), windowStart.getTime()));
    const end = new Date(Math.min(sorted[index + 1].start.getTime(), windowEnd.getTime()));
    if (start < end) {
      windows.push({ start, end });
    }
  }

  if (sorted[sorted.length - 1].end < windowEnd) {
    windows.push({
      start: new Date(Math.max(sorted[sorted.length - 1].end.getTime(), windowStart.getTime())),
      end: windowEnd,
    });
  }

  const viableWindows = windows.filter(
    (window) => differenceInMinutes(window.end, window.start) >= duration + gapPadding
  );

  const exactWindow = viableWindows.find(
    (window) => target >= window.start && addMinutes(target, duration) <= window.end
  );
  if (exactWindow) {
    return target;
  }

  if (viableWindows.length > 0) {
    const nearestWindow = [...viableWindows].sort((a, b) => {
      const aDistance = Math.abs(a.start.getTime() - target.getTime());
      const bDistance = Math.abs(b.start.getTime() - target.getTime());
      return aDistance - bDistance;
    })[0];

    const latestSafeStart = addMinutes(nearestWindow.end, -(duration + gapPadding));
    if (target < nearestWindow.start) return nearestWindow.start;
    if (target > latestSafeStart) return latestSafeStart;
    return target;
  }

  const fallbackAfter = sorted.find((course) => course.end >= target) ?? sorted[sorted.length - 1];
  return addMinutes(fallbackAfter.end, gapPadding);
}

function makeSummary(
  classes: PlannerCalendarEvent[],
  prefs: PlannerPreferences,
  recommendations: {
    meals: Array<{
      meal: PlannerMealType;
      recommendation: ReturnType<typeof pickFoodRecommendation>;
    }>;
    gym?: ReturnType<typeof pickGymRecommendation>;
    event?: ReturnType<typeof getCampusEventRecommendation>;
  }
) {
  if (classes.length === 0) {
    return 'No classes were found for this day, so the planner focused on general campus suggestions instead.';
  }

  const first = classes[0];
  const last = classes[classes.length - 1];
  const pieces = [
    `You have ${classes.length} class${classes.length === 1 ? '' : 'es'} between ${formatPlannerTime(first.start)} and ${formatPlannerTime(last.end)}.`,
  ];

  if (!prefs.alreadyOnCampus) {
    pieces.push(`Plan to arrive about ${prefs.arrivalMinutes} minutes before you need to be settled on campus.`);
  }
  if (recommendations.meals.length > 0) {
    const mealLabels = recommendations.meals.map(({ meal }) => MEAL_CONFIG[meal].label.toLowerCase());
    const topRecommendation = recommendations.meals[0].recommendation;
    if (topRecommendation) {
      pieces.push(
        `The planner included ${mealLabels.join(', ')} and is steering you toward ${topRecommendation.bestVenue.name} in ${topRecommendation.buildingName}.`
      );
    }
  }
  if (prefs.wantsGym && recommendations.gym) {
    pieces.push(`If you work out today, ${recommendations.gym.bestSpot.name} is the least busy option right now.`);
  }
  if (prefs.wantsEvents && recommendations.event) {
    pieces.push(`There is also a campus event you could catch later: ${recommendations.event.title}.`);
  }

  return pieces.join(' ');
}

/**
 * Pick the best gym time by checking capacity at candidate hours.
 * Returns the hour (among candidates) with the lowest estimated capacity.
 */
function pickBestGymTime(
  statuses: Record<string, MapBuildingStatus>,
  candidateSlots: Date[]
): Date {
  if (candidateSlots.length === 0) return new Date();
  if (candidateSlots.length === 1) return candidateSlots[0];

  const gymStatus = getBuildingStatus(statuses, GYM_BUILDING);
  if (!gymStatus || gymStatus.resources.gym.length === 0) return candidateSlots[0];

  // Use the average gym capacity as a proxy; compare hour-of-day since
  // the live data is already for the current hour.  We use a simple heuristic:
  // the farther from peak hours (12-14, 16-18), the better.
  const peakPenalty = (date: Date) => {
    const h = date.getHours();
    // Noon-2pm and 4-7pm are peak gym times
    if (h >= 12 && h <= 13) return 30;
    if (h >= 16 && h <= 18) return 25;
    if (h >= 14 && h <= 15) return 15;
    if (h >= 19 && h <= 20) return 10;
    return 0;
  };

  return [...candidateSlots].sort((a, b) => peakPenalty(a) - peakPenalty(b))[0];
}

export function buildPlannerResult({
  classes,
  preferences,
  statuses,
  campusEvents,
  dateKey,
  locationDistanceKm,
  customEvents = [],
  pinnedTimes = {},
}: {
  classes: PlannerCalendarEvent[];
  preferences: PlannerPreferences;
  statuses: Record<string, MapBuildingStatus>;
  campusEvents: CampusEvent[];
  dateKey: string;
  locationDistanceKm: number | null;
  customEvents?: PlannerTimelineItem[];
  pinnedTimes?: Record<string, Date>;
}): PlannerResult {
  const timeline: PlannerTimelineItem[] = [];
  const notes: string[] = [];
  const now = new Date();
  const sortedClasses = [...classes].sort((a, b) => a.start.getTime() - b.start.getTime());
  const lastClass = sortedClasses[sortedClasses.length - 1] ?? null;
  const gymRecommendation = pickGymRecommendation(statuses);
  const parkingRecommendation = pickParkingRecommendation(statuses);

  // Multiple snacks: count how many snack entries appear in the meals array
  const requestedMeals: PlannerMealType[] = [];
  for (const meal of preferences.meals) {
    requestedMeals.push(meal);
  }

  // Track which venue names have been used per run so each meal gets a different restaurant
  const usedVenueNames = new Set<string>();

  // ── 0. Custom events (HIGHEST priority — mark busy first) ──
  const busyIntervals: Array<{ start: Date; end: Date }> = [];

  function markBusy(start: Date, end: Date) {
    busyIntervals.push({ start, end });
    busyIntervals.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  function findEarliestFreeSlot(
    earliest: Date,
    durationMins: number,
    windowEnd?: Date
  ): Date {
    let cursor = new Date(earliest);
    for (const interval of busyIntervals) {
      const slotEnd = addMinutes(cursor, durationMins);
      if (cursor < interval.end && slotEnd > interval.start) {
        cursor = new Date(interval.end.getTime() + 5 * 60_000);
      }
    }
    if (windowEnd && cursor > windowEnd) {
      return addMinutes(windowEnd, -durationMins);
    }
    return cursor;
  }

  // Custom events are immutable — they always occupy their exact time slots
  for (const ce of customEvents) {
    if (ce.startAt && ce.endAt) {
      markBusy(ce.startAt, ce.endAt);
    }
  }

  // ── 1. Commute: pinnable departure time, otherwise anchored to NOW ──
  let campusAvailableAt: Date | null = null;

  if (!preferences.alreadyOnCampus) {
    const travelMinutes = Math.max(10, preferences.arrivalMinutes);
    const pinnedDeparture = pinnedTimes['commute'];
    const departureTime = pinnedDeparture ?? now;
    const arrivalTime = addMinutes(departureTime, travelMinutes);

    const travelDetail =
      preferences.transportMode === 'drive'
        ? parkingRecommendation
          ? `${pinnedDeparture ? 'Planned departure' : 'Leave now'} to arrive by ${formatPlannerTime(arrivalTime)}. ${parkingRecommendation.bestLot.name} is showing about ${parkingRecommendation.bestLot.displayValue} full.`
          : `${pinnedDeparture ? 'Planned departure' : 'Leave now'} to arrive by ${formatPlannerTime(arrivalTime)}.`
        : `${pinnedDeparture ? 'Planned departure' : 'Leave now'} to arrive on campus around ${formatPlannerTime(arrivalTime)}.`;

    timeline.push({
      id: 'commute',
      time: formatPlannerTime(departureTime),
      title: preferences.transportMode === 'drive' ? 'Head to campus and park' : 'Travel to campus',
      detail: travelDetail,
      kind: 'travel',
      startAt: departureTime,
      endAt: arrivalTime,
      durationMinutes: travelMinutes,
    });

    markBusy(departureTime, arrivalTime);
    campusAvailableAt = arrivalTime;

    if (locationDistanceKm !== null) {
      notes.push(`Current location estimate: about ${locationDistanceKm.toFixed(1)} km from UTM.`);
    }
  }

  // ── 2. Classes + walks ──
  sortedClasses.forEach((course, index) => {
    if (index > 0) {
      const prevClass = sortedClasses[index - 1];
      if (prevClass.buildingId !== course.buildingId) {
        const walkMins = walkingMinutes(prevClass.buildingId, course.buildingId);
        const walkStart = addMinutes(course.start, -walkMins);
        timeline.push({
          id: `walk-${prevClass.id}`,
          time: formatPlannerTime(walkStart),
          title: 'Walk to your next building',
          detail: `Give yourself about ${walkMins} minutes to move from ${prevClass.location} to ${course.location}.`,
          kind: 'walk',
          startAt: walkStart,
          endAt: course.start,
          durationMinutes: walkMins,
        });
      }
    }

    timeline.push({
      id: `class-${course.id}`,
      time: formatPlannerTime(course.start),
      title: course.title,
      detail: `${course.location} until ${formatPlannerTime(course.end)}.`,
      kind: 'class',
      startAt: course.start,
      endAt: course.end,
      durationMinutes: Math.max(15, differenceInMinutes(course.end, course.start)),
    });
  });

  // ── 3. Mark classes + walks as busy ──
  for (const item of timeline) {
    if (item.startAt && item.endAt && (item.kind === 'class' || item.kind === 'walk')) {
      markBusy(item.startAt, item.endAt);
    }
  }

  // ── 4. Meals: each gets a DIFFERENT restaurant ──
  // Minimum 45 minutes between meals to prevent back-to-back eating
  const MIN_MEAL_GAP_MINUTES = 45;
  let lastMealEnd: Date | null = null;

  const mealRecommendations = requestedMeals
    .map((meal, mealIndex) => {
      const config = MEAL_CONFIG[meal];
      const windowStart = atTime(dateKey, config.windowStartHour, 0);
      const windowEnd = atTime(dateKey, config.windowEndHour, 0);
      const duration = config.durationMinutes;

      let earliest = windowStart;
      if (campusAvailableAt && campusAvailableAt > earliest) {
        earliest = campusAvailableAt;
      }
      // Enforce minimum gap between meals
      if (lastMealEnd) {
        const gapEnd = addMinutes(lastMealEnd, MIN_MEAL_GAP_MINUTES);
        if (gapEnd > earliest) earliest = gapEnd;
      }

      // For multiple snacks, append an index
      const itemId = meal === 'snack' && mealIndex > 0 ? `food-snack-${mealIndex}` : `food-${meal}`;
      const pinnedTime = pinnedTimes[itemId];

      // Pinned times are immovable anchors — use them exactly, only warn on conflict
      let mealTime: Date;
      if (pinnedTime) {
        mealTime = pinnedTime;
        // Check for conflicts with busy intervals (classes, other pinned items)
        const mealEnd = addMinutes(pinnedTime, duration);
        const hasConflict = busyIntervals.some(
          (interval) => pinnedTime < interval.end && mealEnd > interval.start
        );
        if (hasConflict) {
          notes.push(`Pinned ${MEAL_CONFIG[meal].label.toLowerCase()} at ${formatPlannerTime(pinnedTime)} overlaps another event.`);
        }
      } else {
        mealTime = findEarliestFreeSlot(earliest, duration, windowEnd);
      }
      // Clamp meal to when food venues are actually open
      const foodCloseHour = getLatestFoodClose(dateKey);
      const foodClose = atTime(dateKey, foodCloseHour, 0);
      if (addMinutes(mealTime, duration) > foodClose) {
        notes.push(`Could not schedule ${MEAL_CONFIG[meal].label.toLowerCase()} — restaurants are closed by then.`);
        return null;
      }
      // Check if the meal slot is actually free (packed schedule check)
      if (!pinnedTime) {
        const mealEnd = addMinutes(mealTime, duration);
        const overlaps = busyIntervals.some(
          (interval) => mealTime < interval.end && mealEnd > interval.start
        );
        if (overlaps) {
          notes.push(`Could not fit ${MEAL_CONFIG[meal].label.toLowerCase()} — not enough free time in the schedule.`);
          return null;
        }
      }
      const anchorBuildingId = getMealAnchorBuilding(sortedClasses, mealTime);

      // Pick a food recommendation that hasn't been used yet
      const candidates = FOOD_BUILDINGS
        .map((buildingId) => {
          const status = getBuildingStatus(statuses, buildingId);
          if (!status || status.resources.food.length === 0) return null;
          // Filter out already-used venues
          const available = status.resources.food.filter((v) => !usedVenueNames.has(v.name));
          if (available.length === 0) return null;
          const bestVenue = [...available].sort((a, b) => a.value - b.value)[0];
          const penalty = walkingMinutes(anchorBuildingId, buildingId) * 1.5;
          return {
            buildingId,
            bestVenue,
            buildingName: BUILDING_POINTS[buildingId].name,
            score: bestVenue.value + penalty,
            walkMinutes: walkingMinutes(anchorBuildingId, buildingId),
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .sort((a, b) => a.score - b.score);

      const recommendation = candidates[0] ?? null;
      if (!recommendation) return null;

      usedVenueNames.add(recommendation.bestVenue.name);
      markBusy(mealTime, addMinutes(mealTime, duration));
      lastMealEnd = addMinutes(mealTime, duration);

      return { meal, mealTime, recommendation, config, itemId };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  for (const { meal, mealTime, recommendation, config, itemId } of mealRecommendations) {
    timeline.push({
      id: itemId,
      time: formatPlannerTime(mealTime),
      title: `${config.label} at ${recommendation.bestVenue.name}`,
      detail: `${recommendation.bestVenue.displayValue} wait and about ${recommendation.walkMinutes} minutes away in ${recommendation.buildingName}.`,
      kind: 'food',
      startAt: mealTime,
      endAt: addMinutes(mealTime, config.durationMinutes),
      durationMinutes: config.durationMinutes,
    });
  }

  // ── 5. Gym: placed in the best available slot, optimized for low capacity ──
  if (preferences.wantsGym && gymRecommendation) {
    const gymDuration = 60;
    let gymEarliest = lastClass ? addMinutes(lastClass.end, 10) : atTime(dateKey, 10, 0);
    if (campusAvailableAt && campusAvailableAt > gymEarliest) {
      gymEarliest = campusAvailableAt;
    }

    const pinnedGymTime = pinnedTimes['gym-block'];
    let gymTime: Date;

    if (pinnedGymTime) {
      gymTime = pinnedGymTime;
      // Warn on conflict but respect the pin
      const gymEnd = addMinutes(pinnedGymTime, gymDuration);
      const hasConflict = busyIntervals.some(
        (interval) => pinnedGymTime < interval.end && gymEnd > interval.start
      );
      if (hasConflict) {
        notes.push(`Pinned gym time at ${formatPlannerTime(pinnedGymTime)} overlaps another event.`);
      }
    } else {
      const candidates: Date[] = [];
      const baseSlot = findEarliestFreeSlot(gymEarliest, gymDuration);
      candidates.push(baseSlot);

      for (const offset of [60, 120]) {
        const candidate = findEarliestFreeSlot(addMinutes(baseSlot, offset), gymDuration);
        if (candidate.getTime() !== baseSlot.getTime()) {
          candidates.push(candidate);
        }
      }

      gymTime = pickBestGymTime(statuses, candidates);
    }

    // Ensure gym is within operating hours
    const gymOpenHour = GYM_OPERATING_HOURS['gyma']?.[new Date(`${dateKey}T12:00:00`).getDay()]?.[0] ?? 7;
    const gymCloseHour = getGymCloseHour(dateKey);
    const gymOpen = atTime(dateKey, gymOpenHour, 0);
    const gymClose = atTime(dateKey, gymCloseHour, 0);
    if (gymTime < gymOpen) gymTime = gymOpen;
    if (addMinutes(gymTime, gymDuration) > gymClose) {
      gymTime = addMinutes(gymClose, -gymDuration);
    }

    // Check if gym slot is actually free (packed schedule)
    if (!pinnedGymTime) {
      const gymEnd = addMinutes(gymTime, gymDuration);
      const overlaps = busyIntervals.some(
        (interval) => gymTime < interval.end && gymEnd > interval.start
      );
      if (overlaps || gymTime < gymOpen) {
        notes.push('Could not fit a gym session — not enough free time in the schedule.');
      } else {
        markBusy(gymTime, gymEnd);
        timeline.push({
          id: 'gym-block',
          time: formatPlannerTime(gymTime),
          title: `Workout at ${gymRecommendation.bestSpot.name}`,
          detail: `${gymRecommendation.bestSpot.displayValue} occupancy right now in ${gymRecommendation.buildingName}.`,
          kind: 'gym',
          startAt: gymTime,
          endAt: gymEnd,
          durationMinutes: gymDuration,
        });
      }
    } else {
      markBusy(gymTime, addMinutes(gymTime, gymDuration));
      timeline.push({
        id: 'gym-block',
        time: formatPlannerTime(gymTime),
        title: `Workout at ${gymRecommendation.bestSpot.name}`,
        detail: `${gymRecommendation.bestSpot.displayValue} occupancy right now in ${gymRecommendation.buildingName}.`,
        kind: 'gym',
        startAt: gymTime,
        endAt: addMinutes(gymTime, gymDuration),
        durationMinutes: gymDuration,
      });
    }
  }

  // ── 6. Campus events ──
  const eventRecommendation = preferences.wantsEvents
    ? getCampusEventRecommendation(campusEvents, dateKey, lastClass ? lastClass.end : null)
    : null;

  if (eventRecommendation) {
    timeline.push({
      id: `event-${eventRecommendation.id}`,
      time: formatPlannerTime(eventRecommendation.start),
      title: `Campus event: ${eventRecommendation.title}`,
      detail: `${eventRecommendation.club} at ${eventRecommendation.location ?? 'campus location'} until ${eventRecommendation.endTime}.`,
      kind: 'event',
      startAt: eventRecommendation.start,
      endAt: new Date(`${eventRecommendation.date}T${eventRecommendation.endTime}:00`),
      durationMinutes: Math.max(
        30,
        differenceInMinutes(
          new Date(`${eventRecommendation.date}T${eventRecommendation.endTime}:00`),
          eventRecommendation.start
        )
      ),
    });
  } else if (preferences.wantsEvents) {
    notes.push('No same-day campus events were found after your classes, so the planner did not add one.');
  }

  // ── 7. Study blocks: fill remaining free time ──
  if (preferences.studyHours > 0) {
    const totalStudyMinutes = preferences.studyHours * 60;
    let remainingStudy = totalStudyMinutes;
    const dayStart = atTime(dateKey, 8, 0);
    const dayEnd = atTime(dateKey, 23, 59);
    let studyBlockIndex = 0;

    // Find all free gaps in the day after all other events
    const allBusy = [...busyIntervals].sort((a, b) => a.start.getTime() - b.start.getTime());
    let cursor = campusAvailableAt && campusAvailableAt > dayStart ? campusAvailableAt : dayStart;

    for (const interval of allBusy) {
      if (remainingStudy <= 0) break;
      const gapStart = cursor;
      const gapEnd = interval.start;
      const gapMinutes = differenceInMinutes(gapEnd, gapStart);

      if (gapMinutes >= 25) {
        const blockMinutes = Math.min(gapMinutes - 5, remainingStudy);
        if (blockMinutes >= 25) {
          const studyStart = gapStart;
          const studyEnd = addMinutes(studyStart, blockMinutes);
          timeline.push({
            id: `study-${studyBlockIndex++}`,
            time: formatPlannerTime(studyStart),
            title: 'Study session',
            detail: `${blockMinutes} min study block. Find a quiet spot on campus.`,
            kind: 'study',
            startAt: studyStart,
            endAt: studyEnd,
            durationMinutes: blockMinutes,
          });
          markBusy(studyStart, studyEnd);
          remainingStudy -= blockMinutes;
        }
      }

      cursor = interval.end.getTime() > cursor.getTime()
        ? new Date(interval.end.getTime() + 5 * 60_000)
        : new Date(cursor.getTime() + 5 * 60_000);
    }

    // After all busy intervals, fill tail gap
    if (remainingStudy > 0 && cursor < dayEnd) {
      const gapMinutes = differenceInMinutes(dayEnd, cursor);
      const blockMinutes = Math.min(gapMinutes, remainingStudy);
      if (blockMinutes >= 25) {
        const studyStart = cursor;
        const studyEnd = addMinutes(studyStart, blockMinutes);
        timeline.push({
          id: `study-${studyBlockIndex++}`,
          time: formatPlannerTime(studyStart),
          title: 'Study session',
          detail: `${blockMinutes} min study block. Find a quiet spot on campus.`,
          kind: 'study',
          startAt: studyStart,
          endAt: studyEnd,
          durationMinutes: blockMinutes,
        });
        markBusy(studyStart, studyEnd);
        remainingStudy -= blockMinutes;
      }
    }

    if (remainingStudy > 0 && totalStudyMinutes > remainingStudy) {
      notes.push(`Could only fit ${Math.round((totalStudyMinutes - remainingStudy) / 60 * 10) / 10}h of study time today.`);
    }
  }

  // ── 8. Fallback: no data at all ──
  if (timeline.length === 0) {
    timeline.push({
      id: 'note',
      time: 'Today',
      title: 'No class data found',
      detail: 'Upload a valid calendar export to generate a campus plan for this day.',
      kind: 'note',
      startAt: null,
      endAt: null,
      durationMinutes: 30,
    });
  }

  // ── 9. Sort: commute first, then chronological, then by kind priority ──
  timeline.sort((a, b) => {
    if (a.time === 'Today') return 1;
    if (b.time === 'Today') return -1;

    const aTime = a.startAt?.getTime() ?? 0;
    const bTime = b.startAt?.getTime() ?? 0;
    if (aTime !== bTime) return aTime - bTime;

    const kindPriority = (item: PlannerTimelineItem) => {
      if (item.id === 'commute') return 0;
      if (item.kind === 'class') return 1;
      if (item.kind === 'walk') return 2;
      return 3;
    };
    return kindPriority(a) - kindPriority(b);
  });

  return {
    summary: makeSummary(sortedClasses, preferences, {
      meals: mealRecommendations.map(({ meal, recommendation }) => ({ meal, recommendation })),
      gym: gymRecommendation,
      event: eventRecommendation ?? undefined,
    }),
    timeline,
    notes,
  };
}
