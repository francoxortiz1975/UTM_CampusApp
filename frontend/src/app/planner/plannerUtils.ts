import type { CampusEvent } from '../events/mockEvents';
import type { MapBuildingStatus } from '../map/mapAvailability';

export type PlannerTransportMode = 'drive' | 'transit' | 'walk';

export type PlannerPreferences = {
  alreadyOnCampus: boolean;
  transportMode: PlannerTransportMode;
  arrivalMinutes: number;
  wantsFood: boolean;
  wantsGym: boolean;
  wantsEvents: boolean;
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
  kind: 'travel' | 'class' | 'walk' | 'food' | 'gym' | 'event' | 'note';
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
  mn: { x: 254, y: 238, name: 'Maanjiwe Nendamowinan' },
  dh: { x: 228, y: 422, name: 'Deerfield Hall' },
  oph: { x: 364, y: 682, name: 'Oscar Peterson Hall' },
  ib: { x: 580, y: 138, name: 'Instructional Building' },
  ccit: { x: 762, y: 306, name: 'CCIT' },
  student: { x: 568, y: 694, name: 'Student Centre' },
  kn: { x: 716, y: 786, name: 'Kaneff Centre' },
  davis_rawc: { x: 936, y: 810, name: 'Davis / RAWC' },
};

const FOOD_BUILDINGS = ['mn', 'dh', 'oph', 'ib', 'ccit', 'student', 'kn', 'davis_rawc'] as const;
const GYM_BUILDING = 'davis_rawc';
const PARKING_BUILDING = 'ccit';

const weekdayTokens = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

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

function makeSummary(
  classes: PlannerCalendarEvent[],
  prefs: PlannerPreferences,
  recommendations: {
    food?: ReturnType<typeof pickFoodRecommendation>;
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
  if (prefs.wantsFood && recommendations.food) {
    pieces.push(`The best food stop today looks like ${recommendations.food.bestVenue.name} in ${recommendations.food.buildingName}.`);
  }
  if (prefs.wantsGym && recommendations.gym) {
    pieces.push(`If you work out today, ${recommendations.gym.bestSpot.name} is the least busy option right now.`);
  }
  if (prefs.wantsEvents && recommendations.event) {
    pieces.push(`There is also a campus event you could catch later: ${recommendations.event.title}.`);
  }

  return pieces.join(' ');
}

export function buildPlannerResult({
  classes,
  preferences,
  statuses,
  campusEvents,
  dateKey,
  locationDistanceKm,
}: {
  classes: PlannerCalendarEvent[];
  preferences: PlannerPreferences;
  statuses: Record<string, MapBuildingStatus>;
  campusEvents: CampusEvent[];
  dateKey: string;
  locationDistanceKm: number | null;
}): PlannerResult {
  const timeline: PlannerTimelineItem[] = [];
  const notes: string[] = [];
  const sortedClasses = [...classes].sort((a, b) => a.start.getTime() - b.start.getTime());
  const firstClass = sortedClasses[0] ?? null;
  const lastClass = sortedClasses[sortedClasses.length - 1] ?? null;
  const foodRecommendation = pickFoodRecommendation(statuses, firstClass?.buildingId ?? null);
  const gymRecommendation = pickGymRecommendation(statuses);
  const parkingRecommendation = pickParkingRecommendation(statuses);

  if (!preferences.alreadyOnCampus && firstClass) {
    const arrivalWindow = addMinutes(firstClass.start, -Math.max(10, preferences.arrivalMinutes));
    const travelDetail =
      preferences.transportMode === 'drive'
        ? parkingRecommendation
          ? `Leave enough time to park near ${parkingRecommendation.buildingName}. ${parkingRecommendation.bestLot.name} is showing about ${parkingRecommendation.bestLot.displayValue} full.`
          : 'Leave enough time to park before your first class.'
        : `Leave for campus so you arrive around ${formatPlannerTime(arrivalWindow)}.`;

    timeline.push({
      id: 'commute',
      time: formatPlannerTime(arrivalWindow),
      title: preferences.transportMode === 'drive' ? 'Head to campus and park' : 'Travel to campus',
      detail: travelDetail,
      kind: 'travel',
      startAt: arrivalWindow,
      endAt: firstClass.start,
      durationMinutes: Math.max(15, differenceInMinutes(firstClass.start, arrivalWindow)),
    });

    if (locationDistanceKm !== null) {
      notes.push(`Current location estimate: about ${locationDistanceKm.toFixed(1)} km from UTM.`);
    }
  }

  sortedClasses.forEach((course, index) => {
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

    const nextClass = sortedClasses[index + 1];
    if (!nextClass) return;

    if (course.buildingId !== nextClass.buildingId) {
      const walkMins = walkingMinutes(course.buildingId, nextClass.buildingId);
      timeline.push({
        id: `walk-${course.id}`,
        time: formatPlannerTime(course.end),
        title: 'Walk to your next building',
        detail: `Give yourself about ${walkMins} minutes to move from ${course.location} to ${nextClass.location}.`,
        kind: 'walk',
        startAt: course.end,
        endAt: addMinutes(course.end, walkMins),
        durationMinutes: walkMins,
      });
    }

    const gapMinutes = differenceInMinutes(nextClass.start, course.end);
    const crossesLunchWindow = course.end.getHours() < 14 && nextClass.start.getHours() >= 11;

    if (preferences.wantsFood && !timeline.some((item) => item.kind === 'food') && gapMinutes >= 35 && crossesLunchWindow && foodRecommendation) {
      const lunchTime = addMinutes(course.end, 10);
      timeline.push({
        id: 'food-stop',
        time: formatPlannerTime(lunchTime),
        title: `Grab food at ${foodRecommendation.bestVenue.name}`,
        detail: `${foodRecommendation.bestVenue.displayValue} wait and about ${foodRecommendation.walkMinutes} minutes away in ${foodRecommendation.buildingName}.`,
        kind: 'food',
        startAt: lunchTime,
        endAt: addMinutes(lunchTime, 45),
        durationMinutes: 45,
      });
    }
  });

  if (preferences.wantsFood && !timeline.some((item) => item.kind === 'food') && foodRecommendation && lastClass) {
    const fallbackFoodTime = addMinutes(lastClass.end, 15);
    timeline.push({
      id: 'food-fallback',
      time: formatPlannerTime(fallbackFoodTime),
      title: `Food option: ${foodRecommendation.bestVenue.name}`,
      detail: `If you stay on campus after class, ${foodRecommendation.bestVenue.displayValue} is the lightest current wait near ${foodRecommendation.buildingName}.`,
      kind: 'food',
      startAt: fallbackFoodTime,
      endAt: addMinutes(fallbackFoodTime, 45),
      durationMinutes: 45,
    });
  }

  if (preferences.wantsGym && gymRecommendation && lastClass) {
    const gymTime = addMinutes(lastClass.end, preferences.wantsFood ? 75 : 30);
    timeline.push({
      id: 'gym-block',
      time: formatPlannerTime(gymTime),
      title: `Workout at ${gymRecommendation.bestSpot.name}`,
      detail: `${gymRecommendation.bestSpot.displayValue} occupancy right now in ${gymRecommendation.buildingName}.`,
      kind: 'gym',
      startAt: gymTime,
      endAt: addMinutes(gymTime, 60),
      durationMinutes: 60,
    });
  }

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

  timeline.sort((a, b) => {
    if (a.time === 'Today') return 1;
    if (b.time === 'Today') return -1;
    const toMinutes = (value: string) => {
      const match = value.match(/(\d+):(\d+)\s?(AM|PM)/i);
      if (!match) return 0;
      let hour = Number(match[1]) % 12;
      const minute = Number(match[2]);
      if (match[3].toUpperCase() === 'PM') hour += 12;
      return hour * 60 + minute;
    };
      return toMinutes(a.time) - toMinutes(b.time);
  });

  return {
    summary: makeSummary(sortedClasses, preferences, {
      food: foodRecommendation,
      gym: gymRecommendation,
      event: eventRecommendation,
    }),
    timeline,
    notes,
  };
}
