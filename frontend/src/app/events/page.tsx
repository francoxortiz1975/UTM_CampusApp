'use client';

import Header from '../../components/Header';
import { PageIntro } from '../../components/AppPageLayout';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  btnPrimary,
  btnSecondary,
  cardSurface,
  focusRing,
  inputBase,
  pageBackground,
} from '../../lib/ui-classes';

interface Event {
  id: string;
  title: string;
  club: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
}

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'CS Club Meeting',
    club: 'CS Club',
    date: '2026-03-25',
    startTime: '18:00',
    endTime: '19:30',
    location: 'BA 1170',
    description: 'Weekly general meeting',
  },
  {
    id: '2',
    title: 'Hackathon Workshop',
    club: 'Tech Society',
    date: '2026-03-27',
    startTime: '14:00',
    endTime: '17:00',
    location: 'BA 2135',
    description: 'Learn React',
  },
  {
    id: '3',
    title: 'Study Session',
    club: 'Math Society',
    date: '2026-03-28',
    startTime: '16:00',
    endTime: '18:00',
    location: 'Library',
    description: 'MAT157 study group',
  },
];

const getClubStyles = (club: string) => {
  const map: Record<string, string> = {
    'CS Club': 'bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100',
    'Tech Society': 'bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-100',
    'Math Society': 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100',
    'Physics Club': 'bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-100',
    'Engineering Society': 'bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-100',
  };
  return map[club] ?? 'bg-[var(--surface-muted)] text-[var(--fg)]';
};

export default function EventsPage() {
  const searchId = useId();
  const clubSelectId = useId();
  const dialogTitleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [showPastEvents, setShowPastEvents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setEvents(MOCK_EVENTS);
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;

    const prev = document.activeElement as HTMLElement | null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedEvent(null);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [selectedEvent]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDay = (day: number) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateStr);

    return events.filter((e) => {
      if (e.date !== dateStr) return false;
      if (selectedClub !== 'all' && e.club !== selectedClub) return false;
      if (!showPastEvents && eventDate < today) return false;
      if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const allClubs = Array.from(new Set(events.map((e) => e.club))).sort();
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cells: ReactNode[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    cells.push(
      <div
        key={`empty-${i}`}
        className="min-h-[6.5rem] bg-[var(--surface-muted)]/40"
        aria-hidden
      />
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    cells.push(
      <div
        key={day}
        className="flex min-h-[6.5rem] flex-col border border-[var(--border)] bg-[var(--surface-card)] p-2"
      >
        <div className="mb-1 text-sm font-semibold text-[var(--fg)]">{day}</div>
        <ul className="flex flex-1 flex-col gap-1 overflow-hidden">
          {dayEvents.map((event) => (
            <li key={event.id} className="min-w-0">
              <button
                type="button"
                onClick={() => setSelectedEvent(event)}
                className={`w-full truncate rounded px-1 py-1 text-left text-xs font-medium motion-safe:transition-colors ${getClubStyles(
                  event.club
                )} ${focusRing}`}
              >
                <span className="sr-only">{event.club}. </span>
                <span className="tabular-nums">{formatTime(event.startTime)}</span>
                <span aria-hidden="true"> — </span>
                {event.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={pageBackground}>
      <Header />

      <div className="flex flex-col lg:flex-row">
        <aside
          className="w-full border-b border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-sm lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r"
          aria-label="Event filters"
        >
          <h2 className="mb-4 text-base font-semibold text-[var(--fg)]">Filters</h2>

          <div className="mb-6">
            <label htmlFor={searchId} className="mb-2 block text-sm font-medium text-[var(--fg)]">
              Search events
            </label>
            <input
              id={searchId}
              type="search"
              placeholder="Search by title…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputBase}
              autoComplete="off"
            />
          </div>

          <div className="mb-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={showPastEvents}
                onChange={(e) => setShowPastEvents(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
              />
              <span className="text-sm text-[var(--fg)]">Show past events</span>
            </label>
          </div>

          <div>
            <label htmlFor={clubSelectId} className="mb-2 block text-sm font-medium text-[var(--fg)]">
              Club
            </label>
            <select
              id={clubSelectId}
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className={inputBase}
            >
              <option value="all">All clubs</option>
              {allClubs.map((club) => (
                <option key={club} value={club}>
                  {club}
                </option>
              ))}
            </select>
          </div>
        </aside>

        <main
          id="main-content"
          className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10"
        >
          <PageIntro
            title="Events"
            description="Browse club meetings and activities. Use filters to narrow the calendar, then tap an event for details."
            className="mb-6 lg:mb-8"
          />

          <div className={`${cardSurface} p-4 sm:p-6`}>
            <div className="mb-6 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={prevMonth} className={btnSecondary}>
                Previous month
              </button>

              <h2 className="text-center text-xl font-bold text-[var(--fg)] sm:text-2xl">{monthName}</h2>

              <button type="button" onClick={nextMonth} className={btnSecondary}>
                Next month
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-0">
              {weekdayLabels.map((day) => (
                <div key={day} className="py-2 text-center text-sm font-semibold text-[var(--fg-muted)]">
                  {day}
                </div>
              ))}
            </div>

            <div
              className="grid grid-cols-7 gap-0 border-t border-l border-[var(--border)]"
              aria-label={`Calendar for ${monthName}`}
            >
              {cells}
            </div>
          </div>
        </main>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center">
          <button
            type="button"
            aria-label="Close event details"
            className={`absolute inset-0 bg-[var(--fg)]/40 ${focusRing}`}
            onClick={() => setSelectedEvent(null)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="relative z-10 mt-8 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface-card)] shadow-lg sm:mt-0"
          >
            <div className="border-b border-[var(--border)] bg-[var(--primary)] px-6 py-5 text-[var(--primary-fg)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 id={dialogTitleId} className="text-xl font-bold leading-snug">
                    {selectedEvent.title}
                  </h2>
                  <p className="mt-1 text-sm opacity-90">{selectedEvent.club}</p>
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className={`shrink-0 rounded-lg px-2 py-1 text-2xl leading-none text-[var(--primary-fg)] hover:bg-black/10 ${focusRing}`}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-4 p-6 text-[var(--fg)]">
              <div>
                <p className="text-sm font-semibold text-[var(--fg-muted)]">Date</p>
                <p className="text-[var(--fg)]">{formatDate(selectedEvent.date)}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[var(--fg-muted)]">Time</p>
                <p className="text-[var(--fg)]">
                  {formatTime(selectedEvent.startTime)} – {formatTime(selectedEvent.endTime)}
                </p>
              </div>

              {selectedEvent.location && (
                <div>
                  <p className="text-sm font-semibold text-[var(--fg-muted)]">Location</p>
                  <p className="text-[var(--fg)]">{selectedEvent.location}</p>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <p className="text-sm font-semibold text-[var(--fg-muted)]">Description</p>
                  <p className="text-[var(--fg)]">{selectedEvent.description}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-[var(--border)] bg-[var(--surface-page)] px-6 py-4">
              <button type="button" onClick={() => setSelectedEvent(null)} className={btnPrimary}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
