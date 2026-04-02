"use client";

import Header from "../../components/Header";
import { useEffect, useMemo, useState } from "react";

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

type SwipeChoice = "yes" | "no";

const apiBase =
  typeof window !== "undefined" && window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5001"
    : "http://localhost:5001";

function addOneHour(time: string) {
  const [h, m] = time.split(":").map(Number);
  const newHour = (h + 1) % 24;
  return `${String(newHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatTime(timeStr: string) {
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes}${ampm}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function shuffleEvents(input: Event[]) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function EventShufflePage() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [deck, setDeck] = useState<Event[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [monthDate, setMonthDate] = useState(new Date());

  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [passedIds, setPassedIds] = useState<string[]>([]);

  const [selectedConfirmedEvent, setSelectedConfirmedEvent] = useState<Event | null>(null);

  const monthLabel = useMemo(
    () => monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [monthDate],
  );
  const confirmedEvents = useMemo(
    () => likedIds
      .map((id) => allEvents.find((event) => event.id === id))
      .filter((event): event is Event => Boolean(event)),
    [likedIds, allEvents],
  );

  const currentEvent = deck[index] ?? null;

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const month = monthDate.getMonth() + 1;
      const res = await fetch(`${apiBase}/calendar/${month}`);
      if (!res.ok) {
        setAllEvents([]);
        setDeck([]);
        setIndex(0);
        return;
      }

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

      const nextDeck = shuffleEvents(mapped);
      setAllEvents(mapped);
      setDeck(nextDeck);
      setIndex(0);
      setLikedIds([]);
      setPassedIds([]);
    } catch (err) {
      console.error("Error fetching events:", err);
      setAllEvents([]);
      setDeck([]);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = (choice: SwipeChoice) => {
    if (!currentEvent) return;

    if (choice === "yes") {
      setLikedIds((prev) => [...prev, currentEvent.id]);
    } else {
      setPassedIds((prev) => [...prev, currentEvent.id]);
    }

    setIndex((prev) => prev + 1);
  };

  const resetDeck = () => {
    setDeck(shuffleEvents(allEvents));
    setIndex(0);
    setLikedIds([]);
    setPassedIds([]);
  };

  const prevMonth = () => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  useEffect(() => {
    fetchEvents();
  }, [monthDate]);

  useEffect(() => {
    if (!selectedConfirmedEvent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedConfirmedEvent(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedConfirmedEvent]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-[#07070d] dark:text-zinc-100">
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-400/35 blur-3xl dark:bg-fuchsia-500/25" />
      <div className="pointer-events-none absolute -right-24 top-28 h-80 w-80 rounded-full bg-cyan-400/30 blur-3xl dark:bg-cyan-400/20" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-orange-300/30 blur-3xl dark:bg-orange-400/20" />
      <Header backHref="/events" backLabel="← Events Calendar" />

      <main id="main-content" className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="bg-gradient-to-r from-fuchsia-600 via-cyan-600 to-orange-500 bg-clip-text text-3xl font-extrabold text-transparent dark:from-fuchsia-300 dark:via-cyan-300 dark:to-orange-300 sm:text-4xl">Event Shuffle</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">Random event discovery in a dark card flow.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="rounded-xl border border-slate-300 bg-white/75 px-3 py-2 text-sm text-slate-700 backdrop-blur hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              ←
            </button>
            <span className="min-w-36 rounded-xl border border-slate-300 bg-white/75 px-3 py-2 text-center text-sm font-semibold text-slate-800 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-100">{monthLabel}</span>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="rounded-xl border border-slate-300 bg-white/75 px-3 py-2 text-sm text-slate-700 backdrop-blur hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              →
            </button>
          </div>
        </div>

        <section className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.15)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:p-6">
            {loading ? (
              <p className="py-20 text-center text-slate-500 dark:text-zinc-400">Loading events...</p>
            ) : currentEvent ? (
              <>
                <article className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-white/10 dark:bg-gradient-to-br dark:from-[#17182a] dark:via-[#0f1020] dark:to-[#0b0c15] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-6">
                  <div className="mb-3 inline-block rounded-full bg-gradient-to-r from-fuchsia-500/80 to-cyan-500/80 px-3 py-1 text-xs font-semibold text-white">
                    {currentEvent.club}
                  </div>

                  <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-zinc-50 sm:text-3xl">{currentEvent.title}</h2>

                  <div className="space-y-2 text-sm text-slate-700 dark:text-zinc-300">
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">Date:</span> {formatDate(currentEvent.date)}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">Time:</span> {formatTime(currentEvent.startTime)} - {formatTime(currentEvent.endTime)}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900 dark:text-zinc-100">Location:</span> {currentEvent.location || "TBA"}
                    </p>
                    {currentEvent.description && (
                      <p className="pt-3 leading-relaxed text-slate-600 dark:text-zinc-400">{currentEvent.description}</p>
                    )}
                  </div>
                </article>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChoice("no")}
                    className="rounded-xl border border-white/10 bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:brightness-110"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChoice("yes")}
                    className="col-span-2 rounded-xl border border-white/10 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/30 transition hover:brightness-110"
                  >
                    Yes
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="mb-4 text-slate-600 dark:text-zinc-400">No more events in this month deck.</p>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={resetDeck}
                    disabled={allEvents.length === 0}
                    className="rounded-xl border border-white/10 bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-2 text-sm text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Shuffle Again
                  </button>
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-zinc-100">Confirmed Events</h3>
            {confirmedEvents.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-zinc-400">Your confirmed events will appear here after pressing Yes.</p>
            ) : (
              <div className="space-y-3">
                {confirmedEvents.map((event) => (
                  <button
                    type="button"
                    key={event.id}
                    onClick={() => setSelectedConfirmedEvent(event)}
                    className="w-full rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-100 to-cyan-100 p-3 text-left transition hover:from-emerald-200 hover:to-cyan-200 dark:border-white/10 dark:from-emerald-500/20 dark:to-cyan-500/20 dark:hover:from-emerald-500/30 dark:hover:to-cyan-500/30"
                  >
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100">{event.title}</p>
                    <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">{event.club}</p>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </section>
      </main>

      {selectedConfirmedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/65"
          onClick={() => setSelectedConfirmedEvent(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="eventshuffle-detail-title"
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-100 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-gradient-to-br dark:from-[#17182a] dark:to-[#0e1020] dark:shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="eventshuffle-detail-title" className="text-2xl font-bold text-slate-900 dark:text-zinc-50">{selectedConfirmedEvent.title}</h2>
            <p className="mt-1 text-sm text-cyan-700 dark:text-cyan-300">{selectedConfirmedEvent.club}</p>

            <div className="mt-4 space-y-2 text-sm text-slate-700 dark:text-zinc-300">
              <p>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">Date:</span> {formatDate(selectedConfirmedEvent.date)}
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">Time:</span> {formatTime(selectedConfirmedEvent.startTime)} - {formatTime(selectedConfirmedEvent.endTime)}
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-zinc-100">Location:</span> {selectedConfirmedEvent.location || "TBA"}
              </p>
              {selectedConfirmedEvent.description && (
                <p className="pt-2 leading-relaxed text-slate-600 dark:text-zinc-400">{selectedConfirmedEvent.description}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                aria-label="Close event details"
                onClick={() => setSelectedConfirmedEvent(null)}
                className="rounded-xl border border-white/10 bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 py-2 text-white transition hover:brightness-110"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
