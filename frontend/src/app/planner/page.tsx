'use client';

import { useEffect, useMemo, useRef, useState, useCallback, type ChangeEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Dumbbell,
  FileText,
  LocateFixed,
  LoaderCircle,
  MapPinned,
  Minus,
  Pencil,
  Plus,
  Route,
  Shield,
  Sparkles,
  Timer,
  Upload,
  Utensils,
  Waves,
  X,
} from 'lucide-react';
import Header from '../../components/Header';
import { MOCK_EVENTS } from '../events/mockEvents';
import { MAP_BUILDINGS } from '../map/mapData';
import {
  buildFallbackStatus,
  loadAllBuildingStatuses,
  loadHourlyBuildingStatuses,
  type MapBuildingStatus,
} from '../map/mapAvailability';
import { Profile, type User } from '../../types/Authentication';
import { loadSavedPlannerCalendar, savePlannerCalendar } from './plannerApi';
import {
  buildPlannerResult,
  estimateArrivalMinutes,
  estimateDistanceToCampusKm,
  formatDateKey,
  formatHumanDate,
  formatPlannerTime,
  getAllFoodVenues,
  getAvailableDateKeys,
  getGymOpenHour,
  getGymCloseHour,
  getLatestFoodClose,
  getEventsForDate,
  MEAL_CONFIG,
  parseIcsCalendar,
  type PlannerCalendarEvent,
  type PlannerMealType,
  type PlannerPreferences,
  type PlannerTimelineItem,
  type PlannerTransportMode,
} from './plannerUtils';

/* ───────────────────────────── persistence keys ───────────────────────────── */

const PLANNER_GLOBAL_KEY = 'utm-planner-global';
const PLANNER_DAY_PREFIX = 'utm-planner-day-';

/* ───────────────────────────── wizard types ──────────────────────────────── */

type WizardStep =
  | 'calendar-upload'
  | 'starting-info'
  | 'leave-time'
  | 'commute-duration'
  | 'blocked-times'
  | 'gym'
  | 'breakfast'
  | 'lunch'
  | 'study'
  | 'dinner'
  | 'complete';

type WizardAnswers = {
  alreadyOnCampus: boolean;
  transportMode: PlannerTransportMode;
  arrivalMinutes: number;
  departureTime: string; // HH:MM format
  travelDuration: number; // minutes

  // Blocked times
  blockedTimes: Array<{ label: string; startHour: number; startMinute: number; endHour: number; endMinute: number }>;

  // Gym
  wantsGym: boolean;
  gymIsSwimming: boolean;
  gymTimePreference: 'optimized' | 'specific';
  gymSpecificTime: string; // HH:MM
  gymDurationMinutes: number; // 30, 45, 60, 90

  // Meals
  meals: PlannerMealType[];
  mealVenueChoices: Record<string, string>; // meal id -> venue name
  mealTimePreferences: Record<string, 'optimized' | 'specific'>; // e.g. 'food-breakfast' -> 'specific'
  mealSpecificTimes: Record<string, string>; // e.g. 'food-breakfast' -> '08:30'

  // Study
  studyHours: number;
  studyTimePreference: 'optimized' | 'specific';
  studySpecificTime: string; // HH:MM
};

const WIZARD_STEPS_ORDER: WizardStep[] = [
  'calendar-upload',
  'starting-info',
  'leave-time',
  'commute-duration',
  'blocked-times',
  'gym',
  'breakfast',
  'lunch',
  'study',
  'dinner',
  'complete',
];

const freshWizardAnswers: WizardAnswers = {
  alreadyOnCampus: false,
  transportMode: 'drive',
  arrivalMinutes: 30,
  departureTime: '',
  travelDuration: 30,
  blockedTimes: [],
  wantsGym: false,
  gymIsSwimming: false,
  gymTimePreference: 'optimized',
  gymSpecificTime: '',
  gymDurationMinutes: 60,
  meals: [],
  mealVenueChoices: {},
  mealTimePreferences: {},
  mealSpecificTimes: {},
  studyHours: 0,
  studyTimePreference: 'optimized',
  studySpecificTime: '',
};

/* ───────────────────────────── persistence types ─────────────────────────── */

type SavedDayState = {
  customEvents: Array<{
    id: string;
    time: string;
    title: string;
    detail: string;
    kind: PlannerTimelineItem['kind'];
    startAt: string | null;
    endAt: string | null;
    durationMinutes: number;
  }>;
  pinnedTimes: Record<string, string>;
  mealVenueOverrides: Record<string, string>;
  preferences?: PlannerPreferences;
  wizardAnswers?: WizardAnswers;
};

type SavedGlobalState = {
  selectedDate: string;
};

/* ───────────────────────────── persistence helpers ───────────────────────── */

function saveDayState(
  dateKey: string,
  customEvents: PlannerTimelineItem[],
  pinnedTimes: Record<string, Date>,
  mealVenueOverrides: Record<string, string>,
  preferences?: PlannerPreferences,
  wizardAnswers?: WizardAnswers,
) {
  const state: SavedDayState = {
    customEvents: customEvents.map((e) => ({
      id: e.id,
      time: e.time,
      title: e.title,
      detail: e.detail,
      kind: e.kind,
      startAt: e.startAt?.toISOString() ?? null,
      endAt: e.endAt?.toISOString() ?? null,
      durationMinutes: e.durationMinutes,
    })),
    pinnedTimes: Object.fromEntries(
      Object.entries(pinnedTimes).map(([k, v]) => [k, v.toISOString()])
    ),
    mealVenueOverrides,
    preferences,
    wizardAnswers,
  };
  try {
    localStorage.setItem(`${PLANNER_DAY_PREFIX}${dateKey}`, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable
  }
}

function loadDayState(dateKey: string): SavedDayState | null {
  try {
    const raw = localStorage.getItem(`${PLANNER_DAY_PREFIX}${dateKey}`);
    if (!raw) return null;
    return JSON.parse(raw) as SavedDayState;
  } catch {
    return null;
  }
}

/** Default preferences for a fresh day -- all checkboxes off, study 0 */
const freshDayPreferences: PlannerPreferences = {
  alreadyOnCampus: false,
  transportMode: 'drive',
  arrivalMinutes: 30,
  meals: [],
  wantsGym: false,
  wantsEvents: false,
  studyHours: 0,
};

function restoreDayState(
  dateKey: string,
  setCustomEvents: (v: PlannerTimelineItem[]) => void,
  setPinnedTimes: (v: Record<string, Date>) => void,
  setMealVenueOverrides: (v: Record<string, string>) => void,
  setPreferences?: (v: PlannerPreferences) => void,
  setWizardAnswers?: (v: WizardAnswers) => void,
  setWizardStep?: (v: WizardStep) => void,
) {
  const saved = loadDayState(dateKey);
  if (!saved) {
    setCustomEvents([]);
    setPinnedTimes({});
    setMealVenueOverrides({});
    // New day with no saved state -> reset preferences to blank
    if (setPreferences) setPreferences(freshDayPreferences);
    if (setWizardAnswers) setWizardAnswers(freshWizardAnswers);
    if (setWizardStep) setWizardStep('calendar-upload');
    return;
  }
  setCustomEvents(
    saved.customEvents.map((e) => ({
      ...e,
      startAt: e.startAt ? new Date(e.startAt) : null,
      endAt: e.endAt ? new Date(e.endAt) : null,
    }))
  );
  setPinnedTimes(
    Object.fromEntries(
      Object.entries(saved.pinnedTimes).map(([k, v]) => [k, new Date(v)])
    )
  );
  setMealVenueOverrides(saved.mealVenueOverrides);
  // Restore saved preferences for this day (or reset to blank if not saved)
  if (setPreferences) setPreferences(saved.preferences ?? freshDayPreferences);
  if (setWizardAnswers) {
    setWizardAnswers(saved.wizardAnswers ?? freshWizardAnswers);
  }
  // If this day has saved wizard answers with preferences, jump to complete
  if (setWizardStep) {
    if (saved.wizardAnswers && saved.preferences) {
      setWizardStep('complete');
    } else {
      setWizardStep('calendar-upload');
    }
  }
}

/** Remove stored day data for dates before today */
function pruneOldDays(todayKey: string) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PLANNER_DAY_PREFIX)) {
        const dateKey = key.slice(PLANNER_DAY_PREFIX.length);
        if (dateKey < todayKey) {
          localStorage.removeItem(key);
        }
      }
    }
    // Also remove the legacy single-blob key if present
    localStorage.removeItem('utm-planner-state');
  } catch {
    // ignore
  }
}

const initialPreferences: PlannerPreferences = {
  alreadyOnCampus: false,
  transportMode: 'drive',
  arrivalMinutes: 30,
  meals: [],
  wantsGym: false,
  wantsEvents: false,
  studyHours: 0,
};

/* ───────────────────────────── scheduling helpers ────────────────────────── */

type PlannerFlexibleSlot = {
  id: string;
  label: string;
  prevClass: PlannerTimelineItem | null;
  nextClass: PlannerTimelineItem | null;
  items: PlannerTimelineItem[];
};

function plannerDayTime(dateKey: string, hour: number, minute = 0) {
  return new Date(`${dateKey}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
}

function getMealWindowStart(item: PlannerTimelineItem, dateKey: string): Date | null {
  // For breakfast/lunch/dinner food items, return the earliest acceptable start time
  if (item.kind !== 'food') return null;
  if (item.id === 'food-breakfast') return plannerDayTime(dateKey, MEAL_CONFIG.breakfast.windowStartHour, 0);
  if (item.id === 'food-lunch') return plannerDayTime(dateKey, MEAL_CONFIG.lunch.windowStartHour, 0);
  if (item.id === 'food-dinner') return plannerDayTime(dateKey, MEAL_CONFIG.dinner.windowStartHour, 0);
  // Snacks (food-snack, food-snack-*) can be any time
  return null;
}

function scheduleSlotItems(slot: PlannerFlexibleSlot, dateKey: string, pinnedIds: Set<string>) {
  if (slot.items.length === 0) return [];

  const isFixed = (item: PlannerTimelineItem) =>
    item.id.startsWith('custom-') || pinnedIds.has(item.id) || item.id === 'commute';

  const gapMinutes = 10;
  const gapMs = gapMinutes * 60_000;
  // Minimum gap between two food events so they don't sit back-to-back
  const foodGapMs = 30 * 60_000;
  const dayStart = plannerDayTime(dateKey, 8, 0);
  const slotEnd = slot.nextClass?.startAt
    ? new Date((slot.nextClass.startAt as Date).getTime() - gapMs)
    : plannerDayTime(dateKey, 23, 59);

  // Determine the start of the scheduling window
  let windowStart = dayStart;
  if (slot.prevClass) {
    windowStart = new Date((slot.prevClass.endAt ?? slot.prevClass.startAt ?? dayStart).getTime() + gapMs);
  }

  // Separate fixed and movable items
  const fixedItems = slot.items.filter((item) => isFixed(item));
  const movableItems = slot.items.filter((item) => !isFixed(item));

  // Fixed items define immovable time ranges -- sorted by start time
  const fixedRanges = fixedItems
    .filter((item) => item.startAt && item.endAt)
    .map((item) => ({
      start: item.startAt!.getTime(),
      end: item.endAt!.getTime(),
      id: item.id,
    }))
    .sort((a, b) => a.start - b.start);

  // If this is the "before-first" slot, movable items must not start before
  // the commute arrival time (endAt of the commute item)
  const commuteItem = fixedItems.find((item) => item.id === 'commute');
  if (commuteItem?.endAt && commuteItem.endAt.getTime() > windowStart.getTime()) {
    windowStart = new Date(commuteItem.endAt.getTime() + gapMs);
  }

  // Schedule movable items into free gaps around fixed items, respecting their drag order
  const scheduled: PlannerTimelineItem[] = [];
  let cursor = windowStart;

  // Helper: advance cursor past any fixed range it overlaps with
  function advancePastFixed(c: Date): Date {
    let t = c.getTime();
    for (const range of fixedRanges) {
      if (t >= range.start - gapMs && t < range.end + gapMs) {
        t = range.end + gapMs;
      }
    }
    return new Date(t);
  }

  let lastFoodEndMs = 0; // track when the last food item ends

  // Compute operating-hour limits for gym and food
  const gymCloseTime = (() => {
    try { return plannerDayTime(dateKey, getGymCloseHour(dateKey), 0); } catch { return slotEnd; }
  })();
  const foodCloseTime = (() => {
    try { return plannerDayTime(dateKey, getLatestFoodClose(dateKey), 0); } catch { return slotEnd; }
  })();

  for (const item of movableItems) {
    cursor = advancePastFixed(cursor);

    // Enforce no back-to-back food: if this is a food item and we just placed one,
    // push cursor forward so there's a gap (unless the gap would push past slotEnd)
    if (item.kind === 'food' && lastFoodEndMs > 0) {
      const minFoodStart = lastFoodEndMs + foodGapMs;
      if (cursor.getTime() < minFoodStart && new Date(minFoodStart) < slotEnd) {
        cursor = advancePastFixed(new Date(minFoodStart));
      }
    }

    // Respect meal time windows -- don't move breakfast/lunch/dinner before their allowed hours
    const mealWindowStart = getMealWindowStart(item, dateKey);
    if (mealWindowStart && cursor < mealWindowStart) {
      cursor = advancePastFixed(mealWindowStart);
    }

    const startAt = new Date(cursor);
    let endAt = new Date(startAt.getTime() + item.durationMinutes * 60_000);

    // Enforce operating hours: gym can't extend past gym close, food past food close
    if (item.kind === 'gym' && endAt > gymCloseTime) {
      const shiftedStart = new Date(gymCloseTime.getTime() - item.durationMinutes * 60_000);
      if (shiftedStart >= cursor) {
        endAt = gymCloseTime;
      } else {
        endAt = gymCloseTime;
      }
    }
    if (item.kind === 'food' && endAt > foodCloseTime) {
      endAt = foodCloseTime;
    }

    // Effective slot boundary -- also consider venue closing times
    const effectiveEnd = item.kind === 'gym' ? new Date(Math.min(slotEnd.getTime(), gymCloseTime.getTime()))
      : item.kind === 'food' ? new Date(Math.min(slotEnd.getTime(), foodCloseTime.getTime()))
      : slotEnd;

    // If item starts at or past the effective boundary, skip it entirely
    if (startAt >= effectiveEnd) {
      scheduled.push({ ...item });
      continue;
    }

    // Cap items that would bleed past the effective boundary
    if (endAt > effectiveEnd) {
      endAt = effectiveEnd;
    }

    const effectiveDuration = Math.max(5, Math.round((endAt.getTime() - startAt.getTime()) / 60_000));

    scheduled.push({
      ...item,
      startAt,
      endAt,
      durationMinutes: effectiveDuration,
      time: formatPlannerTime(startAt),
    });
    if (item.kind === 'food') lastFoodEndMs = endAt.getTime();
    cursor = new Date(endAt.getTime() + gapMs);
  }

  // Trim fixed items (pinned food/gym) that bleed past the slot boundary
  // NEVER trim custom events — they are user-defined immovable blocks
  const trimmedFixed = fixedItems.map((fi) => {
    if (!fi.startAt || !fi.endAt) return fi;
    if (fi.id.startsWith('custom-')) return fi; // custom events are sacred — never trim
    const closeTime = fi.kind === 'gym' ? gymCloseTime
      : fi.kind === 'food' ? foodCloseTime
      : slotEnd;
    const effectiveBoundary = new Date(Math.min(slotEnd.getTime(), closeTime.getTime()));
    if (fi.endAt <= effectiveBoundary) return fi;
    const trimmedEnd = effectiveBoundary;
    const trimmedDuration = Math.max(10, Math.round((trimmedEnd.getTime() - fi.startAt.getTime()) / 60_000));
    return { ...fi, endAt: trimmedEnd, durationMinutes: trimmedDuration };
  });

  // Merge fixed and scheduled items, sorted by start time
  const allItems = [
    ...trimmedFixed,
    ...scheduled,
  ].sort((a, b) => {
    const aTime = a.startAt?.getTime() ?? 0;
    const bTime = b.startAt?.getTime() ?? 0;
    return aTime - bTime;
  });

  return allItems;
}

function buildFlexibleSlots(timeline: PlannerTimelineItem[]) {
  const classItems = timeline.filter((item) => item.kind === 'class');
  const flexibleItems = timeline.filter((item) => item.kind !== 'class');

  if (classItems.length === 0) {
    return [
      {
        id: 'open-day',
        label: 'Flexible plan',
        prevClass: null,
        nextClass: null,
        items: flexibleItems.length > 0 ? flexibleItems : [],
      },
    ];
  }

  const slots: PlannerFlexibleSlot[] = [
    {
      id: 'before-first',
      label: 'Before classes',
      prevClass: null,
      nextClass: classItems[0],
      items: [],
    },
  ];

  for (let index = 0; index < classItems.length - 1; index += 1) {
    slots.push({
      id: `between-${index}`,
      label: 'Between classes',
      prevClass: classItems[index],
      nextClass: classItems[index + 1],
      items: [],
    });
  }

  slots.push({
    id: 'after-last',
    label: 'After classes',
    prevClass: classItems[classItems.length - 1],
    nextClass: null,
    items: [],
  });

  flexibleItems.forEach((item) => {
    const itemTime = item.startAt?.getTime() ?? 0;
    const firstClassStart = classItems[0].startAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const lastClassStart = classItems[classItems.length - 1].startAt?.getTime() ?? 0;

    if (itemTime < firstClassStart) {
      slots[0].items.push(item);
      return;
    }

    if (itemTime >= lastClassStart) {
      slots[slots.length - 1].items.push(item);
      return;
    }

    for (let index = 0; index < classItems.length - 1; index += 1) {
      const nextStart = classItems[index + 1].startAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (itemTime < nextStart) {
        slots[index + 1].items.push(item);
        return;
      }
    }

    slots[slots.length - 1].items.push(item);
  });

  return slots;
}

function updateSlotDuration(
  slots: PlannerFlexibleSlot[],
  itemId: string,
  durationMinutes: number
) {
  const clamped = Math.max(10, durationMinutes);
  return slots.map((slot) => ({
    ...slot,
    items: slot.items.map((item) => {
      if (item.id !== itemId) return item;
      const updated: PlannerTimelineItem = { ...item, durationMinutes: clamped };
      // Recalculate endAt so fixed/pinned items don't bleed with stale endAt
      if (updated.startAt) {
        updated.endAt = new Date(updated.startAt.getTime() + clamped * 60_000);
      }
      return updated;
    }),
  }));
}


const kindStyles: Record<
  PlannerTimelineItem['kind'],
  { border: string; icon: typeof Sparkles; badge: string }
> = {
  travel: {
    border: 'border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30',
    icon: Route,
    badge: 'text-blue-700 dark:text-blue-300',
  },
  class: {
    border: 'border-slate-200 bg-white dark:border-zinc-700 dark:bg-zinc-900',
    icon: CalendarDays,
    badge: 'text-slate-700 dark:text-zinc-200',
  },
  walk: {
    border: 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30',
    icon: MapPinned,
    badge: 'text-amber-700 dark:text-amber-300',
  },
  food: {
    border: 'border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/30',
    icon: Utensils,
    badge: 'text-orange-700 dark:text-orange-300',
  },
  gym: {
    border: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30',
    icon: Dumbbell,
    badge: 'text-emerald-700 dark:text-emerald-300',
  },
  event: {
    border: 'border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/30',
    icon: Sparkles,
    badge: 'text-violet-700 dark:text-violet-300',
  },
  study: {
    border: 'border-indigo-200 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/30',
    icon: BookOpen,
    badge: 'text-indigo-700 dark:text-indigo-300',
  },
  note: {
    border: 'border-slate-200 bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900',
    icon: Clock3,
    badge: 'text-slate-700 dark:text-zinc-200',
  },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function PlannerPage() {
  const todayKey = formatDateKey(new Date());
  const [calendarEvents, setCalendarEvents] = useState<PlannerCalendarEvent[]>([]);
  const [calendarSource, setCalendarSource] = useState<'empty' | 'ics' | 'saved'>('empty');
  const [uploadMessage, setUploadMessage] = useState(
    'Upload a UTM `.ics` calendar to build a personalized plan for today.'
  );
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [preferences, setPreferences] = useState<PlannerPreferences>(initialPreferences);
  const [statuses, setStatuses] = useState<Record<string, MapBuildingStatus>>(() =>
    Object.fromEntries(
      MAP_BUILDINGS.map((building) => [building.id, buildFallbackStatus(building)])
    )
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [locationDistanceKm, setLocationDistanceKm] = useState<number | null>(null);
  const [locationMessage, setLocationMessage] = useState(
    'Want a rough commute estimate? Use your location to autofill arrival time.'
  );
  const [isLocating, setIsLocating] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [flexibleSlots, setFlexibleSlots] = useState<PlannerFlexibleSlot[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [rawCalendarText, setRawCalendarText] = useState<string | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [pendingCalendarText, setPendingCalendarText] = useState<string | null>(null);
  const [mealVenueOverrides, setMealVenueOverrides] = useState<Record<string, string>>({});
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [customEventTitle, setCustomEventTitle] = useState('');
  const [customEventHour, setCustomEventHour] = useState(12);
  const [customEventMinute, setCustomEventMinute] = useState(0);
  const [customEventDuration, setCustomEventDuration] = useState(60);
  const [customEventLocation, setCustomEventLocation] = useState('');
  const [customEvents, setCustomEvents] = useState<PlannerTimelineItem[]>([]);
  const [pinnedTimes, setPinnedTimes] = useState<Record<string, Date>>({});
  const [editingTimeItemId, setEditingTimeItemId] = useState<string | null>(null);
  const [conflictPopup, setConflictPopup] = useState<string | null>(null);
  const [hourlyStatuses, setHourlyStatuses] = useState<Record<number, Record<string, MapBuildingStatus>>>({});

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('calendar-upload');
  const [wizardAnswers, setWizardAnswers] = useState<WizardAnswers>(freshWizardAnswers);

  // Blocked-times form state (lifted from wizard card)
  const [btLabel, setBtLabel] = useState('');
  const [btStartTime, setBtStartTime] = useState('09:00');
  const [btEndTime, setBtEndTime] = useState('10:00');
  const [btError, setBtError] = useState<string | null>(null);
  const [wantsBlocked, setWantsBlocked] = useState(false);

  // Overflow choice dialog — shown when items can't fit so the user can pick what to keep
  const [overflowItems, setOverflowItems] = useState<string[]>([]); // list of failure note strings
  const [showOverflowDialog, setShowOverflowDialog] = useState(false);

  const hasCalendar = calendarSource !== 'empty' && calendarEvents.length > 0;

  /* ─────────────────────── restore/save from localStorage ─────────────────── */

  // Restore planner state from localStorage on mount
  useEffect(() => {
    // Prune day data for dates that have already passed
    pruneOldDays(todayKey);

    try {
      // Restore global state (preferences + selected date)
      const globalRaw = localStorage.getItem(PLANNER_GLOBAL_KEY);
      let restoredDate = todayKey;
      if (globalRaw) {
        const global: SavedGlobalState = JSON.parse(globalRaw);
        // Only restore selected date if it's still within the 3-day window
        const validDates = getAvailableDateKeys([]);
        if (validDates.includes(global.selectedDate)) {
          restoredDate = global.selectedDate;
          setSelectedDate(restoredDate);
        }
      }

      // Restore per-day state (including preferences) for the selected date
      restoreDayState(restoredDate, setCustomEvents, setPinnedTimes, setMealVenueOverrides, setPreferences, setWizardAnswers, setWizardStep);
    } catch {
      // Corrupted data, ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save planner state to localStorage whenever key state changes
  useEffect(() => {
    if (!hasCalendar) return; // Don't save empty state

    // Save global state (selected date only -- preferences are per-day)
    try {
      const global: SavedGlobalState = { selectedDate };
      localStorage.setItem(PLANNER_GLOBAL_KEY, JSON.stringify(global));
    } catch {
      // localStorage full or unavailable
    }

    // Save per-day state (including preferences + wizard answers) for the currently selected date
    saveDayState(selectedDate, customEvents, pinnedTimes, mealVenueOverrides, preferences, wizardAnswers);
  }, [preferences, customEvents, pinnedTimes, mealVenueOverrides, selectedDate, hasCalendar, wizardAnswers]);

  /* ─────────────────────── campus data loading ────────────────────────────── */

  useEffect(() => {
    let isMounted = true;

    async function refreshStatuses() {
      setIsRefreshing(true);
      try {
        const nextStatuses = await loadAllBuildingStatuses(MAP_BUILDINGS);
        const hours = Array.from({ length: 17 }, (_, i) => 7 + i);
        const hourly = await loadHourlyBuildingStatuses(MAP_BUILDINGS, hours);
        if (isMounted) {
          setStatuses(nextStatuses);
          setHourlyStatuses(hourly);
        }
      } catch {
        // Backend unavailable — keep fallback statuses
      } finally {
        if (isMounted) setIsRefreshing(false);
      }
    }

    refreshStatuses();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  // Auto-deselect meals whose window has passed
  useEffect(() => {
    if (selectedDate !== todayKey) return;
    const hour = currentTime.getHours();
    const expiredMeals: PlannerMealType[] = [];
    if (hour >= MEAL_CONFIG.breakfast.windowEndHour) expiredMeals.push('breakfast');
    if (hour >= MEAL_CONFIG.lunch.windowEndHour) expiredMeals.push('lunch');
    if (hour >= 22) { expiredMeals.push('snack'); expiredMeals.push('dinner'); }

    if (expiredMeals.length > 0) {
      setPreferences((prev) => {
        const filtered = prev.meals.filter((m) => !expiredMeals.includes(m));
        return filtered.length === prev.meals.length ? prev : { ...prev, meals: filtered };
      });
    }
  }, [currentTime, selectedDate, todayKey]);

  /* ─────────────────────── user/calendar loading ──────────────────────────── */

  useEffect(() => {
    let isMounted = true;

    async function loadUserCalendar() {
      const user = await Profile();
      if (!isMounted) return;

      setCurrentUser(user);

      if (!user) {
        setUploadMessage(
          'Upload a UTM `.ics` calendar to build a personalized plan for today. If you sign in first, we will save it to your account.'
        );
        return;
      }

      const savedCalendar = await loadSavedPlannerCalendar();
      if (!isMounted) return;

      if (savedCalendar?.calendar_text) {
        const parsed = parseIcsCalendar(savedCalendar.calendar_text);

        if (parsed.events.length > 0) {
          setCalendarEvents(parsed.events);
          setCalendarSource('saved');
          setSelectedDate(todayKey);
          setUploadedFileName('Saved calendar');
          setRawCalendarText(savedCalendar.calendar_text);
          setUploadMessage('Loaded your saved calendar. Upload a new file any time to replace it.');
          return;
        }
      }

      setUploadMessage(
        'You are signed in. Upload your `.ics` calendar once and we will save it to your account for future visits.'
      );
    }

    loadUserCalendar();

    return () => {
      isMounted = false;
    };
  }, [todayKey]);

  useEffect(() => {
    if (locationDistanceKm === null || preferences.alreadyOnCampus) return;

    const nextArrival = estimateArrivalMinutes(locationDistanceKm, preferences.transportMode);
    setPreferences((prev) =>
      prev.arrivalMinutes === nextArrival ? prev : { ...prev, arrivalMinutes: nextArrival }
    );
  }, [locationDistanceKm, preferences.transportMode, preferences.alreadyOnCampus]);

  /* ─────────────────────── derived / memoized data ────────────────────────── */

  const availableDates = useMemo(
    () => getAvailableDateKeys(calendarEvents),
    [calendarEvents]
  );

  useEffect(() => {
    if (!availableDates.includes(selectedDate)) {
      saveDayState(selectedDate, customEvents, pinnedTimes, mealVenueOverrides, preferences, wizardAnswers);
      restoreDayState(todayKey, setCustomEvents, setPinnedTimes, setMealVenueOverrides, setPreferences, setWizardAnswers, setWizardStep);
      setSelectedDate(todayKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDates, selectedDate, todayKey]);

  const classesForSelectedDate = useMemo(
    () => getEventsForDate(calendarEvents, selectedDate),
    [calendarEvents, selectedDate]
  );

  const plannerResult = useMemo(
    () =>
      hasCalendar
        ? buildPlannerResult({
            classes: classesForSelectedDate,
            preferences,
            statuses,
            campusEvents: MOCK_EVENTS,
            dateKey: selectedDate,
            locationDistanceKm,
            customEvents,
            pinnedTimes,
            hourlyStatuses,
          })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classesForSelectedDate, preferences, statuses, selectedDate, locationDistanceKm, hasCalendar, currentTime, customEvents, pinnedTimes, hourlyStatuses]
  );

  const classTimelineItems = useMemo(
    () => plannerResult?.timeline.filter((item) => item.kind === 'class') ?? [],
    [plannerResult]
  );

  // Track previous notes to detect new scheduling failures
  const prevNotesRef = useRef<string[]>([]);

  useEffect(() => {
    if (!plannerResult) {
      setFlexibleSlots([]);
      prevNotesRef.current = [];
      return;
    }

    setFlexibleSlots(buildFlexibleSlots(plannerResult.timeline));

    // Detect NEW scheduling failures — show a choice dialog instead of auto-reverting
    const prevNotes = new Set(prevNotesRef.current);
    const failureNotes = plannerResult.notes.filter(
      (note) => !prevNotes.has(note) && /could not (fit|schedule)/i.test(note)
    );
    if (failureNotes.length > 0) {
      setOverflowItems(failureNotes);
      setShowOverflowDialog(true);
    }
    prevNotesRef.current = plannerResult.notes;
  }, [plannerResult]);

  /* ─────────────────────── event handlers ─────────────────────────────────── */

  async function handleCalendarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);

    try {
      const text = await file.text();
      const parsed = parseIcsCalendar(text);

      if (parsed.events.length === 0) {
        setUploadMessage(
          parsed.warnings[0] ??
            'That file did not contain any readable calendar events, so the current planner stayed unchanged.'
        );
        return;
      }

      setCalendarEvents(parsed.events);
      setSelectedDate(todayKey);
      setUploadedFileName(file.name);
      setRawCalendarText(text);

      if (currentUser && calendarSource === 'saved') {
        setPendingCalendarText(text);
        setShowSavePrompt(true);
        setCalendarSource('ics');
        setUploadMessage(
          `Loaded ${parsed.events.length} class block${parsed.events.length === 1 ? '' : 's'} from ${file.name}.`
        );
      } else if (currentUser) {
        const saved = await savePlannerCalendar(text);
        setCalendarSource(saved ? 'saved' : 'ics');
        setUploadMessage(
          saved
            ? `Loaded ${parsed.events.length} class block${parsed.events.length === 1 ? '' : 's'} from ${file.name} and saved it to your account.`
            : `Loaded ${parsed.events.length} class block${parsed.events.length === 1 ? '' : 's'} from ${file.name}, but could not save it to your account right now.`
        );
      } else {
        setCalendarSource('ics');
        setUploadMessage(
          `Loaded ${parsed.events.length} class block${parsed.events.length === 1 ? '' : 's'} from ${file.name}. Sign in before uploading if you want us to save it to your account.`
        );
      }
    } finally {
      setIsParsingFile(false);
      event.target.value = '';
    }
  }

  async function handleSaveAsDefault() {
    if (!pendingCalendarText) return;
    const saved = await savePlannerCalendar(pendingCalendarText);
    if (saved) setCalendarSource('saved');
    setShowSavePrompt(false);
    setPendingCalendarText(null);
    setUploadMessage(saved ? 'New calendar saved as your default.' : 'Could not save right now. Using it for this session only.');
  }

  function handleUseOneTime() {
    setShowSavePrompt(false);
    setPendingCalendarText(null);
  }

  function handleRemoveCalendar() {
    setCalendarEvents([]);
    setCalendarSource('empty');
    setUploadedFileName(null);
    setRawCalendarText(null);
    setUploadMessage('Upload a UTM `.ics` calendar to build a personalized plan for today.');
    setWizardStep('calendar-upload');
  }

  function handleAddCustomEvent() {
    if (!customEventTitle.trim()) return;
    const startAt = new Date(`${selectedDate}T${String(customEventHour).padStart(2, '0')}:${String(customEventMinute).padStart(2, '0')}:00`);
    const endAt = new Date(startAt.getTime() + customEventDuration * 60_000);

    const dayEnd = plannerDayTime(selectedDate, 23, 59);
    if (endAt > dayEnd) {
      const maxMinutes = Math.floor((dayEnd.getTime() - startAt.getTime()) / 60_000);
      setConflictPopup(`Event at ${formatPlannerTime(startAt)} can be at most ${maxMinutes} minutes — it would extend past end of day.`);
      return;
    }

    const conflict = findTimeConflict(startAt, endAt);
    if (conflict) {
      setConflictPopup(`Cannot add event: ${conflict}`);
      return;
    }

    const newEvent: PlannerTimelineItem = {
      id: `custom-${Date.now()}`,
      time: formatPlannerTime(startAt),
      title: customEventTitle.trim(),
      detail: customEventLocation ? `At ${customEventLocation} for ${customEventDuration} min.` : `${customEventDuration} min.`,
      kind: 'event',
      startAt,
      endAt,
      durationMinutes: customEventDuration,
    };
    setCustomEvents((prev) => [...prev, newEvent]);
    setCustomEventTitle('');
    setCustomEventDuration(60);
    setCustomEventLocation('');
    setShowAddEvent(false);
  }

  function handleUseLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationMessage('This browser does not support location services.');
      return;
    }

    setIsLocating(true);
    setLocationMessage('Estimating your distance from UTM...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const distance = estimateDistanceToCampusKm(
          position.coords.latitude,
          position.coords.longitude
        );
        setLocationDistanceKm(distance);
        setLocationMessage(
          `Approximate distance to UTM: ${distance.toFixed(1)} km. Arrival time was updated for ${preferences.transportMode}.`
        );
        setIsLocating(false);
      },
      () => {
        setLocationMessage(
          'Could not access your location, so the planner kept your manual arrival estimate.'
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  const nextCampusEvent = useMemo(
    () => MOCK_EVENTS.find((event) => event.date === selectedDate) ?? null,
    [selectedDate]
  );

  const allFoodVenues = useMemo(
    () => getAllFoodVenues(statuses, classesForSelectedDate[0]?.buildingId ?? null),
    [statuses, classesForSelectedDate]
  );

  const pinnedIds = useMemo(() => new Set(Object.keys(pinnedTimes)), [pinnedTimes]);

  const scheduledSlots = useMemo(
    () => flexibleSlots.map((slot) => ({ ...slot, items: scheduleSlotItems(slot, selectedDate, pinnedIds) })),
    [flexibleSlots, selectedDate, pinnedIds]
  );

  function isMealWindowPast(meal: PlannerMealType) {
    if (selectedDate !== todayKey) return false;
    const now = currentTime;
    const hour = now.getHours();
    if (meal === 'breakfast' || meal === 'lunch') {
      return hour >= MEAL_CONFIG[meal].windowEndHour;
    }
    return hour >= 22;
  }

  function findTimeConflict(start: Date, end: Date, excludeId?: string): string | null {
    if (!preferences.alreadyOnCampus && plannerResult) {
      const commuteItem = plannerResult.timeline.find((t) => t.id === 'commute');
      if (commuteItem?.endAt && start < commuteItem.endAt) {
        return `You won't be on campus until ${formatPlannerTime(commuteItem.endAt)}. Schedule this after your arrival.`;
      }
    }
    for (const cls of classesForSelectedDate) {
      if (start < cls.end && end > cls.start) {
        return `This conflicts with "${cls.title}" (${formatPlannerTime(cls.start)}–${formatPlannerTime(cls.end)}).`;
      }
    }
    for (const ce of customEvents) {
      if (ce.id === excludeId) continue;
      if (ce.startAt && ce.endAt && start < ce.endAt && end > ce.startAt) {
        return `This conflicts with "${ce.title}" (${ce.time}).`;
      }
    }
    for (const [id, pinDate] of Object.entries(pinnedTimes)) {
      if (id === excludeId) continue;
      const item = plannerResult?.timeline.find((t) => t.id === id);
      if (!item) continue;
      const pinEnd = new Date(pinDate.getTime() + item.durationMinutes * 60_000);
      if (start < pinEnd && end > pinDate) {
        return `This conflicts with pinned "${item.title}" (${formatPlannerTime(pinDate)}).`;
      }
    }
    return null;
  }


  function handleDurationChange(itemId: string, durationMinutes: number) {
    const clampedDuration = Math.max(10, durationMinutes);

    const allItems = scheduledSlots.flatMap((s) => s.items);
    const targetItem = allItems.find((i) => i.id === itemId);

    // Gym: can't extend past gym closing time
    if (itemId === 'gym-block' && targetItem?.startAt) {
      const gymCloseHour = getGymCloseHour(selectedDate);
      const gymClose = plannerDayTime(selectedDate, gymCloseHour, 0);
      const newEnd = new Date(targetItem.startAt.getTime() + clampedDuration * 60_000);
      if (newEnd > gymClose) {
        const maxMinutes = Math.floor((gymClose.getTime() - targetItem.startAt.getTime()) / 60_000);
        setConflictPopup(`The gym closes at ${gymCloseHour}:00. Maximum duration from your start time is ${maxMinutes} minutes.`);
        return;
      }
    }

    // Food: can't extend past restaurant closing time
    if (itemId.startsWith('food-') && targetItem?.startAt) {
      const foodCloseHour = getLatestFoodClose(selectedDate);
      const foodClose = plannerDayTime(selectedDate, foodCloseHour, 0);
      const newEnd = new Date(targetItem.startAt.getTime() + clampedDuration * 60_000);
      if (newEnd > foodClose) {
        const maxMinutes = Math.floor((foodClose.getTime() - targetItem.startAt.getTime()) / 60_000);
        setConflictPopup(`Restaurants close at ${foodCloseHour}:00. Maximum duration from your start time is ${maxMinutes} minutes.`);
        return;
      }
    }

    // Fixed-time item checks (custom events, pinned items)
    if (itemId.startsWith('custom-')) {
      const ce = customEvents.find((e) => e.id === itemId);
      if (ce?.startAt) {
        const newEnd = new Date(ce.startAt.getTime() + clampedDuration * 60_000);
        const dayEnd = plannerDayTime(selectedDate, 23, 59);
        if (newEnd > dayEnd) {
          const maxMinutes = Math.floor((dayEnd.getTime() - ce.startAt.getTime()) / 60_000);
          setConflictPopup(`"${ce.title}" can be at most ${maxMinutes} minutes — it would extend past end of day.`);
          return;
        }
        const conflict = findTimeConflict(ce.startAt, newEnd, itemId);
        if (conflict) {
          setConflictPopup(`Cannot extend "${ce.title}" to ${clampedDuration} min: ${conflict}`);
          return;
        }
        setCustomEvents((prev) =>
          prev.map((e) =>
            e.id === itemId
              ? { ...e, durationMinutes: clampedDuration, endAt: newEnd, detail: e.detail.replace(/\d+ min/, `${clampedDuration} min`) }
              : e
          )
        );
        setFlexibleSlots((prev) => updateSlotDuration(prev, itemId, clampedDuration));
        return;
      }
    }

    if (pinnedIds.has(itemId)) {
      const pinDate = pinnedTimes[itemId];
      if (pinDate) {
        const newEnd = new Date(pinDate.getTime() + clampedDuration * 60_000);
        const dayEnd = plannerDayTime(selectedDate, 23, 59);
        if (newEnd > dayEnd) {
          const maxMinutes = Math.floor((dayEnd.getTime() - pinDate.getTime()) / 60_000);
          setConflictPopup(`This pinned event can be at most ${maxMinutes} minutes — it would extend past end of day.`);
          return;
        }
        const conflict = findTimeConflict(pinDate, newEnd, itemId);
        if (conflict) {
          setConflictPopup(`Cannot extend to ${clampedDuration} min: ${conflict}`);
          return;
        }
      }
    }

    // Slot window check -- prevent extending past the next class
    const slot = flexibleSlots.find((s) => s.items.some((i) => i.id === itemId));
    if (!slot) {
      setFlexibleSlots((prev) => updateSlotDuration(prev, itemId, clampedDuration));
      return;
    }

    const dayStart = plannerDayTime(selectedDate, 8, 0);
    const dayEnd = plannerDayTime(selectedDate, 23, 59);
    const windowStart = slot.prevClass?.endAt ?? dayStart;
    const windowEnd = slot.nextClass?.startAt ?? dayEnd;

    const gapMinutes = 10;

    const bufferBeforeClass = slot.nextClass ? gapMinutes : 0;
    const usableMinutes = Math.round((windowEnd.getTime() - windowStart.getTime()) / 60_000) - bufferBeforeClass;

    const item = slot.items.find((i) => i.id === itemId);
    if (!item) return;

    const isFixed = (i: PlannerTimelineItem) =>
      i.id.startsWith('custom-') || pinnedIds.has(i.id) || i.id === 'commute';

    const otherItems = slot.items.filter((i) => i.id !== itemId);
    const otherDuration = otherItems.reduce((sum, i) => sum + i.durationMinutes, 0);
    const totalGaps = gapMinutes * Math.max(slot.items.length - 1, 0);
    const availableForThisItem = usableMinutes - otherDuration - totalGaps;

    if (clampedDuration <= availableForThisItem) {
      setFlexibleSlots((prev) => updateSlotDuration(prev, itemId, clampedDuration));
      return;
    }

    // Doesn't fit -- try strategies to make room
    const needed = clampedDuration - availableForThisItem;
    const MIN_STUDY = 25;

    const movableOthers = otherItems.filter((i) => !isFixed(i));
    const studyItems = movableOthers.filter((i) => i.kind === 'study');
    const nonStudyMovable = movableOthers.filter((i) => i.kind !== 'study');

    const otherSlotSpace: Array<{ slotId: string; available: number }> = [];
    for (const s of flexibleSlots) {
      if (s.id === slot.id) continue;
      const sWindowStart = s.prevClass?.endAt ?? dayStart;
      const sWindowEnd = s.nextClass?.startAt ?? dayEnd;
      const sBuffer = s.nextClass ? gapMinutes : 0;
      const sUsable = Math.round((sWindowEnd.getTime() - sWindowStart.getTime()) / 60_000) - sBuffer;
      const sItemsDuration = s.items.reduce((sum, i) => sum + i.durationMinutes, 0);
      const sGaps = gapMinutes * Math.max(s.items.length, 0);
      const sAvailable = sUsable - sItemsDuration - sGaps;
      if (sAvailable > 0) {
        otherSlotSpace.push({ slotId: s.id, available: sAvailable });
      }
    }

    const shrinkPlan: Array<{ id: string; newDuration: number }> = [];
    const movePlan: Array<{ item: PlannerTimelineItem; targetSlotId: string }> = [];
    const removePlan: string[] = [];
    let freed = 0;

    // Step 1: Shrink study blocks in this slot down to minimum (25 min)
    for (const si of studyItems) {
      if (freed >= needed) break;
      const canTake = Math.max(0, si.durationMinutes - MIN_STUDY);
      if (canTake > 0) {
        const take = Math.min(canTake, needed - freed);
        shrinkPlan.push({ id: si.id, newDuration: si.durationMinutes - take });
        freed += take;
      }
    }

    // Step 2: Move items from this slot to other slots that have room
    if (freed < needed) {
      const moveOrder = [...nonStudyMovable, ...studyItems.filter((si) =>
        !shrinkPlan.some((sp) => sp.id === si.id && sp.newDuration > 0)
      )];
      for (const mi of moveOrder) {
        if (freed >= needed) break;
        const target = otherSlotSpace.find((s) => s.available >= mi.durationMinutes);
        if (target) {
          movePlan.push({ item: mi, targetSlotId: target.slotId });
          const shrinkIdx = shrinkPlan.findIndex((sp) => sp.id === mi.id);
          if (shrinkIdx !== -1) {
            freed -= (mi.durationMinutes - shrinkPlan[shrinkIdx].newDuration);
            shrinkPlan.splice(shrinkIdx, 1);
          }
          freed += mi.durationMinutes + gapMinutes;
          target.available -= mi.durationMinutes + gapMinutes;
        }
      }
    }

    // Step 3: If study blocks at 25 min still block, try moving them to other slots
    if (freed < needed) {
      for (const si of studyItems) {
        if (freed >= needed) break;
        if (movePlan.some((m) => m.item.id === si.id)) continue;
        const target = otherSlotSpace.find((s) => s.available >= MIN_STUDY);
        if (target) {
          const shrinkIdx = shrinkPlan.findIndex((sp) => sp.id === si.id);
          if (shrinkIdx !== -1) {
            freed -= (si.durationMinutes - shrinkPlan[shrinkIdx].newDuration);
            shrinkPlan.splice(shrinkIdx, 1);
          }
          movePlan.push({ item: si, targetSlotId: target.slotId });
          freed += si.durationMinutes + gapMinutes;
          target.available -= MIN_STUDY + gapMinutes;
          shrinkPlan.push({ id: si.id, newDuration: MIN_STUDY });
        }
      }
    }

    // Step 4: As a last resort, remove study blocks from this slot entirely
    if (freed < needed) {
      for (const si of studyItems) {
        if (freed >= needed) break;
        if (movePlan.some((m) => m.item.id === si.id)) continue;
        const shrinkIdx = shrinkPlan.findIndex((sp) => sp.id === si.id);
        if (shrinkIdx !== -1) {
          freed -= (si.durationMinutes - shrinkPlan[shrinkIdx].newDuration);
          shrinkPlan.splice(shrinkIdx, 1);
        }
        removePlan.push(si.id);
        freed += si.durationMinutes + gapMinutes;
      }
    }

    // Step 5: Shrink study blocks in OTHER slots
    if (freed < needed) {
      for (const s of flexibleSlots) {
        if (s.id === slot.id) continue;
        for (const i of s.items) {
          if (freed >= needed) break;
          if (i.kind === 'study' && !isFixed(i)) {
            const canTake = Math.max(0, i.durationMinutes - MIN_STUDY);
            if (canTake > 0) {
              const take = Math.min(canTake, needed - freed);
              shrinkPlan.push({ id: i.id, newDuration: i.durationMinutes - take });
              freed += take;
            }
          }
        }
      }
    }

    if (freed >= needed) {
      const movedIds = new Set(movePlan.map((m) => m.item.id));
      const removedIds = new Set(removePlan);

      setFlexibleSlots((prev) => {
        let updated = prev.map((s) => {
          if (s.id === slot.id) {
            return { ...s, items: s.items.filter((i) => !movedIds.has(i.id) && !removedIds.has(i.id)) };
          }
          return s;
        });
        for (const { item: mi, targetSlotId } of movePlan) {
          updated = updated.map((s) =>
            s.id === targetSlotId ? { ...s, items: [...s.items, mi] } : s
          );
        }
        updated = updateSlotDuration(updated, itemId, clampedDuration);
        for (const { id, newDuration } of shrinkPlan) {
          updated = updateSlotDuration(updated, id, newDuration);
        }
        return updated;
      });
      return;
    }

    const maxAllowed = availableForThisItem + freed;
    setConflictPopup(
      `Not enough time in the day to extend "${item.title}" to ${clampedDuration} minutes. ` +
      `Maximum available is about ${Math.max(10, maxAllowed)} minutes.`
    );
  }

  /* ─────────────────────── timeline card renderer ─────────────────────────── */

  function renderTimelineCard(
    item: PlannerTimelineItem,
    options?: {
      showEditControls?: boolean;
      locked?: boolean;
    }
  ) {
    const style = kindStyles[item.kind];
    const Icon = style.icon;
    const blockHeight = Math.max(36, Math.round(20 + item.durationMinutes * 0.95));
    const isPast = item.id !== 'commute' && item.endAt !== null && item.endAt.getTime() <= currentTime.getTime();

    return (
      <div
        key={item.id}
        className={`rounded-2xl border p-4 ${style.border}`}
        style={{ minHeight: `${blockHeight}px` }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`rounded-2xl bg-white/85 p-3 dark:bg-zinc-900/80 ${isPast ? 'opacity-60' : ''}`}>
              <Icon className={`size-5 ${style.badge}`} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {editingTimeItemId === item.id ? (
                  <input
                    type="time"
                    autoFocus
                    defaultValue={item.startAt ? `${String(item.startAt.getHours()).padStart(2, '0')}:${String(item.startAt.getMinutes()).padStart(2, '0')}` : '12:00'}
                    onBlur={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      if (!isNaN(h) && !isNaN(m)) {
                        const pinned = new Date(`${selectedDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
                        const pinnedEnd = new Date(pinned.getTime() + item.durationMinutes * 60_000);
                        if (item.id === 'commute') {
                          const classConflict = classesForSelectedDate.find(
                            (cls) => pinnedEnd > cls.start && pinned < cls.end
                          );
                          if (classConflict) {
                            setConflictPopup(`Cannot set departure — you'd arrive during "${classConflict.title}" (${formatPlannerTime(classConflict.start)}–${formatPlannerTime(classConflict.end)}).`);
                          } else {
                            setPinnedTimes((prev) => ({ ...prev, [item.id]: pinned }));
                          }
                        } else if (item.kind === 'food') {
                          const MIN_FOOD_DURATION = 15;
                          const classAfter = classesForSelectedDate
                            .filter((cls) => cls.start > pinned)
                            .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
                          const hardEnd = classAfter ? classAfter.start : null;

                          const classDuring = classesForSelectedDate.find(
                            (cls) => pinned >= cls.start && pinned < cls.end
                          );
                          if (classDuring) {
                            setConflictPopup(`Cannot pin during "${classDuring.title}" (${formatPlannerTime(classDuring.start)}–${formatPlannerTime(classDuring.end)}).`);
                          } else if (hardEnd && pinnedEnd > hardEnd) {
                            const availableMinutes = Math.floor((hardEnd.getTime() - pinned.getTime()) / 60_000);
                            if (availableMinutes >= MIN_FOOD_DURATION) {
                              setPinnedTimes((prev) => ({ ...prev, [item.id]: pinned }));
                              setFlexibleSlots((prev) => updateSlotDuration(prev, item.id, availableMinutes));
                              setConflictPopup(`Trimmed ${item.title.split(' at ')[0].toLowerCase()} to ${availableMinutes} min to fit before "${classAfter.title}" at ${formatPlannerTime(classAfter.start)}.`);
                            } else {
                              setConflictPopup(`Not enough time before "${classAfter.title}" at ${formatPlannerTime(classAfter.start)} — need at least ${MIN_FOOD_DURATION} minutes.`);
                            }
                          } else {
                            const conflict = findTimeConflict(pinned, pinnedEnd, item.id);
                            if (conflict) {
                              setConflictPopup(`Cannot pin to this time: ${conflict}`);
                            } else {
                              setPinnedTimes((prev) => ({ ...prev, [item.id]: pinned }));
                            }
                          }
                        } else {
                          const conflict = findTimeConflict(pinned, pinnedEnd, item.id);
                          if (conflict) {
                            setConflictPopup(`Cannot pin to this time: ${conflict}`);
                          } else {
                            setPinnedTimes((prev) => ({ ...prev, [item.id]: pinned }));
                          }
                        }
                      }
                      setEditingTimeItemId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      if (e.key === 'Escape') setEditingTimeItemId(null);
                    }}
                    className="w-[100px] rounded-lg border border-blue-400 bg-white px-2 py-1 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-blue-600 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                ) : (
                  <p
                    className={`text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400 ${isPast ? 'line-through decoration-2 opacity-70' : ''} ${item.kind !== 'class' ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''}`}
                    title={item.kind !== 'class' ? 'Click to pin this time' : undefined}
                    onClick={(e) => {
                      if (item.kind === 'class') return;
                      e.stopPropagation();
                      setEditingTimeItemId(item.id);
                    }}
                  >
                    {item.time}
                  </p>
                )}
                {pinnedTimes[item.id] && editingTimeItemId !== item.id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPinnedTimes((prev) => {
                        const next = { ...prev };
                        delete next[item.id];
                        return next;
                      });
                    }}
                    className="rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                    title="Unpin this time"
                  >
                    Pinned ✕
                  </button>
                )}
                {options?.locked && (
                  <span className="rounded-full border border-slate-300 bg-white/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    Locked
                  </span>
                )}
              </div>
              <h3 className={`mt-1 text-lg font-semibold text-gray-900 dark:text-zinc-100 ${isPast ? 'line-through decoration-2 opacity-70' : ''}`}>
                {item.kind === 'food' && mealVenueOverrides[item.id]
                  ? item.title.replace(/at .+$/, `at ${mealVenueOverrides[item.id]}`)
                  : item.title}
              </h3>
              <p className={`mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-200 ${isPast ? 'line-through decoration-2 opacity-70' : ''}`}>
                {item.kind === 'food' && mealVenueOverrides[item.id]
                  ? (() => {
                      const venue = allFoodVenues.find((v) => v.venueName === mealVenueOverrides[item.id]);
                      return venue
                        ? `Est. ${venue.displayValue} wait and about ${venue.walkMinutes} min walk in ${venue.buildingName}.`
                        : item.detail;
                    })()
                  : item.kind === 'study'
                    ? item.detail.replace(/^\d+ min/, `${item.durationMinutes} min`)
                    : item.kind === 'travel' && item.startAt && item.endAt
                      ? item.detail.replace(/arrive by .+?\./, `arrive by ${formatPlannerTime(new Date(item.startAt.getTime() + item.durationMinutes * 60_000))}.`).replace(/arrive on campus around .+?\./, `arrive on campus around ${formatPlannerTime(new Date(item.startAt.getTime() + item.durationMinutes * 60_000))}.`)
                      : item.kind === 'gym'
                        ? item.detail
                        : item.kind === 'event' && item.id.startsWith('custom-')
                          ? (item.detail.includes(' for ') ? item.detail.replace(/for \d+ min/, `for ${item.durationMinutes} min`) : item.detail)
                          : item.detail}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-3">
            {options?.showEditControls && (
              <label className="w-full max-w-[140px] text-sm font-medium text-slate-700 dark:text-zinc-200">
                Duration (min)
                <input
                  type="number"
                  min={10}
                  step={5}
                  value={item.durationMinutes}
                  onChange={(event) => handleDurationChange(item.id, Number(event.target.value) || 10)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                />
              </label>
            )}

            {item.kind === 'food' && allFoodVenues.length > 0 && (
              <label className="w-full max-w-[220px] text-sm font-medium text-slate-700 dark:text-zinc-200">
                <span className="flex items-center gap-1">Venue <ChevronDown className="size-3" /></span>
                <select
                  value={mealVenueOverrides[item.id] ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setMealVenueOverrides((prev) => ({ ...prev, [item.id]: value }));
                    if (value) {
                      const venue = allFoodVenues.find((v) => v.venueName === value);
                      if (venue) {
                        const oldVenueName = mealVenueOverrides[item.id] ?? '';
                        const oldVenue = oldVenueName ? allFoodVenues.find((v) => v.venueName === oldVenueName) : null;
                        const oldWalk = oldVenue?.walkMinutes ?? 0;
                        const oldWait = oldVenue?.waitMinutes ?? 0;
                        const baseMealMinutes = Math.max(20, item.durationMinutes - oldWalk - oldWait);
                        const newDuration = baseMealMinutes + venue.walkMinutes + venue.waitMinutes;
                        handleDurationChange(item.id, newDuration);
                      }
                    }
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                >
                  <option value="">Auto (shortest wait)</option>
                  {allFoodVenues.map((venue, venueIndex) => (
                    <option key={`${venue.buildingId}-${venue.venueName}-${venueIndex}`} value={venue.venueName}>
                      {venue.venueName} — {venue.displayValue} wait ({venue.walkMinutes} min walk)
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  WIZARD LOGIC                                                             */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  /** Convert wizard answers into PlannerPreferences and apply them */
  const applyWizardAnswers = useCallback((answers: WizardAnswers) => {
    const newPrefs: PlannerPreferences = {
      alreadyOnCampus: answers.alreadyOnCampus,
      transportMode: answers.transportMode,
      arrivalMinutes: answers.arrivalMinutes,
      meals: [...answers.meals],
      wantsGym: answers.wantsGym,
      wantsEvents: true, // always show events in wizard flow
      studyHours: answers.studyHours,
      gymDurationMinutes: answers.gymDurationMinutes,
      gymIsSwimming: answers.gymIsSwimming,
    };
    setPreferences(newPrefs);

    // Apply venue overrides from wizard
    const venueOverrides: Record<string, string> = {};
    for (const [mealId, venueName] of Object.entries(answers.mealVenueChoices)) {
      if (venueName) venueOverrides[mealId] = venueName;
    }
    setMealVenueOverrides(venueOverrides);

    // Convert blocked times into custom events (always clear old ones, then re-add)
    const blockedCustomEvents: PlannerTimelineItem[] = answers.blockedTimes.map((bt, idx) => {
      const startAt = new Date(`${selectedDate}T${String(bt.startHour).padStart(2, '0')}:${String(bt.startMinute).padStart(2, '0')}:00`);
      const endAt = new Date(`${selectedDate}T${String(bt.endHour).padStart(2, '0')}:${String(bt.endMinute).padStart(2, '0')}:00`);
      const durationMinutes = Math.round((endAt.getTime() - startAt.getTime()) / 60_000);
      return {
        id: `custom-blocked-${idx}`,
        time: formatPlannerTime(startAt),
        title: bt.label || 'Blocked time',
        detail: `${durationMinutes} min.`,
        kind: 'event' as const,
        startAt,
        endAt,
        durationMinutes,
      };
    });
    setCustomEvents((prev) => [...prev.filter((e) => !e.id.startsWith('custom-blocked-')), ...blockedCustomEvents]);

    // Pin the user's departure time if they set one
    const newPinnedTimes: Record<string, Date> = {};
    if (!answers.alreadyOnCampus && answers.departureTime) {
      const [dh, dm] = answers.departureTime.split(':').map(Number);
      if (!isNaN(dh) && !isNaN(dm)) {
        newPinnedTimes['commute'] = new Date(`${selectedDate}T${String(dh).padStart(2, '0')}:${String(dm).padStart(2, '0')}:00`);
      }
    }

    // Apply pinned times for gym/meals/study with 'specific' time preferences
    if (answers.wantsGym && answers.gymTimePreference === 'specific' && answers.gymSpecificTime) {
      const [h, m] = answers.gymSpecificTime.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        newPinnedTimes['gym-block'] = new Date(`${selectedDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      }
    }

    for (const [mealId, pref] of Object.entries(answers.mealTimePreferences)) {
      if (pref === 'specific' && answers.mealSpecificTimes[mealId]) {
        const [h, m] = answers.mealSpecificTimes[mealId].split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          newPinnedTimes[mealId] = new Date(`${selectedDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
        }
      }
    }

    if (answers.studyHours > 0 && answers.studyTimePreference === 'specific' && answers.studySpecificTime) {
      const [h, m] = answers.studySpecificTime.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        newPinnedTimes['study-1'] = new Date(`${selectedDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      }
    }

    if (Object.keys(newPinnedTimes).length > 0) {
      setPinnedTimes((prev) => ({ ...prev, ...newPinnedTimes }));
    }
  }, [selectedDate, setCustomEvents, setPinnedTimes]);

  /** Compute which steps to show based on answers */
  const getVisibleSteps = useCallback((): WizardStep[] => {
    const steps: WizardStep[] = ['calendar-upload', 'starting-info'];

    if (!wizardAnswers.alreadyOnCampus) {
      steps.push('leave-time', 'commute-duration');
    }

    steps.push('blocked-times');

    const isToday = selectedDate === todayKey;
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    // Compute estimated arrival hour on campus
    // If already on campus: they're here now (use current time for today, or 0 for future)
    // If not: use departure time + travel duration
    let arrivalHour: number;
    let arrivalMinute = 0;
    if (wizardAnswers.alreadyOnCampus) {
      arrivalHour = isToday ? currentHour : 0;
      arrivalMinute = isToday ? currentMinute : 0;
    } else if (wizardAnswers.departureTime) {
      const [dh, dm] = wizardAnswers.departureTime.split(':').map(Number);
      if (!isNaN(dh) && !isNaN(dm)) {
        const totalMin = dh * 60 + dm + (wizardAnswers.travelDuration || wizardAnswers.arrivalMinutes || 30);
        arrivalHour = Math.floor(totalMin / 60);
        arrivalMinute = totalMin % 60;
      } else {
        arrivalHour = isToday ? currentHour : 8;
      }
    } else {
      // No departure time set yet — use arrivalMinutes as rough estimate from now (today) or 8am (future)
      if (isToday) {
        const totalMin = currentHour * 60 + currentMinute + (wizardAnswers.arrivalMinutes || 30);
        arrivalHour = Math.floor(totalMin / 60);
        arrivalMinute = totalMin % 60;
      } else {
        arrivalHour = 8;
      }
    }

    // For "right now" checks on today: effective hour is the later of arrival or current time
    const effectiveHour = isToday ? Math.max(arrivalHour, currentHour) : arrivalHour;
    const effectiveMinute = isToday
      ? (arrivalHour > currentHour ? arrivalMinute : arrivalHour === currentHour ? Math.max(arrivalMinute, currentMinute) : currentMinute)
      : arrivalMinute;
    const effectiveTime = effectiveHour + effectiveMinute / 60; // decimal hour for comparisons

    // Last class end hour — user leaves campus after this, so activities must fit before
    const lastClassEnd = classesForSelectedDate.length > 0
      ? classesForSelectedDate[classesForSelectedDate.length - 1].end
      : null;

    // Gym: skip if user won't be on campus during gym hours, or gym is closed that day
    const gymOpen = getGymOpenHour(selectedDate);
    const gymClose = getGymCloseHour(selectedDate);
    if (gymClose > gymOpen && effectiveTime < gymClose) {
      steps.push('gym');
    }

    // Breakfast: skip if arrival is after breakfast window, or window already passed
    if (effectiveTime < MEAL_CONFIG.breakfast.windowEndHour) {
      steps.push('breakfast');
    }

    // Lunch: skip if arrival is after lunch window, or window already passed
    if (effectiveTime < MEAL_CONFIG.lunch.windowEndHour) {
      steps.push('lunch');
    }

    // Study: always offer (they can study any time they're on campus)
    steps.push('study');

    // Dinner: skip if arrival is after dinner window, or window already passed
    if (effectiveTime < MEAL_CONFIG.dinner.windowEndHour) {
      steps.push('dinner');
    }

    steps.push('complete');
    return steps;
  }, [wizardAnswers.alreadyOnCampus, wizardAnswers.arrivalMinutes, wizardAnswers.departureTime, wizardAnswers.travelDuration, selectedDate, todayKey, currentTime, classesForSelectedDate]);

  const visibleSteps = useMemo(() => getVisibleSteps(), [getVisibleSteps]);

  let currentStepIndex = visibleSteps.indexOf(wizardStep);

  // If no calendar is loaded, always show the upload step regardless of saved state
  useEffect(() => {
    if (!hasCalendar && wizardStep !== 'calendar-upload') {
      setWizardStep('calendar-upload');
    }
  }, [hasCalendar, wizardStep]);

  // If the current step got removed (e.g., arrival changed and breakfast window passed),
  // snap forward to the next visible step
  useEffect(() => {
    if (wizardStep !== 'complete' && !visibleSteps.includes(wizardStep)) {
      const masterIdx = WIZARD_STEPS_ORDER.indexOf(wizardStep);
      const nextVisible = visibleSteps.find(
        (s) => WIZARD_STEPS_ORDER.indexOf(s) > masterIdx
      );
      setWizardStep(nextVisible ?? 'complete');
    }
  }, [visibleSteps, wizardStep]);

  if (currentStepIndex === -1) currentStepIndex = 0;

  // Progress: exclude 'complete' from the count
  const totalQuestionSteps = visibleSteps.filter((s) => s !== 'complete').length;
  const answeredSteps = Math.min(currentStepIndex, totalQuestionSteps);
  const progressPercent = totalQuestionSteps > 0 ? Math.round((answeredSteps / totalQuestionSteps) * 100) : 0;

  function goToNextStep() {
    const idx = visibleSteps.indexOf(wizardStep);
    if (idx < visibleSteps.length - 1) {
      const nextStep = visibleSteps[idx + 1];
      // If going to complete, apply wizard answers to preferences
      if (nextStep === 'complete') {
        applyWizardAnswers(wizardAnswers);
      }
      setWizardStep(nextStep);
    }
  }

  function goToPrevStep() {
    const idx = visibleSteps.indexOf(wizardStep);
    if (idx > 0) {
      setWizardStep(visibleSteps[idx - 1]);
    }
  }

  function handleWizardComplete() {
    applyWizardAnswers(wizardAnswers);
    setWizardStep('complete');
  }

  function handleEditPreferences() {
    setWizardStep('starting-info');
  }

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  WIZARD CARD COMPONENTS                                                   */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  const cardClasses = 'mx-auto w-full max-w-lg rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur transition-all duration-300 dark:border-zinc-700 dark:bg-zinc-900/95 dark:shadow-black/30';
  const btnPrimary = 'inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-40';
  const btnSecondary = 'inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800';

  function WizardNav({ nextLabel, nextDisabled, onNext, showBack, showSkip, onSkip }: {
    nextLabel?: string;
    nextDisabled?: boolean;
    onNext?: () => void;
    showBack?: boolean;
    showSkip?: boolean;
    onSkip?: () => void;
  }) {
    return (
      <div className="mt-6 flex items-center justify-between">
        {showBack !== false && currentStepIndex > 0 ? (
          <button type="button" onClick={goToPrevStep} className={btnSecondary}>
            <ArrowLeft className="size-4" /> Back
          </button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          {showSkip && (
            <button type="button" onClick={onSkip ?? goToNextStep} className={btnSecondary}>
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={onNext ?? goToNextStep}
            disabled={nextDisabled}
            className={btnPrimary}
          >
            {nextLabel ?? 'Next'} <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  function renderWizardCard() {
    switch (wizardStep) {

      /* ── Step 1: Calendar Upload ── */
      case 'calendar-upload':
        return (
          <div className={cardClasses}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                <Upload className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                  Upload your course calendar
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                  The planner accepts `.ics` exports from ACORN or similar portals.
                </p>
              </div>
            </div>

            {hasCalendar && uploadedFileName ? (
              <div className="mt-5">
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="rounded-xl bg-green-100 p-2 text-green-700 dark:bg-green-950/50 dark:text-green-300">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">{uploadedFileName}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">{calendarEvents.length} class block{calendarEvents.length === 1 ? '' : 's'} loaded</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCalendar}
                    className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    title="Remove calendar"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-blue-400 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:text-blue-300">
                  <input type="file" accept=".ics" className="hidden" onChange={handleCalendarUpload} />
                  {isParsingFile ? 'Reading...' : 'Upload a different file'}
                </label>

                {showSavePrompt && (
                  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/30">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Save this as your default calendar?</p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={handleSaveAsDefault} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700">
                        Save as default
                      </button>
                      <button type="button" onClick={handleUseOneTime} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800">
                        Just this time
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5">
                <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:border-blue-500 dark:hover:text-blue-300">
                  <input type="file" accept=".ics" className="hidden" onChange={handleCalendarUpload} />
                  <div className="text-center">
                    <Upload className="mx-auto size-8 mb-2 opacity-60" />
                    {isParsingFile ? 'Reading calendar file...' : 'Choose .ics file'}
                  </div>
                </label>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-zinc-300 text-center">
                  {uploadMessage}
                </p>
              </div>
            )}

            <WizardNav
              nextLabel="Next"
              nextDisabled={!hasCalendar}
              showBack={false}
            />
          </div>
        );

      /* ── Step 2: Starting Info ── */
      case 'starting-info': {
        const firstClass = classesForSelectedDate[0];
        const firstClassTimeStr = firstClass
          ? formatPlannerTime(firstClass.start)
          : null;
        return (
          <div className={cardClasses}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200">
                <MapPinned className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                  Where are you starting from?
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                  This helps us schedule travel time to campus.
                </p>
              </div>
            </div>

            {/* First class info */}
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/30">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {firstClassTimeStr
                  ? `Your first class today is at ${firstClassTimeStr}.`
                  : 'No classes scheduled for this date.'}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 cursor-pointer transition hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800">
                <input
                  type="checkbox"
                  checked={wizardAnswers.alreadyOnCampus}
                  onChange={(e) => setWizardAnswers((prev) => ({ ...prev, alreadyOnCampus: e.target.checked }))}
                  className="size-5 rounded accent-blue-600"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">I&apos;m already on campus</span>
              </label>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                  Planning date
                </label>
                <select
                  value={selectedDate}
                  onChange={(event) => {
                    const newDate = event.target.value;
                    if (newDate !== selectedDate) {
                      saveDayState(selectedDate, customEvents, pinnedTimes, mealVenueOverrides, preferences, wizardAnswers);
                      restoreDayState(newDate, setCustomEvents, setPinnedTimes, setMealVenueOverrides, setPreferences, setWizardAnswers, setWizardStep);
                    }
                    setSelectedDate(newDate);
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                >
                  {availableDates.map((dateKey) => (
                    <option key={dateKey} value={dateKey}>
                      {formatHumanDate(dateKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <WizardNav />
          </div>
        );
      }

      /* ── Step 3: Leave Time ── */
      case 'leave-time':
        return (
          <div className={cardClasses}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                <Route className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                  What time are you going to leave today?
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                  We will factor in travel time before your first class.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                  Travel mode
                </label>
                <select
                  value={wizardAnswers.transportMode}
                  onChange={(e) => setWizardAnswers((prev) => ({ ...prev, transportMode: e.target.value as PlannerTransportMode }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                >
                  <option value="drive">Drive</option>
                  <option value="transit">Transit</option>
                  <option value="walk">Walk</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                  Departure time
                </label>
                <input
                  type="time"
                  value={wizardAnswers.departureTime}
                  onChange={(e) => {
                    const depTime = e.target.value;
                    setWizardAnswers((prev) => {
                      // Compute arrival minutes from departure + travel duration
                      const arrivalMinutes = prev.travelDuration;
                      return { ...prev, departureTime: depTime, arrivalMinutes };
                    });
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                      Optional location assist
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                      {locationMessage}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleUseLocation();
                    }}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-blue-500 dark:hover:text-blue-300"
                  >
                    {isLocating ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
                    Use my location
                  </button>
                </div>
              </div>
            </div>

            <WizardNav />
          </div>
        );

      /* ── Step 4: Commute Duration ── */
      case 'commute-duration': {
        // Show computed commute and ask to confirm/adjust
        const computedMinutes = locationDistanceKm !== null
          ? estimateArrivalMinutes(locationDistanceKm, wizardAnswers.transportMode)
          : wizardAnswers.travelDuration;

        // Compute arrival time from departure + travel duration
        const computedArrivalStr = (() => {
          if (!wizardAnswers.departureTime) return null;
          const [dh, dm] = wizardAnswers.departureTime.split(':').map(Number);
          if (isNaN(dh) || isNaN(dm)) return null;
          const depDate = new Date(`${selectedDate}T${String(dh).padStart(2, '0')}:${String(dm).padStart(2, '0')}:00`);
          const arrDate = new Date(depDate.getTime() + wizardAnswers.travelDuration * 60_000);
          return formatPlannerTime(arrDate);
        })();

        return (
          <div className={cardClasses}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                <Clock3 className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                  How long will it take you to get to campus?
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                  {locationDistanceKm !== null
                    ? `Based on your location (~${locationDistanceKm.toFixed(1)} km away), we estimate ${computedMinutes} minutes by ${wizardAnswers.transportMode}.`
                    : `Adjust the travel duration for ${wizardAnswers.transportMode}.`}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                  Travel duration (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={wizardAnswers.travelDuration}
                  onChange={(e) => {
                    const dur = Number(e.target.value) || 0;
                    setWizardAnswers((prev) => ({ ...prev, travelDuration: dur, arrivalMinutes: dur }));
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                />
              </div>

              {computedArrivalStr && (
                <div className="rounded-xl border border-green-200 bg-green-50/80 px-4 py-3 dark:border-green-900/50 dark:bg-green-950/30">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Estimated arrival on campus: {computedArrivalStr}
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                      Optional location assist
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                      {locationMessage}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleUseLocation();
                    }}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-blue-500 dark:hover:text-blue-300"
                  >
                    {isLocating ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
                    Use my location
                  </button>
                </div>
              </div>
            </div>

            <WizardNav nextLabel="Looks good" />
          </div>
        );
      }

      /* ── Step 5: Blocked Times ── */
      case 'blocked-times': {
        const handleAddBlockedTime = () => {
          setBtError(null);
          if (!btLabel.trim()) { setBtError('Please enter a label.'); return; }
          const [sh, sm] = btStartTime.split(':').map(Number);
          const [eh, em] = btEndTime.split(':').map(Number);
          if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) { setBtError('Invalid time format.'); return; }
          const startMin = sh * 60 + sm;
          const endMin = eh * 60 + em;
          if (endMin <= startMin) { setBtError('End time must be after start time.'); return; }

          // Validate against classes
          const btStart = new Date(`${selectedDate}T${btStartTime}:00`);
          const btEnd = new Date(`${selectedDate}T${btEndTime}:00`);
          for (const cls of classesForSelectedDate) {
            if (btStart < cls.end && btEnd > cls.start) {
              setBtError(`Conflicts with "${cls.title}" (${formatPlannerTime(cls.start)}-${formatPlannerTime(cls.end)}).`);
              return;
            }
          }

          // Validate against arrival
          if (!wizardAnswers.alreadyOnCampus && wizardAnswers.departureTime) {
            const [dh, dm] = wizardAnswers.departureTime.split(':').map(Number);
            if (!isNaN(dh) && !isNaN(dm)) {
              const arrivalDate = new Date(new Date(`${selectedDate}T${wizardAnswers.departureTime}:00`).getTime() + wizardAnswers.travelDuration * 60_000);
              if (btStart < arrivalDate) {
                setBtError(`This is before your estimated arrival at ${formatPlannerTime(arrivalDate)}.`);
                return;
              }
            }
          }

          setWizardAnswers((prev) => ({
            ...prev,
            blockedTimes: [...prev.blockedTimes, { label: btLabel.trim(), startHour: sh, startMinute: sm, endHour: eh, endMinute: em }],
          }));
          setBtLabel('');
          setBtStartTime('09:00');
          setBtEndTime('10:00');
        };

        return (
          <div className={cardClasses}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
                <Shield className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                  Any times to block off?
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                  Do you have any times you need blocked off for things other than studying, going to the gym, or getting and eating food?
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWantsBlocked(true)}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    wantsBlocked
                      ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWantsBlocked(false);
                    setWizardAnswers((prev) => ({ ...prev, blockedTimes: [] }));
                    goToNextStep();
                  }}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    !wantsBlocked
                      ? 'border-slate-400 bg-slate-50 text-slate-700 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  No
                </button>
              </div>

              {wantsBlocked && (
                <>
                  {/* Existing blocked times list */}
                  {wizardAnswers.blockedTimes.length > 0 && (
                    <div className="space-y-2">
                      {wizardAnswers.blockedTimes.map((bt, idx) => (
                        <div key={`bt-${idx}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{bt.label}</p>
                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                              {String(bt.startHour).padStart(2, '0')}:{String(bt.startMinute).padStart(2, '0')} - {String(bt.endHour).padStart(2, '0')}:{String(bt.endMinute).padStart(2, '0')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setWizardAnswers((prev) => ({
                              ...prev,
                              blockedTimes: prev.blockedTimes.filter((_, i) => i !== idx),
                            }))}
                            className="rounded-full p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new blocked time form */}
                  <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 dark:border-zinc-700 dark:bg-zinc-950/40">
                    <input
                      type="text"
                      placeholder="Label (e.g. Doctor appointment)"
                      value={btLabel}
                      onChange={(e) => setBtLabel(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-slate-500 dark:text-zinc-400">Start</label>
                        <input
                          type="time"
                          value={btStartTime}
                          onChange={(e) => setBtStartTime(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-500 dark:text-zinc-400">End</label>
                        <input
                          type="time"
                          value={btEndTime}
                          onChange={(e) => setBtEndTime(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>
                    {btError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{btError}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleAddBlockedTime}
                      className="w-full rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
                    >
                      <Plus className="mr-1 inline size-4" /> Add blocked time
                    </button>
                  </div>
                </>
              )}
            </div>

            <WizardNav />
          </div>
        );
      }

      /* ── Step 6: Gym ── */
      case 'gym':
        return (
          <div className={cardClasses}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
                <Dumbbell className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                  Are you planning on going to the gym today?
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                  We will schedule a gym session at the RAWC around your classes.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWizardAnswers((prev) => ({ ...prev, wantsGym: true }))}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    wizardAnswers.wantsGym
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  Yes, schedule gym
                </button>
                <button
                  type="button"
                  onClick={() => { setWizardAnswers((prev) => ({ ...prev, wantsGym: false })); goToNextStep(); }}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    !wizardAnswers.wantsGym
                      ? 'border-slate-400 bg-slate-50 text-slate-700 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  No gym today
                </button>
              </div>

              {/* Sub-questions when gym is selected */}
              {wizardAnswers.wantsGym && (
                <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  {/* Swimming toggle */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-zinc-300">Swimming or no?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, gymIsSwimming: true }))}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                          wizardAnswers.gymIsSwimming
                            ? 'border-emerald-400 bg-white text-emerald-700 dark:border-emerald-600 dark:bg-zinc-900 dark:text-emerald-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        <Waves className="mr-1.5 inline size-4" /> Swimming
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, gymIsSwimming: false }))}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                          !wizardAnswers.gymIsSwimming
                            ? 'border-emerald-400 bg-white text-emerald-700 dark:border-emerald-600 dark:bg-zinc-900 dark:text-emerald-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        <Dumbbell className="mr-1.5 inline size-4" /> No swimming
                      </button>
                    </div>
                  </div>

                  {/* Time preference */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-zinc-300">
                      Do you have a specific time you need to go, or use our optimized recommendations?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, gymTimePreference: 'specific' }))}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                          wizardAnswers.gymTimePreference === 'specific'
                            ? 'border-emerald-400 bg-white text-emerald-700 dark:border-emerald-600 dark:bg-zinc-900 dark:text-emerald-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        Specific time
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, gymTimePreference: 'optimized' }))}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                          wizardAnswers.gymTimePreference === 'optimized'
                            ? 'border-emerald-400 bg-white text-emerald-700 dark:border-emerald-600 dark:bg-zinc-900 dark:text-emerald-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        Optimize for me
                      </button>
                    </div>
                    {wizardAnswers.gymTimePreference === 'specific' && (
                      <input
                        type="time"
                        value={wizardAnswers.gymSpecificTime}
                        onChange={(e) => setWizardAnswers((prev) => ({ ...prev, gymSpecificTime: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                      />
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-zinc-300">
                      <Timer className="mr-1 inline size-4" /> How long will you be at the gym?
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[30, 45, 60, 90].map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setWizardAnswers((prev) => ({ ...prev, gymDurationMinutes: dur }))}
                          className={`rounded-xl border-2 px-2 py-2.5 text-sm font-medium transition ${
                            wizardAnswers.gymDurationMinutes === dur
                              ? 'border-emerald-400 bg-white text-emerald-700 dark:border-emerald-600 dark:bg-zinc-900 dark:text-emerald-200'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {dur} min
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <WizardNav />
          </div>
        );

      /* ── Step 7: Breakfast ── */
      case 'breakfast': {
        const hasBreakfast = wizardAnswers.meals.includes('breakfast');
        const bestBreakfastVenue = allFoodVenues.length > 0
          ? allFoodVenues.reduce((best, v) => (v.waitMinutes < best.waitMinutes ? v : best), allFoodVenues[0])
          : null;
        return (
          <div className={cardClasses}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-orange-100 p-3 text-orange-700 dark:bg-orange-950/50 dark:text-orange-200">
                <Utensils className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                  Do you want to get breakfast on campus?
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                  Available from {MEAL_CONFIG.breakfast.windowStartHour}:00 to {MEAL_CONFIG.breakfast.windowEndHour}:00.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!hasBreakfast) {
                      setWizardAnswers((prev) => ({ ...prev, meals: [...prev.meals.filter((m) => m !== 'breakfast'), 'breakfast'] }));
                    }
                  }}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    hasBreakfast
                      ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-950/40 dark:text-orange-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  Yes, breakfast
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWizardAnswers((prev) => ({ ...prev, meals: prev.meals.filter((m) => m !== 'breakfast'), mealVenueChoices: { ...prev.mealVenueChoices, 'food-breakfast': '' } }));
                    goToNextStep();
                  }}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    !hasBreakfast
                      ? 'border-slate-400 bg-slate-50 text-slate-700 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  Skip breakfast
                </button>
              </div>

              {hasBreakfast && (
                <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/50 dark:bg-orange-950/20">
                  {/* Venue selection */}
                  {allFoodVenues.length > 0 && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                        Where?
                      </label>
                      {bestBreakfastVenue && (
                        <p className="mb-2 text-xs text-slate-500 dark:text-zinc-400">
                          We recommend {bestBreakfastVenue.venueName} for their short wait time.
                        </p>
                      )}
                      <select
                        value={wizardAnswers.mealVenueChoices['food-breakfast'] ?? ''}
                        onChange={(e) => setWizardAnswers((prev) => ({ ...prev, mealVenueChoices: { ...prev.mealVenueChoices, 'food-breakfast': e.target.value } }))}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                      >
                        <option value="">Auto (shortest wait)</option>
                        {allFoodVenues.map((venue, i) => (
                          <option key={`${venue.buildingId}-${venue.venueName}-${i}`} value={venue.venueName}>
                            {venue.venueName} — {venue.displayValue} wait
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Time preference */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-zinc-300">
                      Do you have a specific time you want to go, or use our optimized recommendation?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, mealTimePreferences: { ...prev.mealTimePreferences, 'food-breakfast': 'specific' } }))}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                          wizardAnswers.mealTimePreferences['food-breakfast'] === 'specific'
                            ? 'border-orange-400 bg-white text-orange-700 dark:border-orange-600 dark:bg-zinc-900 dark:text-orange-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        Specific time
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, mealTimePreferences: { ...prev.mealTimePreferences, 'food-breakfast': 'optimized' } }))}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                          (wizardAnswers.mealTimePreferences['food-breakfast'] ?? 'optimized') === 'optimized'
                            ? 'border-orange-400 bg-white text-orange-700 dark:border-orange-600 dark:bg-zinc-900 dark:text-orange-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        Optimize for me
                      </button>
                    </div>
                    {wizardAnswers.mealTimePreferences['food-breakfast'] === 'specific' && (
                      <input
                        type="time"
                        value={wizardAnswers.mealSpecificTimes['food-breakfast'] ?? ''}
                        onChange={(e) => setWizardAnswers((prev) => ({ ...prev, mealSpecificTimes: { ...prev.mealSpecificTimes, 'food-breakfast': e.target.value } }))}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <WizardNav />
          </div>
        );
      }

      /* ── Step 8: Lunch ── */
      case 'lunch': {
        const hasLunch = wizardAnswers.meals.includes('lunch');
        const bestLunchVenue = allFoodVenues.length > 0
          ? allFoodVenues.reduce((best, v) => (v.waitMinutes < best.waitMinutes ? v : best), allFoodVenues[0])
          : null;
        return (
          <div className={cardClasses}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-orange-100 p-3 text-orange-700 dark:bg-orange-950/50 dark:text-orange-200">
                <Utensils className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                  Do you want to get lunch on campus?
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                  Available from {MEAL_CONFIG.lunch.windowStartHour}:00 to {MEAL_CONFIG.lunch.windowEndHour}:00.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!hasLunch) {
                      setWizardAnswers((prev) => ({ ...prev, meals: [...prev.meals.filter((m) => m !== 'lunch'), 'lunch'] }));
                    }
                  }}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    hasLunch
                      ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-950/40 dark:text-orange-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  Yes, lunch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWizardAnswers((prev) => ({ ...prev, meals: prev.meals.filter((m) => m !== 'lunch'), mealVenueChoices: { ...prev.mealVenueChoices, 'food-lunch': '' } }));
                    goToNextStep();
                  }}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    !hasLunch
                      ? 'border-slate-400 bg-slate-50 text-slate-700 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  Skip lunch
                </button>
              </div>

              {hasLunch && (
                <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/50 dark:bg-orange-950/20">
                  {/* Venue selection */}
                  {allFoodVenues.length > 0 && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                        Where?
                      </label>
                      {bestLunchVenue && (
                        <p className="mb-2 text-xs text-slate-500 dark:text-zinc-400">
                          We recommend {bestLunchVenue.venueName} for their short wait time.
                        </p>
                      )}
                      <select
                        value={wizardAnswers.mealVenueChoices['food-lunch'] ?? ''}
                        onChange={(e) => setWizardAnswers((prev) => ({ ...prev, mealVenueChoices: { ...prev.mealVenueChoices, 'food-lunch': e.target.value } }))}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                      >
                        <option value="">Auto (shortest wait)</option>
                        {allFoodVenues.map((venue, i) => (
                          <option key={`${venue.buildingId}-${venue.venueName}-${i}`} value={venue.venueName}>
                            {venue.venueName} — {venue.displayValue} wait
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Time preference */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-zinc-300">
                      Do you have a specific time you want to go, or use our optimized recommendation?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, mealTimePreferences: { ...prev.mealTimePreferences, 'food-lunch': 'specific' } }))}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                          wizardAnswers.mealTimePreferences['food-lunch'] === 'specific'
                            ? 'border-orange-400 bg-white text-orange-700 dark:border-orange-600 dark:bg-zinc-900 dark:text-orange-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        Specific time
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, mealTimePreferences: { ...prev.mealTimePreferences, 'food-lunch': 'optimized' } }))}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                          (wizardAnswers.mealTimePreferences['food-lunch'] ?? 'optimized') === 'optimized'
                            ? 'border-orange-400 bg-white text-orange-700 dark:border-orange-600 dark:bg-zinc-900 dark:text-orange-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        Optimize for me
                      </button>
                    </div>
                    {wizardAnswers.mealTimePreferences['food-lunch'] === 'specific' && (
                      <input
                        type="time"
                        value={wizardAnswers.mealSpecificTimes['food-lunch'] ?? ''}
                        onChange={(e) => setWizardAnswers((prev) => ({ ...prev, mealSpecificTimes: { ...prev.mealSpecificTimes, 'food-lunch': e.target.value } }))}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <WizardNav />
          </div>
        );
      }

      /* ── Step 9: Study ── */
      case 'study': {
        const wantsStudy = wizardAnswers.studyHours > 0;
        return (
          <div className={cardClasses}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200">
                <BookOpen className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                  Do you want to study on campus?
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                  The planner will fit study blocks in your free gaps between classes.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (wizardAnswers.studyHours === 0) {
                      setWizardAnswers((prev) => ({ ...prev, studyHours: 2 }));
                    }
                  }}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    wantsStudy
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  Yes, study
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWizardAnswers((prev) => ({ ...prev, studyHours: 0 }));
                    goToNextStep();
                  }}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    !wantsStudy
                      ? 'border-slate-400 bg-slate-50 text-slate-700 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  No study today
                </button>
              </div>

              {wantsStudy && (
                <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                  {/* Duration slider */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-zinc-300">How long?</p>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={1}
                        max={8}
                        step={1}
                        value={wizardAnswers.studyHours}
                        onChange={(e) => setWizardAnswers((prev) => ({ ...prev, studyHours: Number(e.target.value) }))}
                        className="flex-1 accent-indigo-600"
                      />
                      <span className="w-16 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-lg font-bold text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                        {wizardAnswers.studyHours}h
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                      {wizardAnswers.studyHours} hour{wizardAnswers.studyHours > 1 ? 's' : ''} of study time will be scheduled.
                    </p>
                  </div>

                  {/* Time preference */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-zinc-300">
                      Do you have a specific time you want to study, or use our optimized recommendation?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, studyTimePreference: 'specific' }))}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                          wizardAnswers.studyTimePreference === 'specific'
                            ? 'border-indigo-400 bg-white text-indigo-700 dark:border-indigo-600 dark:bg-zinc-900 dark:text-indigo-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        Specific time
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, studyTimePreference: 'optimized' }))}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                          wizardAnswers.studyTimePreference === 'optimized'
                            ? 'border-indigo-400 bg-white text-indigo-700 dark:border-indigo-600 dark:bg-zinc-900 dark:text-indigo-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        Optimize for me
                      </button>
                    </div>
                    {wizardAnswers.studyTimePreference === 'specific' && (
                      <input
                        type="time"
                        value={wizardAnswers.studySpecificTime}
                        onChange={(e) => setWizardAnswers((prev) => ({ ...prev, studySpecificTime: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <WizardNav />
          </div>
        );
      }

      /* ── Step 10: Dinner ── */
      case 'dinner': {
        const hasDinner = wizardAnswers.meals.includes('dinner');
        const bestDinnerVenue = allFoodVenues.length > 0
          ? allFoodVenues.reduce((best, v) => (v.waitMinutes < best.waitMinutes ? v : best), allFoodVenues[0])
          : null;
        return (
          <div className={cardClasses}>
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-orange-100 p-3 text-orange-700 dark:bg-orange-950/50 dark:text-orange-200">
                <Utensils className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                  Do you want to get dinner on campus?
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                  Available from {MEAL_CONFIG.dinner.windowStartHour}:00 to {MEAL_CONFIG.dinner.windowEndHour}:00.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!hasDinner) {
                      setWizardAnswers((prev) => ({ ...prev, meals: [...prev.meals.filter((m) => m !== 'dinner'), 'dinner'] }));
                    }
                  }}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    hasDinner
                      ? 'border-orange-400 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-950/40 dark:text-orange-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  Yes, dinner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWizardAnswers((prev) => ({ ...prev, meals: prev.meals.filter((m) => m !== 'dinner'), mealVenueChoices: { ...prev.mealVenueChoices, 'food-dinner': '' } }));
                    handleWizardComplete();
                  }}
                  className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                    !hasDinner
                      ? 'border-slate-400 bg-slate-50 text-slate-700 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-200'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  Skip dinner
                </button>
              </div>

              {hasDinner && (
                <div className="space-y-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/50 dark:bg-orange-950/20">
                  {/* Venue selection */}
                  {allFoodVenues.length > 0 && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                        Where?
                      </label>
                      {bestDinnerVenue && (
                        <p className="mb-2 text-xs text-slate-500 dark:text-zinc-400">
                          We recommend {bestDinnerVenue.venueName} for their short wait time.
                        </p>
                      )}
                      <select
                        value={wizardAnswers.mealVenueChoices['food-dinner'] ?? ''}
                        onChange={(e) => setWizardAnswers((prev) => ({ ...prev, mealVenueChoices: { ...prev.mealVenueChoices, 'food-dinner': e.target.value } }))}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                      >
                        <option value="">Auto (shortest wait)</option>
                        {allFoodVenues.map((venue, i) => (
                          <option key={`${venue.buildingId}-${venue.venueName}-${i}`} value={venue.venueName}>
                            {venue.venueName} — {venue.displayValue} wait
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Time preference */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700 dark:text-zinc-300">
                      Do you have a specific time you want to go, or use our optimized recommendation?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, mealTimePreferences: { ...prev.mealTimePreferences, 'food-dinner': 'specific' } }))}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                          wizardAnswers.mealTimePreferences['food-dinner'] === 'specific'
                            ? 'border-orange-400 bg-white text-orange-700 dark:border-orange-600 dark:bg-zinc-900 dark:text-orange-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        Specific time
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardAnswers((prev) => ({ ...prev, mealTimePreferences: { ...prev.mealTimePreferences, 'food-dinner': 'optimized' } }))}
                        className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                          (wizardAnswers.mealTimePreferences['food-dinner'] ?? 'optimized') === 'optimized'
                            ? 'border-orange-400 bg-white text-orange-700 dark:border-orange-600 dark:bg-zinc-900 dark:text-orange-200'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        Optimize for me
                      </button>
                    </div>
                    {wizardAnswers.mealTimePreferences['food-dinner'] === 'specific' && (
                      <input
                        type="time"
                        value={wizardAnswers.mealSpecificTimes['food-dinner'] ?? ''}
                        onChange={(e) => setWizardAnswers((prev) => ({ ...prev, mealSpecificTimes: { ...prev.mealSpecificTimes, 'food-dinner': e.target.value } }))}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button type="button" onClick={goToPrevStep} className={btnSecondary}>
                <ArrowLeft className="size-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleWizardComplete}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Check className="size-4" /> Plan My Day
              </button>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  }

  // Keep wizard arrivalMinutes in sync with location-based estimates
  useEffect(() => {
    if (locationDistanceKm === null || wizardAnswers.alreadyOnCampus) return;
    const estimated = estimateArrivalMinutes(locationDistanceKm, wizardAnswers.transportMode);
    setWizardAnswers((prev) =>
      prev.arrivalMinutes === estimated ? prev : { ...prev, arrivalMinutes: estimated }
    );
  }, [locationDistanceKm, wizardAnswers.transportMode, wizardAnswers.alreadyOnCampus]);

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                   */
  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-slate-950">
      <Header />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">
              Planner assistant
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
              Build a campus day around your classes
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-zinc-300">
              Upload a calendar export, answer a few quick questions, and get a day plan that uses
              your class schedule together with the campus food, gym, parking, event, and map data
              you already have in this app.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
            {isRefreshing ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {isRefreshing ? 'Refreshing campus conditions' : 'Rule-based planner with live campus data'}
          </div>
        </div>

        {/* ═══════════════ WIZARD PHASE ═══════════════ */}
        {wizardStep !== 'complete' && (
          <section className="flex flex-col items-center gap-6">
            {/* Progress bar */}
            <div className="w-full max-w-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Step {Math.min(currentStepIndex + 1, totalQuestionSteps)} of {totalQuestionSteps}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-zinc-700">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Wizard card */}
            {renderWizardCard()}
          </section>
        )}

        {/* ═══════════════ COMPLETE / SCHEDULE PHASE ═══════════════ */}
        {wizardStep === 'complete' && (
          <section className="space-y-5">
            {/* Daily plan header */}
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/85 dark:shadow-black/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-400">
                    Daily plan
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-zinc-100">
                    {formatHumanDate(selectedDate)}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <button
                    type="button"
                    onClick={handleEditPreferences}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-blue-500 dark:hover:text-blue-300"
                  >
                    <Pencil className="size-3.5" />
                    Edit preferences
                  </button>
                  {calendarSource !== 'empty' && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200">
                      {calendarSource === 'saved' ? 'Saved calendar' : 'Uploaded calendar'}
                    </span>
                  )}
                  {hasCalendar && nextCampusEvent && (
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200">
                      Event later: {nextCampusEvent.title}
                    </span>
                  )}
                </div>
              </div>

              {/* Date selector row */}
              <div className="mt-4 flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                  Date:
                </label>
                <select
                  value={selectedDate}
                  onChange={(event) => {
                    const newDate = event.target.value;
                    if (newDate !== selectedDate) {
                      saveDayState(selectedDate, customEvents, pinnedTimes, mealVenueOverrides, preferences, wizardAnswers);
                      restoreDayState(newDate, setCustomEvents, setPinnedTimes, setMealVenueOverrides, setPreferences, setWizardAnswers, setWizardStep);
                    }
                    setSelectedDate(newDate);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                >
                  {availableDates.map((dateKey) => (
                    <option key={dateKey} value={dateKey}>
                      {formatHumanDate(dateKey)}
                    </option>
                  ))}
                </select>
              </div>

              {plannerResult ? (
                <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white/80 p-3 text-blue-700 dark:bg-zinc-900 dark:text-blue-200">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
                        Planner summary
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-zinc-200">
                        {plannerResult.summary}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm leading-7 text-slate-600 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-300">
                  Upload your `.ics` calendar to generate a personalized plan for today. If you are signed in, we will save it so you do not need to upload it again.
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/85 dark:shadow-black/30">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-zinc-950 dark:text-zinc-200">
                  <Clock3 className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
                    Timeline for your day
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-zinc-300">
                    Click any time to pin it. Adjust durations and change venues as needed.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {plannerResult ? (
                  classTimelineItems.length === 0 ? (
                    scheduledSlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 dark:border-zinc-700 dark:bg-zinc-950/40"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                          {slot.label}
                        </p>
                        {slot.items.map((item) =>
                          renderTimelineCard(item, {
                            showEditControls: item.kind !== 'class',
                            locked: item.kind === 'class',
                          })
                        )}
                      </div>
                    ))
                  ) : (
                    <>
                      {scheduledSlots[0] && (
                        <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 dark:border-zinc-700 dark:bg-zinc-950/40">
                          {scheduledSlots[0].items.length > 0 && (
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                              {scheduledSlots[0].label}
                            </p>
                          )}
                          {scheduledSlots[0].items.map((item) =>
                            renderTimelineCard(item, {
                              showEditControls: item.kind !== 'class' && item.id !== 'commute',
                            })
                          )}
                        </div>
                      )}

                      {classTimelineItems.map((classItem, index) => {
                        const slot = scheduledSlots[index + 1];

                        return (
                          <div key={classItem.id} className="space-y-3">
                            {renderTimelineCard(classItem, { locked: true })}
                            {slot && (
                              <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 dark:border-zinc-700 dark:bg-zinc-950/40">
                                {slot.items.length > 0 && (
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                                    {slot.label}
                                  </p>
                                )}
                                {slot.items.map((item) =>
                                  renderTimelineCard(item, {
                                    showEditControls: item.kind !== 'class' && item.id !== 'commute',
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-600 dark:border-zinc-700 dark:text-zinc-300">
                    Your timeline will appear here after you upload a calendar.
                  </div>
                )}
              </div>

              {plannerResult && plannerResult.notes.length > 0 && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/70">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">
                    Planner notes
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-zinc-200">
                    {plannerResult.notes.map((note) => (
                      <li key={note}>&#8226; {note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Custom events section */}
            <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/85 dark:shadow-black/30">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Custom events</h2>
                <button
                  type="button"
                  onClick={() => setShowAddEvent((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-blue-500 dark:hover:text-blue-300"
                >
                  <Plus className="size-3.5" />
                  Add event
                </button>
              </div>

              {showAddEvent && (
                <div className="mt-3 space-y-3">
                  <input
                    type="text"
                    placeholder="Event name"
                    value={customEventTitle}
                    onChange={(e) => setCustomEventTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500 dark:text-zinc-400">Hour</label>
                      <select
                        value={customEventHour}
                        onChange={(e) => setCustomEventHour(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      >
                        {Array.from({ length: 16 }, (_, i) => i + 7).map((h) => (
                          <option key={h} value={h}>{h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500 dark:text-zinc-400">Min</label>
                      <select
                        value={customEventMinute}
                        onChange={(e) => setCustomEventMinute(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      >
                        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-500 dark:text-zinc-400">Duration</label>
                      <select
                        value={customEventDuration}
                        onChange={(e) => setCustomEventDuration(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      >
                        {[15, 30, 45, 60, 90, 120].map((d) => (
                          <option key={d} value={d}>{d} min</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Location (optional)"
                    value={customEventLocation}
                    onChange={(e) => setCustomEventLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomEvent}
                    disabled={!customEventTitle.trim()}
                    className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600"
                  >
                    Add to timeline
                  </button>
                </div>
              )}

              {customEvents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {customEvents.map((evt) => (
                    <div key={evt.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{evt.title}</p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">{evt.time} &middot; {evt.durationMinutes} min</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomEvents((prev) => prev.filter((e) => e.id !== evt.id))}
                        className="rounded-full p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Conflict popup */}
      {conflictPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 max-w-sm rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900/60 dark:bg-zinc-900">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-100 p-2 text-red-600 dark:bg-red-950/50 dark:text-red-300">
                <X className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                  Time conflict
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-300">
                  {conflictPopup}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setConflictPopup(null)}
              className="mt-4 w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Overflow choice dialog — schedule is too full, let user pick what to drop */}
      {showOverflowDialog && overflowItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl dark:border-amber-900/60 dark:bg-zinc-900">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
                <Clock3 className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                  Not enough time in the day
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-300">
                  Some items could not fit in your schedule. Choose which ones to remove:
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {overflowItems.map((note, idx) => {
                // Parse which item this failure is about
                const lower = note.toLowerCase();
                const isBreakfast = lower.includes('breakfast');
                const isLunch = lower.includes('lunch');
                const isDinner = lower.includes('dinner');
                const isSnack = lower.includes('snack');
                const isGym = lower.includes('gym');
                const isStudy = lower.includes('study');
                const itemLabel = isBreakfast ? 'Breakfast' : isLunch ? 'Lunch' : isDinner ? 'Dinner' : isSnack ? 'Snack' : isGym ? 'Gym' : isStudy ? 'Study' : 'Item';

                return (
                  <div key={`overflow-${idx}`} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{itemLabel}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">{note}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Remove this specific item from preferences
                        if (isBreakfast) setPreferences((prev) => ({ ...prev, meals: prev.meals.filter((m) => m !== 'breakfast') }));
                        else if (isLunch) setPreferences((prev) => ({ ...prev, meals: prev.meals.filter((m) => m !== 'lunch') }));
                        else if (isDinner) setPreferences((prev) => ({ ...prev, meals: prev.meals.filter((m) => m !== 'dinner') }));
                        else if (isSnack) {
                          setPreferences((prev) => {
                            const next = [...prev.meals];
                            const snapIdx = next.lastIndexOf('snack');
                            if (snapIdx !== -1) next.splice(snapIdx, 1);
                            return { ...prev, meals: next };
                          });
                        }
                        else if (isGym) setPreferences((prev) => ({ ...prev, wantsGym: false }));
                        else if (isStudy) setPreferences((prev) => ({ ...prev, studyHours: Math.max(0, prev.studyHours - 1) }));

                        // Remove this note from the overflow list
                        setOverflowItems((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      className="ml-3 shrink-0 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-200 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-900/50"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  // Remove ALL failed items at once
                  for (const note of overflowItems) {
                    const lower = note.toLowerCase();
                    if (lower.includes('breakfast')) setPreferences((prev) => ({ ...prev, meals: prev.meals.filter((m) => m !== 'breakfast') }));
                    if (lower.includes('lunch')) setPreferences((prev) => ({ ...prev, meals: prev.meals.filter((m) => m !== 'lunch') }));
                    if (lower.includes('dinner')) setPreferences((prev) => ({ ...prev, meals: prev.meals.filter((m) => m !== 'dinner') }));
                    if (lower.includes('snack')) {
                      setPreferences((prev) => {
                        const next = [...prev.meals];
                        const snapIdx = next.lastIndexOf('snack');
                        if (snapIdx !== -1) next.splice(snapIdx, 1);
                        return { ...prev, meals: next };
                      });
                    }
                    if (lower.includes('gym')) setPreferences((prev) => ({ ...prev, wantsGym: false }));
                  }
                  setOverflowItems([]);
                  setShowOverflowDialog(false);
                }}
                className="flex-1 rounded-xl bg-red-100 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-200 dark:bg-red-950/50 dark:text-red-300 dark:hover:bg-red-900/50"
              >
                Remove all
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOverflowDialog(false);
                  setOverflowItems([]);
                }}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                Keep all (I&apos;ll adjust manually)
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowOverflowDialog(false);
                setOverflowItems([]);
                handleEditPreferences();
              }}
              className="mt-3 w-full rounded-xl border border-blue-300 px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30"
            >
              <Pencil className="mr-1.5 inline size-3.5" />
              Go back and edit preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
