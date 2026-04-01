'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock3,
  Dumbbell,
  FileText,
  LocateFixed,
  LoaderCircle,
  MapPinned,
  Minus,
  Plus,
  Route,
  Sparkles,
  Upload,
  Utensils,
  X,
} from 'lucide-react';
import Header from '../../components/Header';
import { MOCK_EVENTS } from '../events/mockEvents';
import { MAP_BUILDINGS } from '../map/mapData';
import {
  buildFallbackStatus,
  loadAllBuildingStatuses,
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
  getEventsForDate,
  MEAL_CONFIG,
  parseIcsCalendar,
  type PlannerCalendarEvent,
  type PlannerMealType,
  type PlannerPreferences,
  type PlannerTimelineItem,
} from './plannerUtils';

const PLANNER_STORAGE_KEY = 'utm-planner-state';

type SavedPlannerState = {
  preferences: PlannerPreferences;
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
  selectedDate: string;
  savedAt: string;
};

const initialPreferences: PlannerPreferences = {
  alreadyOnCampus: false,
  transportMode: 'drive',
  arrivalMinutes: 30,
  meals: ['lunch'],
  wantsGym: false,
  wantsEvents: true,
  studyHours: 0,
};

const mealOptions: Array<{ key: PlannerMealType; label: string }> = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'snack', label: 'Snack' },
  { key: 'dinner', label: 'Dinner' },
];

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

function scheduleSlotItems(slot: PlannerFlexibleSlot, dateKey: string, pinnedIds: Set<string>) {
  if (slot.items.length === 0) return [];

  // Items with a pinned/explicit time keep their own times — never rescheduled
  const isFixed = (item: PlannerTimelineItem) =>
    item.id.startsWith('custom-') || pinnedIds.has(item.id) || item.id === 'commute';

  const gapMinutes = 10;
  const schedulableItems = slot.items.filter((item) => !isFixed(item));
  const totalMinutes =
    schedulableItems.reduce((sum, item) => sum + item.durationMinutes, 0) +
    gapMinutes * Math.max(schedulableItems.length - 1, 0);

  const dayStart = plannerDayTime(dateKey, 8, 0);
  let cursor = dayStart;

  if (slot.prevClass && slot.nextClass) {
    cursor = new Date(slot.prevClass.endAt ?? slot.prevClass.startAt ?? dayStart);
    cursor = new Date(cursor.getTime() + gapMinutes * 60_000);
  } else if (!slot.prevClass && slot.nextClass) {
    const latestEnd = new Date(slot.nextClass.startAt ?? plannerDayTime(dateKey, 9, 0));
    latestEnd.setMinutes(latestEnd.getMinutes() - gapMinutes);
    const candidateStart = new Date(latestEnd.getTime() - totalMinutes * 60_000);
    cursor = candidateStart > dayStart ? candidateStart : dayStart;
  } else if (slot.prevClass && !slot.nextClass) {
    const base = new Date(slot.prevClass.endAt ?? slot.prevClass.startAt ?? dayStart);
    cursor = new Date(base.getTime() + 15 * 60_000);
  } else {
    cursor = schedulableItems[0]?.startAt ?? slot.items[0]?.startAt ?? plannerDayTime(dateKey, 9, 0);
  }

  // Build a list of fixed-item time ranges to skip around
  const fixedRanges = slot.items
    .filter((item) => isFixed(item) && item.startAt && item.endAt)
    .map((item) => ({ start: item.startAt!.getTime(), end: item.endAt!.getTime() }))
    .sort((a, b) => a.start - b.start);

  // Advance cursor past any fixed range it overlaps with
  function advancePastFixed(c: Date): Date {
    let t = c.getTime();
    for (const range of fixedRanges) {
      if (t >= range.start - gapMinutes * 60_000 && t < range.end + gapMinutes * 60_000) {
        t = range.end + gapMinutes * 60_000;
      }
    }
    return new Date(t);
  }

  return slot.items.map((item) => {
    // Fixed items keep their explicit start/end times
    if (isFixed(item)) {
      return item;
    }

    // Skip cursor past any fixed items
    cursor = advancePastFixed(cursor);

    const startAt = new Date(cursor);
    const endAt = new Date(startAt.getTime() + item.durationMinutes * 60_000);
    cursor = new Date(endAt.getTime() + gapMinutes * 60_000);

    return {
      ...item,
      startAt,
      endAt,
      time: formatPlannerTime(startAt),
    };
  });
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
  return slots.map((slot) => ({
    ...slot,
    items: slot.items.map((item) =>
      item.id === itemId
        ? { ...item, durationMinutes: Math.max(10, durationMinutes) }
        : item
    ),
  }));
}

function moveItemBetweenSlots(
  slots: PlannerFlexibleSlot[],
  fromSlotId: string,
  itemId: string,
  toSlotId: string,
  targetIndex: number
) {
  const sourceSlot = slots.find((slot) => slot.id === fromSlotId);
  const draggedItem = sourceSlot?.items.find((item) => item.id === itemId);
  if (!draggedItem) return slots;

  const removed = slots.map((slot) =>
    slot.id === fromSlotId
      ? { ...slot, items: slot.items.filter((item) => item.id !== itemId) }
      : slot
  );

  return removed.map((slot) => {
    if (slot.id !== toSlotId) return slot;

    const nextItems = [...slot.items];
    const safeIndex = Math.max(0, Math.min(targetIndex, nextItems.length));
    nextItems.splice(safeIndex, 0, draggedItem);
    return { ...slot, items: nextItems };
  });
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
  const [draggedItem, setDraggedItem] = useState<{ itemId: string; fromSlotId: string } | null>(null);
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

  const hasCalendar = calendarSource !== 'empty' && calendarEvents.length > 0;

  // Restore planner state from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
      if (!raw) return;

      const saved: SavedPlannerState = JSON.parse(raw);

      // Only restore if saved today (stale plans from other days aren't useful)
      const savedDate = new Date(saved.savedAt);
      const now = new Date();
      if (savedDate.toDateString() !== now.toDateString()) {
        localStorage.removeItem(PLANNER_STORAGE_KEY);
        return;
      }

      setPreferences(saved.preferences);
      setSelectedDate(saved.selectedDate);
      setMealVenueOverrides(saved.mealVenueOverrides);

      if (saved.customEvents.length > 0) {
        setCustomEvents(
          saved.customEvents.map((e) => ({
            ...e,
            startAt: e.startAt ? new Date(e.startAt) : null,
            endAt: e.endAt ? new Date(e.endAt) : null,
          }))
        );
      }

      if (Object.keys(saved.pinnedTimes).length > 0) {
        setPinnedTimes(
          Object.fromEntries(
            Object.entries(saved.pinnedTimes).map(([k, v]) => [k, new Date(v)])
          )
        );
      }
    } catch {
      // Corrupted data, ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save planner state to localStorage whenever key state changes
  useEffect(() => {
    if (!hasCalendar) return; // Don't save empty state

    const state: SavedPlannerState = {
      preferences,
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
      selectedDate,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage full or unavailable
    }
  }, [preferences, customEvents, pinnedTimes, mealVenueOverrides, selectedDate, hasCalendar]);

  useEffect(() => {
    let isMounted = true;

    async function refreshStatuses() {
      setIsRefreshing(true);
      const nextStatuses = await loadAllBuildingStatuses(MAP_BUILDINGS);
      if (isMounted) {
        setStatuses(nextStatuses);
        setIsRefreshing(false);
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
    // snack/dinner stay available until restaurants close (22:00)
    if (hour >= 22) { expiredMeals.push('snack'); expiredMeals.push('dinner'); }

    if (expiredMeals.length > 0) {
      setPreferences((prev) => {
        const filtered = prev.meals.filter((m) => !expiredMeals.includes(m));
        return filtered.length === prev.meals.length ? prev : { ...prev, meals: filtered };
      });
    }
  }, [currentTime, selectedDate, todayKey]);

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

  const availableDates = useMemo(
    () => Array.from(new Set([todayKey, ...getAvailableDateKeys(calendarEvents)])).sort(),
    [calendarEvents, todayKey]
  );

  useEffect(() => {
    if (!availableDates.includes(selectedDate)) {
      setSelectedDate(todayKey);
    }
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
          })
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [classesForSelectedDate, preferences, statuses, selectedDate, locationDistanceKm, hasCalendar, currentTime, customEvents, pinnedTimes]
  );

  const classTimelineItems = useMemo(
    () => plannerResult?.timeline.filter((item) => item.kind === 'class') ?? [],
    [plannerResult]
  );

  useEffect(() => {
    if (!plannerResult) {
      setFlexibleSlots([]);
      return;
    }

    setFlexibleSlots(buildFlexibleSlots(plannerResult.timeline));
  }, [plannerResult]);

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
        // User already has a saved calendar — ask if they want to replace it
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
  }

  function handleAddCustomEvent() {
    if (!customEventTitle.trim()) return;
    const startAt = new Date(`${selectedDate}T${String(customEventHour).padStart(2, '0')}:${String(customEventMinute).padStart(2, '0')}:00`);
    const endAt = new Date(startAt.getTime() + customEventDuration * 60_000);

    // Check for conflicts with classes, pinned events, and other custom events
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
    if (selectedDate !== todayKey) return false; // future dates are never "past"
    const config = MEAL_CONFIG[meal];
    const now = currentTime;
    const hour = now.getHours();
    // Breakfast/lunch: strict window cutoff
    if (meal === 'breakfast' || meal === 'lunch') {
      return hour >= config.windowEndHour;
    }
    // Snack/dinner: allow until 21:30 (latest restaurant close)
    return hour >= 22;
  }

  function getMealDisabledReason(meal: PlannerMealType): string | null {
    if (!isMealWindowPast(meal)) return null;
    const config = MEAL_CONFIG[meal];
    if (meal === 'breakfast') return 'Breakfast window has passed';
    if (meal === 'lunch') return 'Lunch window has passed';
    return 'Restaurants are closed — try a vending machine!';
  }

  function toggleMeal(meal: PlannerMealType) {
    if (isMealWindowPast(meal)) return;
    setPreferences((prev) => ({
      ...prev,
      meals: prev.meals.includes(meal)
        ? prev.meals.filter((entry) => entry !== meal)
        : [...prev.meals, meal],
    }));
  }

  /** Check if a time range conflicts with any class, pinned/custom event, or is before campus arrival */
  function findTimeConflict(start: Date, end: Date, excludeId?: string): string | null {
    // Check if event is before campus arrival
    if (!preferences.alreadyOnCampus && plannerResult) {
      const commuteItem = plannerResult.timeline.find((t) => t.id === 'commute');
      if (commuteItem?.endAt && start < commuteItem.endAt) {
        return `You won't be on campus until ${formatPlannerTime(commuteItem.endAt)}. Schedule this after your arrival.`;
      }
    }
    // Check against classes
    for (const cls of classesForSelectedDate) {
      if (start < cls.end && end > cls.start) {
        return `This conflicts with "${cls.title}" (${formatPlannerTime(cls.start)}–${formatPlannerTime(cls.end)}).`;
      }
    }
    // Check against custom events
    for (const ce of customEvents) {
      if (ce.id === excludeId) continue;
      if (ce.startAt && ce.endAt && start < ce.endAt && end > ce.startAt) {
        return `This conflicts with "${ce.title}" (${ce.time}).`;
      }
    }
    // Check against pinned times
    for (const [id, pinDate] of Object.entries(pinnedTimes)) {
      if (id === excludeId) continue;
      // Find the item to know its duration
      const item = plannerResult?.timeline.find((t) => t.id === id);
      if (!item) continue;
      const pinEnd = new Date(pinDate.getTime() + item.durationMinutes * 60_000);
      if (start < pinEnd && end > pinDate) {
        return `This conflicts with pinned "${item.title}" (${formatPlannerTime(pinDate)}).`;
      }
    }
    return null;
  }

  function handleDropToSlot(toSlotId: string, targetIndex: number) {
    if (!draggedItem) return;

    // Prevent dropping into "before-first" slot (before campus arrival)
    if (toSlotId === 'before-first' && !preferences.alreadyOnCampus) {
      setConflictPopup('You need to arrive on campus before scheduling activities. Pin your commute departure time instead.');
      setDraggedItem(null);
      return;
    }

    setFlexibleSlots((prev) =>
      moveItemBetweenSlots(prev, draggedItem.fromSlotId, draggedItem.itemId, toSlotId, targetIndex)
    );
    setDraggedItem(null);
  }

  function handleDurationChange(itemId: string, durationMinutes: number) {
    setFlexibleSlots((prev) => updateSlotDuration(prev, itemId, durationMinutes));
  }

  function renderTimelineCard(
    item: PlannerTimelineItem,
    options?: {
      draggable?: boolean;
      slotId?: string;
      onDropIndex?: number;
      showEditControls?: boolean;
      locked?: boolean;
    }
  ) {
    const style = kindStyles[item.kind];
    const Icon = style.icon;
    // Scale block height proportionally: 15 min = 36px, 30 min = 52px, 60 min = 80px, 90 min = 108px
    const blockHeight = Math.max(36, Math.round(20 + item.durationMinutes * 0.95));
    // "Head to Campus" (commute) is never crossed out — it stays active until the user checks "on campus"
    const isPast = item.id !== 'commute' && item.endAt !== null && item.endAt.getTime() <= currentTime.getTime();

    return (
      <div
        key={item.id}
        draggable={options?.draggable}
        onDragStart={() => {
          if (!options?.draggable || !options.slotId) return;
          setDraggedItem({ itemId: item.id, fromSlotId: options.slotId });
        }}
        onDragEnd={() => setDraggedItem(null)}
        onDragOver={(event) => {
          if (!options?.slotId || !draggedItem) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        onDrop={(event) => {
          if (!options?.slotId) return;
          event.preventDefault();
          event.stopPropagation();
          handleDropToSlot(options.slotId, options.onDropIndex ?? 0);
        }}
        className={`rounded-2xl border p-4 ${style.border} ${options?.draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
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
                        const conflict = findTimeConflict(pinned, pinnedEnd, item.id);
                        if (conflict) {
                          setConflictPopup(`Cannot pin to this time: ${conflict}`);
                        } else {
                          setPinnedTimes((prev) => ({ ...prev, [item.id]: pinned }));
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
                {options?.draggable && (
                  <span className="rounded-full border border-slate-300 bg-white/80 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    Drag to reorder
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
                        ? `${venue.displayValue} wait and about ${venue.walkMinutes} minutes away in ${venue.buildingName}.`
                        : item.detail;
                    })()
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
                    // Update duration based on venue walk time + base eating time
                    if (value) {
                      const venue = allFoodVenues.find((v) => v.venueName === value);
                      if (venue) {
                        const baseMealMinutes = item.durationMinutes > 0 ? Math.max(20, item.durationMinutes - (allFoodVenues.find((v) => v.venueName === (mealVenueOverrides[item.id] ?? ''))?.walkMinutes ?? 0)) : 30;
                        const newDuration = baseMealMinutes + venue.walkMinutes;
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-slate-950">
      <Header />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-20 pt-10 sm:px-6 lg:px-8">
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

        <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-5 rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/85 dark:shadow-black/30">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/70">
              {hasCalendar && uploadedFileName ? (
                <>
                  <div className="flex items-center justify-between gap-2">
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
                      title="Remove calendar and upload a different file"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <label className="mt-3 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-500 transition hover:border-blue-400 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-blue-500 dark:hover:text-blue-300">
                    <input
                      type="file"
                      accept=".ics"
                      className="hidden"
                      onChange={handleCalendarUpload}
                    />
                    {isParsingFile ? 'Reading...' : 'Upload a different file'}
                  </label>

                  {showSavePrompt && (
                    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/30">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Save this as your default calendar?</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={handleSaveAsDefault}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                        >
                          Save as default
                        </button>
                        <button
                          type="button"
                          onClick={handleUseOneTime}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          Just this time
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                      <Upload className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                        Upload your course calendar
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                        The planner accepts `.ics` exports. If you are signed in, your upload will be saved to your account.
                      </p>
                    </div>
                  </div>

                  <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-blue-500 dark:hover:text-blue-300">
                    <input
                      type="file"
                      accept=".ics"
                      className="hidden"
                      onChange={handleCalendarUpload}
                    />
                    {isParsingFile ? 'Reading calendar file...' : 'Choose .ics file'}
                  </label>

                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                    {uploadMessage}
                  </p>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/70">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Today&apos;s setup</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                    Planning date
                  </label>
                  <select
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                  >
                    {availableDates.map((dateKey) => (
                      <option key={dateKey} value={dateKey}>
                        {formatHumanDate(dateKey)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                    <input
                      type="checkbox"
                      checked={preferences.alreadyOnCampus}
                      onChange={(event) =>
                        setPreferences((prev) => ({ ...prev, alreadyOnCampus: event.target.checked }))
                      }
                      className="size-4 rounded accent-blue-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-zinc-200">I&apos;m already on campus</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                    <input
                      type="checkbox"
                      checked={preferences.wantsGym}
                      onChange={(event) =>
                        setPreferences((prev) => ({ ...prev, wantsGym: event.target.checked }))
                      }
                      className="size-4 rounded accent-emerald-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-zinc-200">I want to go to the gym</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                    <input
                      type="checkbox"
                      checked={preferences.wantsEvents}
                      onChange={(event) =>
                        setPreferences((prev) => ({ ...prev, wantsEvents: event.target.checked }))
                      }
                      className="size-4 rounded accent-violet-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-zinc-200">Show me events after class</span>
                  </label>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                    Study on campus for
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={1}
                      value={preferences.studyHours}
                      onChange={(event) =>
                        setPreferences((prev) => ({ ...prev, studyHours: Number(event.target.value) }))
                      }
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="w-14 rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-semibold text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                      {preferences.studyHours === 0 ? 'Off' : `${preferences.studyHours}h`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    {preferences.studyHours === 0
                      ? 'No study blocks will be added.'
                      : `The planner will fit ${preferences.studyHours} hour${preferences.studyHours > 1 ? 's' : ''} of study time in your free gaps.`}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                    Food plans for today
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
                    {mealOptions.map((meal) => {
                      const snackCount = preferences.meals.filter((m) => m === 'snack').length;
                      const selected = preferences.meals.includes(meal.key);
                      const disabled = isMealWindowPast(meal.key);
                      const disabledReason = getMealDisabledReason(meal.key);

                      if (meal.key === 'snack') {
                        return (
                          <div
                            key={meal.key}
                            className={`flex items-center justify-between rounded-xl border px-3 py-3 text-sm font-medium transition ${
                              disabled
                                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500'
                                : snackCount > 0
                                  ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200'
                                  : 'border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
                            }`}
                          >
                            <span>{meal.label}{snackCount > 1 ? ` ×${snackCount}` : ''}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={disabled || snackCount === 0}
                                onClick={() => {
                                  setPreferences((prev) => {
                                    const idx = prev.meals.lastIndexOf('snack');
                                    if (idx === -1) return prev;
                                    const next = [...prev.meals];
                                    next.splice(idx, 1);
                                    return { ...prev, meals: next };
                                  });
                                }}
                                className="rounded-md p-0.5 hover:bg-orange-100 disabled:opacity-30 dark:hover:bg-orange-900/30"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={disabled || snackCount >= 4}
                                onClick={() => {
                                  setPreferences((prev) => ({
                                    ...prev,
                                    meals: [...prev.meals, 'snack'],
                                  }));
                                }}
                                className="rounded-md p-0.5 hover:bg-orange-100 disabled:opacity-30 dark:hover:bg-orange-900/30"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                            {disabled && (
                              <span className="mt-0.5 block text-[10px] font-normal">{disabledReason}</span>
                            )}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={meal.key}
                          type="button"
                          onClick={() => toggleMeal(meal.key)}
                          disabled={disabled}
                          title={disabledReason ?? undefined}
                          className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                            disabled
                              ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500'
                              : selected
                                ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-200'
                                : 'border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
                          }`}
                        >
                          {meal.label}
                          {disabled && (
                            <span className="mt-0.5 block text-[10px] font-normal">{disabledReason}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-zinc-400">
                    Pick as many as you want. The planner will try to fit each stop around your classes.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                      Travel mode
                    </label>
                    <select
                      value={preferences.transportMode}
                      onChange={(event) =>
                        setPreferences((prev) => ({
                          ...prev,
                          transportMode: event.target.value as PlannerPreferences['transportMode'],
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                    >
                      <option value="drive">Drive</option>
                      <option value="transit">Transit</option>
                      <option value="walk">Walk</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
                      Minutes until you arrive
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={preferences.arrivalMinutes}
                      onChange={(event) =>
                        setPreferences((prev) => ({
                          ...prev,
                          arrivalMinutes: Number(event.target.value) || 0,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950"
                    />
                  </div>
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
                      onClick={handleUseLocation}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-blue-500 dark:hover:text-blue-300"
                    >
                      {isLocating ? <LoaderCircle className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
                      Use my location
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Add custom event section */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/70">
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
          </aside>

          <section className="space-y-5">
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
                    Locked classes stay in place. Drag the other blocks to reorder them and adjust their duration.
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
                        onDragOver={(event) => {
                          if (!draggedItem) return;
                          event.preventDefault();
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          handleDropToSlot(slot.id, slot.items.length);
                        }}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                          {slot.label}
                        </p>
                        {slot.items.map((item, index) =>
                          renderTimelineCard(item, {
                            draggable: item.kind !== 'class' && !item.id.startsWith('custom-') && !pinnedIds.has(item.id) && item.id !== 'commute',
                            slotId: slot.id,
                            onDropIndex: index,
                            showEditControls: item.kind !== 'class',
                            locked: item.kind === 'class',
                          })
                        )}
                      </div>
                    ))
                  ) : (
                    <>
                      {scheduledSlots[0] && (
                        <div
                          className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 dark:border-zinc-700 dark:bg-zinc-950/40"
                          onDragOver={(event) => {
                            if (!draggedItem) return;
                            event.preventDefault();
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            handleDropToSlot(scheduledSlots[0].id, scheduledSlots[0].items.length);
                          }}
                        >
                          {scheduledSlots[0].items.length > 0 && (
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                              {scheduledSlots[0].label}
                            </p>
                          )}
                          {scheduledSlots[0].items.map((item, index) =>
                            renderTimelineCard(item, {
                              draggable: !item.id.startsWith('custom-') && !pinnedIds.has(item.id) && item.id !== 'commute',
                              slotId: scheduledSlots[0].id,
                              onDropIndex: index,
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
                              <div
                                className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 dark:border-zinc-700 dark:bg-zinc-950/40"
                                onDragOver={(event) => {
                                  if (!draggedItem) return;
                                  event.preventDefault();
                                }}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  handleDropToSlot(slot.id, slot.items.length);
                                }}
                              >
                                {slot.items.length > 0 && (
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                                    {slot.label}
                                  </p>
                                )}
                                {slot.items.map((item, itemIndex) =>
                                  renderTimelineCard(item, {
                                    draggable: !item.id.startsWith('custom-') && !pinnedIds.has(item.id) && item.id !== 'commute',
                                    slotId: slot.id,
                                    onDropIndex: itemIndex,
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
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </section>
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
    </div>
  );
}
