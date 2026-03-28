'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import {
  CalendarDays,
  Clock3,
  Dumbbell,
  LocateFixed,
  LoaderCircle,
  MapPinned,
  Route,
  Sparkles,
  Upload,
  Utensils,
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
  getAvailableDateKeys,
  getEventsForDate,
  parseIcsCalendar,
  type PlannerCalendarEvent,
  type PlannerPreferences,
  type PlannerTimelineItem,
} from './plannerUtils';

const initialPreferences: PlannerPreferences = {
  alreadyOnCampus: false,
  transportMode: 'drive',
  arrivalMinutes: 30,
  wantsFood: true,
  wantsGym: false,
  wantsEvents: true,
};

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

  const hasCalendar = calendarSource !== 'empty' && calendarEvents.length > 0;

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
          })
        : null,
    [classesForSelectedDate, preferences, statuses, selectedDate, locationDistanceKm, hasCalendar]
  );

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

      if (currentUser) {
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
                      checked={preferences.wantsFood}
                      onChange={(event) =>
                        setPreferences((prev) => ({ ...prev, wantsFood: event.target.checked }))
                      }
                      className="size-4 rounded accent-orange-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-zinc-200">I want food on campus</span>
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

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/70">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Detected classes</h2>
              <div className="mt-3 space-y-3">
                {classesForSelectedDate.length > 0 ? (
                  classesForSelectedDate.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <p className="font-semibold text-gray-900 dark:text-zinc-100">{event.title}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">{event.location}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                        {event.start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} -{' '}
                        {event.end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-600 dark:border-zinc-700 dark:text-zinc-300">
                    {hasCalendar
                      ? 'No classes were found for this date.'
                      : 'Upload your calendar to see your classes for today.'}
                  </div>
                )}
              </div>
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
                    Hour-by-hour suggestions based on your classes and campus conditions.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {plannerResult ? plannerResult.timeline.map((item) => {
                  const style = kindStyles[item.kind];
                  const Icon = style.icon;
                  const blockHeight = Math.max(60, Math.round(item.durationMinutes * 1.6));
                  const isPast = item.endAt !== null && item.endAt.getTime() <= currentTime.getTime();

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
                            <p className={`text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400 ${isPast ? 'line-through decoration-2 opacity-70' : ''}`}>
                              {item.time}
                            </p>
                            <h3 className={`mt-1 text-lg font-semibold text-gray-900 dark:text-zinc-100 ${isPast ? 'line-through decoration-2 opacity-70' : ''}`}>
                              {item.title}
                            </h3>
                            <p className={`mt-2 text-sm leading-6 text-slate-700 dark:text-zinc-200 ${isPast ? 'line-through decoration-2 opacity-70' : ''}`}>
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
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
    </div>
  );
}
