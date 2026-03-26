'use client'

import Header from '../../components/Header';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';

interface Event {
  id: string;
  title: string;
  club: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // 24-hour format (HH:MM)
  endTime: string; // 24-hour format (HH:MM)
  location?: string;
  description?: string;
}

// Mock data - will be replaced with API calls
const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'CS Club Meeting',
    club: 'CS Club',
    date: '2026-03-25',
    startTime: '18:00',
    endTime: '19:30',
    location: 'BA 1170',
    description: 'Weekly general meeting'
  },
  {
    id: '2',
    title: 'Hackathon Workshop',
    club: 'Tech Society',
    date: '2026-03-27',
    startTime: '14:00',
    endTime: '17:00',
    location: 'BA 2135',
    description: 'Learn React'
  },
  {
    id: '3',
    title: 'Study Session',
    club: 'Math Society',
    date: '2026-03-28',
    startTime: '16:00',
    endTime: '18:00',
    location: 'Library',
    description: 'MAT157 study group'
  }
];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [showPastEvents, setShowPastEvents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setEvents(MOCK_EVENTS);
  }, []);

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
    
    return events.filter(e => {
      if (e.date !== dateStr) return false;
      
      // Filter by selected club
      if (selectedClub !== 'all' && e.club !== selectedClub) return false;
      
      // Filter by past events
      if (!showPastEvents && eventDate < today) return false;
      
      // Filter by search query
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
      'CS Club':
        'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900',
      'Tech Society':
        'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:hover:bg-purple-900',
      'Math Society':
        'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-950 dark:text-green-200 dark:hover:bg-green-900',
      'Physics Club':
        'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900',
      'Engineering Society':
        'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:hover:bg-orange-900',
    };
    return (
      colors[club] ||
      'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
    );
  };

  const allClubs = Array.from(new Set(events.map(e => e.club))).sort();

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(
      <div key={`empty-${i}`} className="min-h-24 bg-gray-50 dark:bg-zinc-900/80"></div>
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    days.push(
      <div
        key={day}
        className="min-h-24 border border-gray-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="mb-1 font-semibold text-gray-700 dark:text-zinc-300">{day}</div>
        <div className="space-y-1">
          {dayEvents.map(event => (
            <div
              key={event.id}
              className={`text-xs p-1 rounded truncate cursor-pointer ${getClubColor(event.club)}`}
              onClick={() => setSelectedEvent(event)}
              title={`${event.title} - ${event.club} @ ${formatTime(event.startTime)}`}
            >
              {formatTime(event.startTime)} {event.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <Header />

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="min-h-screen w-64 bg-white p-6 shadow-md dark:bg-zinc-900 dark:shadow-zinc-950/50">
          <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-zinc-100">Filters</h3>
          
          {/* Search Bar */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Search Events
            </label>
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:ring-indigo-400"
            />
          </div>

          {/* Show Past Events Toggle */}
          <div className="mb-6">
            <label className="flex cursor-pointer items-center space-x-2">
              <input
                type="checkbox"
                checked={showPastEvents}
                onChange={(e) => setShowPastEvents(e.target.checked)}
                className="h-4 w-4 accent-indigo-600 dark:accent-indigo-500"
              />
              <span className="text-sm text-gray-700 dark:text-zinc-300">Show Past Events</span>
            </label>
          </div>

          {/* Club Filter */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Filter by Club
            </label>
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 placeholder-black focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:ring-indigo-400"
            >
              <option value="all">All Clubs</option>
              {allClubs.map(club => (
                <option key={club} value={club}>{club}</option>
              ))}
            </select>
          </div>
        </aside>

        {/* Main Calendar */}
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900 dark:shadow-zinc-950/50">
          {/* Calendar Header */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              ← Previous
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{monthName}</h2>
            
            <button
              onClick={nextMonth}
              className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Next →
            </button>
          </div>

          {/* Day Headers */}
          <div className="mb-2 grid grid-cols-7 gap-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 text-center font-semibold text-gray-600 dark:text-zinc-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0 border-l border-t border-gray-200 dark:border-zinc-700">
            {days}
          </div>
        </div>
      </main>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end p-8"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-96 overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-2xl dark:border-zinc-600 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white dark:from-indigo-600 dark:to-purple-600">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="mb-2 text-2xl font-bold">{selectedEvent.title}</h2>
                  <p className="text-indigo-100 dark:text-indigo-200">{selectedEvent.club}</p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-2xl font-bold text-white hover:text-gray-200 dark:hover:text-zinc-200"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 p-6">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-zinc-300">Date</p>
                  <p className="text-gray-600 dark:text-zinc-400">{formatDate(selectedEvent.date)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-zinc-300">Time</p>
                  <p className="text-gray-600 dark:text-zinc-400">
                    {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                  </p>
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-zinc-300">Location</p>
                    <p className="text-gray-600 dark:text-zinc-400">{selectedEvent.location}</p>
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-zinc-300">Description</p>
                    <p className="text-gray-600 dark:text-zinc-400">{selectedEvent.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end bg-gray-50 px-6 py-4 dark:bg-zinc-800">
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {null}
      </Modal>
    </div>
  );
}
