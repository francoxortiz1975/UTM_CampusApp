'use client';

import Link from 'next/link';
import { CalendarDays, Car, Dumbbell, Map, Utensils, PackageOpen, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import { useEffect, useState } from 'react';

const apps = [
    {
        name: 'Food Availability',
        description: 'See which cafeterias are open and typical wait times.',
        href: '/food',
        icon: Utensils,
        titleGradient:
            'group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:to-orange-500',
        accent:
            'bg-slate-200/80 text-slate-700 ring-slate-300/80 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/15 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-orange-500 group-hover:text-white group-hover:ring-transparent',
    },
    {
        name: 'Gym Availability',
        description: 'Check gym occupancy and plan your workout.',
        href: '/gym',
        icon: Dumbbell,
        titleGradient:
            'group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-lime-500',
        accent:
            'bg-slate-200/80 text-slate-700 ring-slate-300/80 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/15 group-hover:bg-gradient-to-br group-hover:from-emerald-400 group-hover:to-cyan-500 group-hover:text-white group-hover:ring-transparent',
    },
    {
        name: 'Parking Availability',
        description: 'Find lots with space before you arrive.',
        href: '/parking',
        icon: Car,
        titleGradient:
            'group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-sky-500',
        accent:
            'bg-slate-200/80 text-slate-700 ring-slate-300/80 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/15 group-hover:bg-gradient-to-br group-hover:from-sky-400 group-hover:to-indigo-500 group-hover:text-white group-hover:ring-transparent',
    },
    {
        name: 'Event Calendar',
        description: 'View upcoming club events on campus.',
        href: '/events',
        icon: CalendarDays,
        titleGradient:
            'group-hover:bg-gradient-to-r group-hover:from-violet-500 group-hover:to-fuchsia-500',
        accent:
            'bg-slate-200/80 text-slate-700 ring-slate-300/80 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/15 group-hover:bg-gradient-to-br group-hover:from-violet-400 group-hover:to-fuchsia-500 group-hover:text-white group-hover:ring-transparent',
    },
    {
        name: 'Interactive Map',
        description: 'Explore key campus buildings and jump to services inside them.',
        href: '/map',
        icon: Map,
        titleGradient:
            'group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-red-500',
        accent:
            'bg-slate-200/80 text-slate-700 ring-slate-300/80 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/15 group-hover:bg-gradient-to-br group-hover:from-rose-400 group-hover:to-orange-500 group-hover:text-white group-hover:ring-transparent',
    },
    {
        name: 'Lost And Found',
        description: 'See what others have lost/found on campus',
        href: '/lostandfound',
        icon: PackageOpen,
        titleGradient:
            'group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-blue-500',
        accent:
            'bg-slate-200/80 text-slate-700 ring-slate-300/80 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/15 group-hover:bg-gradient-to-br group-hover:from-cyan-400 group-hover:to-blue-500 group-hover:text-white group-hover:ring-transparent',
    },
    {
        name: 'Day Planner',
        description: 'Upload your calendar and generate a campus plan around classes, food, and gym time.',
        href: '/planner',
        icon: Sparkles,
        titleGradient:
            'group-hover:bg-gradient-to-r group-hover:from-amber-400 group-hover:to-yellow-500',
        accent:
            'bg-slate-200/80 text-amber-900 ring-slate-300/80 dark:bg-white/10 dark:text-amber-200 dark:ring-white/15 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 group-hover:text-white group-hover:ring-transparent',
    },
] as const;

const apiBase =
    typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:5000'
        : 'http://localhost:5000';

const foodPreviewTargets = [
    { id: '1', name: 'Subway' },
    { id: '3', name: 'Starbucks' },
    { id: '2', name: "Harvey's" },
] as const;

type FoodPreviewRow = {
    name: string;
    minutes: number | null;
};

type Building = {
    id: string;
    label: string;
    position: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
    accent: string;
};

const mapBuildings: Building[] = [
    {
        id: 'ib',
        label: 'IB',
        position: { left: 12, top: 20, width: 18, height: 14 },
        accent: 'bg-amber-200 text-amber-900',
    },
    {
        id: 'dv',
        label: 'DV',
        position: { left: 38, top: 16, width: 16, height: 12 },
        accent: 'bg-blue-200 text-blue-900',
    },
    {
        id: 'dh',
        label: 'DH',
        position: { left: 60, top: 28, width: 18, height: 13 },
        accent: 'bg-emerald-200 text-emerald-900',
    },
    {
        id: 'kn',
        label: 'KN',
        position: { left: 24, top: 52, width: 18, height: 14 },
        accent: 'bg-violet-200 text-violet-900',
    },
    {
        id: 'rawc',
        label: 'RAWC',
        position: { left: 58, top: 56, width: 22, height: 16 },
        accent: 'bg-rose-200 text-rose-900',
    },
];

export default function Home() {
    const [foodPreview, setFoodPreview] = useState<FoodPreviewRow[]>(
        foodPreviewTargets.map((item) => ({ name: item.name, minutes: null }))
    );

    useEffect(() => {
        const fetchFoodPreview = async () => {
            const now = new Date();
            const month = now.getMonth() + 1;
            const weekday = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
            const hour = now.getHours();

            const results = await Promise.all(
                foodPreviewTargets.map(async (item) => {
                    try {
                        const res = await fetch(
                            `${apiBase}/reports/${month}/${weekday}/${hour}/food/${item.id}`
                        );
                        if (!res.ok) return { name: item.name, minutes: null };
                        const payload = await res.json();
                        const estimate = payload?.estimate;
                        return {
                            name: item.name,
                            minutes: typeof estimate === 'number' ? estimate : null,
                        };
                    } catch {
                        return { name: item.name, minutes: null };
                    }
                })
            );

            setFoodPreview(results);
        };

        fetchFoodPreview();
    }, []);

    const mapApp = apps.find((app) => app.href === '/map');
    const foodApp = apps.find((app) => app.href === '/food');
    const plannerApp = apps.find((app) => app.href === '/planner');
    const eventApp = apps.find((app) => app.href === '/events');
    const lowerApps = apps.filter(
        (app) => app.href !== '/map' && app.href !== '/food' && app.href !== '/planner' && app.href !== '/events'
    );

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-[#0b0c10] dark:text-zinc-100">
            <div className="pointer-events-none absolute -left-20 -top-16 h-80 w-80 rounded-full bg-slate-300/20 blur-3xl dark:bg-zinc-700/10" />
            <div className="pointer-events-none absolute right-0 top-24 h-96 w-96 rounded-full bg-slate-300/35 blur-3xl dark:bg-zinc-600/15" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-slate-200/40 blur-3xl dark:bg-zinc-500/10" />
            <Header />

            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:bg-zinc-900 dark:focus:text-zinc-100 dark:focus:ring-offset-zinc-950"
            >
                Skip to main content
            </a>

            <main id="main-content" className="relative z-10 px-4 pb-20 pt-10 sm:px-6 lg:px-8">
                <header className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                        Campus dashboard
                    </p>
                    <h1 className="font-display mt-3 pb-1 text-balance text-3xl leading-[1.28] tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                        Everything you need on campus
                    </h1>
                    <p className="mt-4 text-pretty text-lg leading-relaxed text-slate-700 sm:text-xl dark:text-zinc-400">
                        Real-time food, gym, parking, events, and campus navigation in
                        one place. Choose a service below to get started.
                    </p>
                </header>

                <section
                    className="mx-auto mt-14 max-w-5xl"
                    aria-labelledby="services-heading"
                >
                    <h2
                        id="services-heading"
                        className="font-display mb-6 pb-0.5 text-center text-base leading-[1.25] text-slate-800 dark:text-zinc-100"
                    >
                        Choose a service
                    </h2>

                    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                        {mapApp && (
                            <Link
                                href={mapApp.href}
                                className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/65 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-cyan-300/55 hover:shadow-[0_20px_50px_rgba(14,116,144,0.18)] dark:border-white/10 dark:bg-zinc-900/50 dark:hover:border-cyan-400/35 dark:hover:shadow-[0_20px_50px_rgba(20,184,166,0.15)]"
                            >
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.55),transparent_35%),radial-gradient(circle_at_85%_75%,rgba(56,189,248,0.20),transparent_40%)] dark:bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_85%_75%,rgba(56,189,248,0.14),transparent_40%)]" />
                                <div className="relative flex h-full min-h-[16rem] flex-col justify-between">
                                    <div>
                                        <span className={`inline-flex size-12 items-center justify-center rounded-xl ring-1 shadow-sm ${mapApp.accent}`}>
                                            <Map className="size-6" strokeWidth={2} />
                                        </span>
                                        <h3 className={`font-display mt-4 text-2xl leading-[1.3] text-slate-900 transition-all group-hover:bg-clip-text group-hover:text-transparent dark:text-zinc-100 ${mapApp.titleGradient}`}>
                                            {mapApp.name}
                                        </h3>
                                    </div>
                                    <div className="mt-4 flex flex-1 flex-col">
                                        <div className="relative min-h-[200px] overflow-hidden rounded-2xl border border-slate-200/60 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.8),transparent_18%),linear-gradient(135deg,#cbd5e1_0%,#e2e8f0_40%,#bfdbfe_100%)] dark:border-zinc-700 dark:bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.06),transparent_18%),linear-gradient(135deg,#1f2937_0%,#111827_45%,#172554_100%)]">
                                            {mapBuildings.map((building) => (
                                                <div
                                                    key={building.id}
                                                    className={`absolute rounded-lg border px-2 py-1 text-center shadow-sm ${building.accent}`}
                                                    style={{
                                                        left: `${building.position.left}%`,
                                                        top: `${building.position.top}%`,
                                                        width: `${building.position.width}%`,
                                                        height: `${building.position.height}%`,
                                                    }}
                                                >
                                                    <span className="block text-xs font-bold">
                                                        {building.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <span className="mt-4 inline-flex items-center text-sm font-semibold text-slate-600 transition-colors group-hover:text-cyan-700 dark:text-zinc-400 dark:group-hover:text-cyan-300">
                                        Open Map
                                        <span className="ml-1">→</span>
                                    </span>
                                </div>
                            </Link>
                        )}

                        {foodApp && (
                            <Link
                                href={foodApp.href}
                                className="group rounded-3xl border border-slate-200/90 bg-white/65 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-cyan-300/55 hover:shadow-[0_20px_50px_rgba(14,116,144,0.18)] dark:border-white/10 dark:bg-zinc-900/50 dark:hover:border-cyan-400/35 dark:hover:shadow-[0_20px_50px_rgba(20,184,166,0.15)]"
                            >
                                <span className={`inline-flex size-11 items-center justify-center rounded-xl ring-1 shadow-sm ${foodApp.accent}`}>
                                    <Utensils className="size-5" strokeWidth={2} />
                                </span>
                                <h3 className={`font-display mt-4 text-xl leading-[1.35] text-slate-900 transition-all group-hover:bg-clip-text group-hover:text-transparent dark:text-zinc-100 ${foodApp.titleGradient}`}>
                                    {foodApp.name}
                                </h3>
                                <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                                    Fast access to restaurant wait-time views and filters.
                                </p>
                                <div className="mt-5 space-y-2 rounded-2xl border border-slate-200/80 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-zinc-900/45">
                                    {foodPreview.map((row) => (
                                        <div key={row.name} className="flex justify-between text-slate-700 dark:text-zinc-300">
                                            <span>{row.name}</span>
                                            <span>{row.minutes === null ? 'Loading...' : `~${row.minutes} min`}</span>
                                        </div>
                                    ))}
                                </div>
                                <span className="mt-5 inline-flex items-center text-sm font-semibold text-slate-600 transition-colors group-hover:text-cyan-700 dark:text-zinc-400 dark:group-hover:text-cyan-300">
                                    Open Food
                                    <span className="ml-1">→</span>
                                </span>
                            </Link>
                        )}
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        {plannerApp && (
                            <Link
                                href={plannerApp.href}
                                className="group rounded-3xl border border-slate-200/90 bg-white/65 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-amber-300/55 hover:shadow-[0_20px_50px_rgba(180,83,9,0.18)] dark:border-white/10 dark:bg-zinc-900/50 dark:hover:border-amber-400/35 dark:hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)]"
                            >
                                <span className={`inline-flex size-11 items-center justify-center rounded-xl ring-1 shadow-sm ${plannerApp.accent}`}>
                                    <Sparkles className="size-5" strokeWidth={2} />
                                </span>
                                <h3 className={`font-display mt-4 text-xl leading-[1.35] text-slate-900 transition-all group-hover:bg-clip-text group-hover:text-transparent dark:text-zinc-100 ${plannerApp.titleGradient}`}>
                                    {plannerApp.name}
                                </h3>
                                <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                                    {plannerApp.description}
                                </p>
                                <span className="mt-5 inline-flex items-center text-sm font-semibold text-slate-600 transition-colors group-hover:text-amber-700 dark:text-zinc-400 dark:group-hover:text-amber-300">
                                    Open Planner
                                    <span className="ml-1">→</span>
                                </span>
                            </Link>
                        )}

                        {eventApp && (
                            <Link
                                href={eventApp.href}
                                className="group rounded-3xl border border-slate-200/90 bg-white/65 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-cyan-300/55 hover:shadow-[0_20px_50px_rgba(14,116,144,0.18)] dark:border-white/10 dark:bg-zinc-900/50 dark:hover:border-cyan-400/35 dark:hover:shadow-[0_20px_50px_rgba(20,184,166,0.15)]"
                            >
                                <span className={`inline-flex size-11 items-center justify-center rounded-xl ring-1 shadow-sm ${eventApp.accent}`}>
                                    <CalendarDays className="size-5" strokeWidth={2} />
                                </span>
                                <h3 className={`font-display mt-4 text-xl leading-[1.35] text-slate-900 transition-all group-hover:bg-clip-text group-hover:text-transparent dark:text-zinc-100 ${eventApp.titleGradient}`}>
                                    {eventApp.name}
                                </h3>
                                <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                                    {eventApp.description}
                                </p>
                                <span className="mt-5 inline-flex items-center text-sm font-semibold text-slate-600 transition-colors group-hover:text-cyan-700 dark:text-zinc-400 dark:group-hover:text-cyan-300">
                                    Open Calendar
                                    <span className="ml-1">→</span>
                                </span>
                            </Link>
                        )}
                    </div>

                    <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {lowerApps.map((app) => {
                            const Icon = app.icon;
                            return (
                                <li key={app.name} className="min-w-0">
                                    <Link
                                        href={app.href}
                                        className="group flex h-full min-h-[12.5rem] flex-col rounded-3xl border border-slate-200/90 bg-white/65 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.10)] outline-none backdrop-blur-xl transition-[transform,border-color,box-shadow,background] duration-200 hover:-translate-y-0.5 hover:border-cyan-300/55 hover:bg-white/75 hover:shadow-[0_20px_50px_rgba(14,116,144,0.18)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:transform-none dark:border-white/10 dark:bg-zinc-900/50 dark:hover:border-cyan-400/35 dark:hover:bg-zinc-900/65 dark:hover:shadow-[0_20px_50px_rgba(20,184,166,0.15)] focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:focus-visible:ring-cyan-400 dark:focus-visible:ring-offset-zinc-950"
                                    >
                                        <span
                                            className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 shadow-sm ${app.accent}`}
                                            aria-hidden
                                        >
                                            <Icon className="size-5" strokeWidth={2} />
                                        </span>
                                        <span className="mt-4 flex flex-1 flex-col gap-3 pb-1.5">
                                            <span className={`font-display pt-0.5 pb-1 text-base leading-[1.45] text-slate-900 transition-all group-hover:bg-clip-text group-hover:text-transparent dark:text-zinc-100 ${app.titleGradient}`}>
                                                {app.name}
                                            </span>
                                            <span className="text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                                                {app.description}
                                            </span>
                                        </span>
                                        <span className="mt-4 flex items-center text-sm font-semibold text-slate-600 transition-colors group-hover:text-cyan-700 dark:text-zinc-400 dark:group-hover:text-cyan-300">
                                            Open
                                            <span className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
                                                →
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </main>
        </div>
    );
}
