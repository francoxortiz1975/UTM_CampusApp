'use client'

import Header from '../../components/Header';
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { Profile } from '../../types/Authentication';

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
  const [profile, setProfile] = useState<Profile | null>(null);
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
      'CS Club': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'Tech Society': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'Math Society': 'bg-green-100 text-green-800 hover:bg-green-200',
      'Physics Club': 'bg-red-100 text-red-800 hover:bg-red-200',
      'Engineering Society': 'bg-orange-100 text-orange-800 hover:bg-orange-200',
    };
    return colors[club] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  const getClubCheckboxColor = (club: string) => {
    const colors: { [key: string]: string } = {
      'CS Club': 'accent-blue-600',
      'Tech Society': 'accent-purple-600',
      'Math Society': 'accent-green-600',
      'Physics Club': 'accent-red-600',
      'Engineering Society': 'accent-orange-600',
    };
    return colors[club] || 'accent-gray-600';
  };

  const allClubs = Array.from(new Set(events.map(e => e.club))).sort();

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-24 bg-gray-50"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    days.push(
      <div key={day} className="min-h-24 bg-white border border-gray-200 p-2">
        <div className="font-semibold text-gray-700 mb-1">{day}</div>
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
    <div className="min-h-screen bg-gray-50">
      <Header onOpenModal={() => setIsModalOpen(true)} profile={profile} />

      <div className="flex">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white shadow-md p-6 min-h-screen">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
          
          {/* Search Bar */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Events
            </label>
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500 text-gray-900"
            />
          </div>

          {/* Show Past Events Toggle */}
          <div className="mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPastEvents}
                onChange={(e) => setShowPastEvents(e.target.checked)}
                className="w-4 h-4 accent-indigo-600"
              />
              <span className="text-sm text-gray-700">Show Past Events</span>
            </label>
          </div>

          {/* Club Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Club
            </label>
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-black text-sm text-gray-700"
            >
              <option value="all">All Clubs</option>
              {allClubs.map(club => (
                <option key={club} value={club}>{club}</option>
              ))}
            </select>
          </div>
        </aside>

        {/* Main Calendar */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              ← Previous
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
            
            <button
              onClick={nextMonth}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Next →
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
            {days}
          </div>
        </div>
      </main>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 flex items-start justify-end z-50 p-8"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-96 overflow-hidden border-2 border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedEvent.title}</h2>
                  <p className="text-indigo-100">{selectedEvent.club}</p>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-semibold text-gray-700">Date</p>
                  <p className="text-gray-600">{formatDate(selectedEvent.date)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <p className="font-semibold text-gray-700">Time</p>
                  <p className="text-gray-600">
                    {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                  </p>
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-semibold text-gray-700">Location</p>
                    <p className="text-gray-600">{selectedEvent.location}</p>
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <p className="font-semibold text-gray-700">Description</p>
                    <p className="text-gray-600">{selectedEvent.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
