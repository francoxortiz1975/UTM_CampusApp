"use client";

import Header from '../../components/Header';
import { useState, useEffect } from 'react';
import { Profile } from '../../types/Authentication';
import Link from 'next/link';

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

const admins = [1, 9]; // Hard-coded admin user IDs

const apiBase =
  typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5001'
    : 'http://localhost:5001';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [showPastEvents, setShowPastEvents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reviewPending, setReviewPending] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    org: "",
    date: "",
    time: "",
    location: "",
    desc: ""
  });

  // ---------------- Helpers ----------------
  const addOneHour = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const newHour = (h + 1) % 24;
    return `${String(newHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes}${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getClubColor = (club: string) => {
    const colors: { [key: string]: string } = {
      'CS Club': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Tech Society': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Math Society': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };
    return colors[club] || 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300';
  };

  // ---------------- Fetch Current User ----------------
  const fetchCurrentUser = async () => {
    const currUser = await Profile();
    if (currUser) setCurrentUserId(currUser.id);
    setLoading(false);
  };

  // ---------------- Fetch Events ----------------
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const month = currentMonth.getMonth() + 1;
      const res = await fetch(`${apiBase}/calendar/${month}`);
      if (!res.ok) return;
      const data = await res.json();

      const mapped: Event[] = data.map((e: any) => ({
        id: String(e.id),
        title: e.name,
        club: e.org,
        date: e.date,
        startTime: e.time,
        endTime: addOneHour(e.time),
        location: e.location,
        description: e.desc,
      }));

      setEvents(mapped);
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingEvents = async () => {
    try {
      const res = await fetch(`${apiBase}/calendar/pending`);
      if (!res.ok) return;
      const data = await res.json();

      const mapped: Event[] = data.map((e: any) => ({
        id: String(e.id),
        title: e.name,
        club: e.org,
        date: e.date,
        startTime: e.time,
        endTime: addOneHour(e.time),
        location: e.location,
        description: e.desc,
      }));

      setPendingEvents(mapped);
    } catch (err) {
      console.error("Error fetching pending events:", err);
    }
  };

  // ---------------- Create Event ----------------
  const createEvent = async () => {
    try {
      const res = await fetch(`${apiBase}/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        console.error("Failed to create event");
        return;
      }
      setShowCreateModal(false);
      fetchEvents();
      setFormData({ name: "", org: "", date: "", time: "", location: "", desc: "" });
    } catch (err) {
      console.error("Error creating event:", err);
    }
  };

  // ---------------- Admin Actions ----------------
  const acceptEvent = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/calendar/accept/${id}`, { method: 'POST' });
      if (res.ok) fetchPendingEvents();
    } catch (err) { console.error(err); }
  };

  const declineEvent = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/calendar/decline/${id}`, { method: 'POST' });
      if (res.ok) fetchPendingEvents();
    } catch (err) { console.error(err); }
  };

  // ---------------- Calendar Logic ----------------
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay(), year, month };
  };

  const getEventsForDay = (day: number) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events.filter(e => {
      const eventDate = new Date(e.date);
      if (e.date !== dateStr) return false;
      if (selectedClub !== 'all' && e.club !== selectedClub) return false;
      if (!showPastEvents && eventDate < today) return false;
      if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const allClubs = Array.from(new Set(events.map(e => e.club))).sort();
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // ---------------- Render Days ----------------
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) days.push(<div key={`empty-${i}`} className="min-h-24 bg-gray-50 dark:bg-zinc-950/50" />);
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    days.push(
      <div key={day} className="min-h-24 border dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2">
        <div className="font-semibold text-gray-900 dark:text-zinc-100">{day}</div>
        {dayEvents.map(event => (
          <div
            key={event.id}
            role="button"
            tabIndex={0}
            className={`mt-1 cursor-pointer rounded p-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getClubColor(event.club)}`}
            onClick={() => setSelectedEvent(event)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedEvent(event);
              }
            }}
            aria-label={`${event.title}, ${event.club}, ${formatTime(event.startTime)}`}
          >
            {formatTime(event.startTime)} {event.title}
          </div>
        ))}
      </div>
    );
  }

  // ---------------- UseEffect ----------------
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchEvents();
    if (currentUserId !== null && admins.includes(currentUserId)) fetchPendingEvents();
  }, [currentMonth, currentUserId]);

  useEffect(() => {
    if (!selectedEvent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedEvent(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedEvent]);

  useEffect(() => {
    if (!showCreateModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCreateModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCreateModal]);

  // ---------------- Render ----------------
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-[#0b0c10] dark:text-zinc-100">
      <div className="pointer-events-none absolute -left-20 -top-16 h-80 w-80 rounded-full bg-white/70 blur-3xl dark:bg-white/10" />
      <div className="pointer-events-none absolute right-0 top-24 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl dark:bg-violet-600/10" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-slate-200/40 blur-3xl dark:bg-zinc-500/10" />
      <Header />

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-8">
        <h1 className="font-display bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-3xl font-bold leading-[1.28] text-transparent dark:from-violet-300 dark:to-fuchsia-300">
          Event Calendar
        </h1>
      </div>

      <div className="relative z-10 flex w-full pt-6 px-6 gap-6">
        {/* Sidebar */}
        <aside
          aria-label="Calendar filters and actions"
          className="h-fit w-64 shrink-0 space-y-4 rounded-xl border border-transparent bg-white p-6 shadow dark:border-zinc-800 dark:bg-zinc-900"
        >
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="w-full rounded-lg border border-blue-200/50 bg-blue-300/15 py-2 font-medium text-blue-950 backdrop-blur-sm transition-all hover:border-blue-200/70 hover:bg-blue-300/25 dark:border-blue-200/30 dark:bg-blue-300/10 dark:text-white dark:hover:bg-blue-300/20"
          >
            + Request Event
          </button>

          {currentUserId !== null && admins.includes(currentUserId) && (
            <button
              type="button"
              onClick={() => setReviewPending(prev => !prev)}
              className="w-full rounded-lg border border-amber-200/50 bg-amber-300/15 py-2 font-medium text-amber-950 backdrop-blur-sm transition-all hover:border-amber-200/70 hover:bg-amber-300/25 dark:border-amber-200/30 dark:bg-amber-300/10 dark:text-white dark:hover:bg-amber-300/20"
            >
              Review Pending
            </button>
          )}

          <div>
            <label htmlFor="event-calendar-search" className="sr-only">
              Search events by title
            </label>
            <input
              id="event-calendar-search"
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="mt-2 flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={showPastEvents} onChange={(e) => setShowPastEvents(e.target.checked)} className="rounded dark:border-zinc-700 dark:bg-zinc-900" />
            <span>Show Past</span>
          </label>

          <div>
            <label htmlFor="event-club-filter" className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Club
            </label>
            <select
              id="event-club-filter"
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full rounded-lg border bg-white p-2 dark:border-zinc-700 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Clubs</option>
              {allClubs.map(club => <option key={club}>{club}</option>)}
            </select>
          </div>

          <Link
            href="/eventshuffle"
            className="block w-full rounded-lg border border-slate-300/70 bg-slate-200/70 py-2 text-center font-medium text-slate-800 backdrop-blur-sm transition-all hover:border-slate-400/80 hover:bg-slate-200/90 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            Open Event Shuffle
          </Link>
        </aside>

        {/* Calendar column */}
        <div className="min-w-0 flex-1 space-y-6">
          {!reviewPending ? (
            <div className="rounded-xl border border-transparent bg-white p-6 shadow dark:border-zinc-800 dark:bg-zinc-900">
              <div
                role="region"
                aria-label={`Calendar, ${monthName}`}
              >
              <div className="mb-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  aria-label="Previous month"
                  className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  ←
                </button>
                <h2 className="text-xl font-bold">{monthName}</h2>
                <button
                  type="button"
                  onClick={nextMonth}
                  aria-label="Next month"
                  className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                  →
                </button>
              </div>

              {loading ? (
                <p className="py-10 text-center text-gray-500 dark:text-zinc-400">Loading events...</p>
              ) : (
                <div className="grid grid-cols-7 overflow-hidden rounded border-l border-t dark:border-zinc-800">
                  {/* Day Headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center py-2 text-sm font-semibold bg-gray-50 dark:bg-zinc-950/50 border-r border-b dark:border-zinc-800">
                      {day}
                    </div>
                  ))}
                  {days}
                </div>
              )}
              </div>
            </div>
          ) : (
            // ---------------- Pending Events for Admin ----------------
            <div className="bg-white dark:bg-zinc-900 p-6 shadow rounded-xl space-y-4 border border-transparent dark:border-zinc-800">
              <h2 className="text-xl font-bold mb-4">Pending Event Requests</h2>
              {pendingEvents.length === 0 ? (
                <p className="text-gray-500 dark:text-zinc-400">No pending events.</p>
              ) : pendingEvents.map(event => (
                <div key={event.id} className="border dark:border-zinc-700 p-4 rounded-lg space-y-2 bg-gray-50 dark:bg-zinc-950/30">
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Club: <span className="text-gray-900 dark:text-zinc-200">{event.club}</span></p>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Date: <span className="text-gray-900 dark:text-zinc-200">{formatDate(event.date)}</span></p>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Time: <span className="text-gray-900 dark:text-zinc-200">{formatTime(event.startTime)} - {formatTime(event.endTime)}</span></p>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Location: <span className="text-gray-900 dark:text-zinc-200">{event.location}</span></p>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Description: <span className="text-gray-900 dark:text-zinc-200">{event.description}</span></p>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => acceptEvent(event.id)} className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">Accept</button>
                    <button type="button" onClick={() => declineEvent(event.id)} className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-stretch sm:justify-end sm:p-6"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-detail-title"
            className="h-fit w-full max-h-[90vh] space-y-4 overflow-y-auto rounded-2xl border border-transparent bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:h-auto sm:w-96"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <h2 id="event-detail-title" className="text-xl font-bold text-gray-800 dark:text-zinc-100">
                {selectedEvent.title}
              </h2>
              <button
                type="button"
                aria-label="Close event details"
                onClick={() => setSelectedEvent(null)}
                className="text-lg text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            {/* Club Tag */}
            <div>
              <span
                className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${getClubColor(
                  selectedEvent.club
                )}`}
              >
                {selectedEvent.club}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-3 text-sm text-gray-700 dark:text-zinc-300">
              <div className="flex items-center gap-2">
                <span aria-hidden="true">📅</span>
                <span>
                  <strong className="text-gray-900 dark:text-zinc-100">Date:</strong> {formatDate(selectedEvent.date)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span aria-hidden="true">⏰</span>
                <span>
                  <strong className="text-gray-900 dark:text-zinc-100">Time:</strong>{" "}
                  {formatTime(selectedEvent.startTime)} –{" "}
                  {formatTime(selectedEvent.endTime)}
                </span>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">📍</span>
                  <span>
                    <strong className="text-gray-900 dark:text-zinc-100">Location:</strong> {selectedEvent.location}
                  </span>
                </div>
              )}

              {selectedEvent.description && (
                <div className="pt-3 border-t dark:border-zinc-700">
                  <p className="text-gray-500 dark:text-zinc-400 text-xs mb-1">Description</p>
                  <p className="leading-relaxed">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="flex justify-end border-t pt-4 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-event-title"
            className="w-full max-w-md space-y-4 rounded-2xl border border-transparent bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="create-event-title" className="text-xl font-bold dark:text-zinc-100">Request New Event</h2>

            <div className="space-y-3">
              <div>
                <label htmlFor="create-event-name" className="sr-only">Event name</label>
                <input id="create-event-name" name="name" placeholder="Event Name" value={formData.name} onChange={handleChange} className="w-full rounded-lg border bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="create-event-org" className="sr-only">Club or organization</label>
                <input id="create-event-org" name="org" placeholder="Club" value={formData.org} onChange={handleChange} className="w-full rounded-lg border bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="create-event-date" className="sr-only">Event date</label>
                <input id="create-event-date" type="date" name="date" value={formData.date} onChange={handleChange} className="w-full rounded-lg border bg-white p-3 color-scheme-light dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="create-event-time" className="sr-only">Event start time</label>
                <input id="create-event-time" type="time" name="time" value={formData.time} onChange={handleChange} className="w-full rounded-lg border bg-white p-3 color-scheme-light dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="create-event-location" className="sr-only">Event location</label>
                <input id="create-event-location" name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="w-full rounded-lg border bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="create-event-desc" className="sr-only">Event description</label>
                <textarea id="create-event-desc" name="desc" placeholder="Description" rows={3} value={formData.desc} onChange={handleChange} className="w-full resize-none rounded-lg border bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-lg bg-gray-200 px-5 py-2 text-gray-800 hover:bg-gray-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">Cancel</button>
              <button type="button" onClick={createEvent} className="rounded-lg bg-indigo-600 px-5 py-2 text-white hover:bg-indigo-700">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
