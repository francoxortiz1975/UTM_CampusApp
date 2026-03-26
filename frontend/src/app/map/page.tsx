'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Compass, MapPinned, Navigation } from 'lucide-react';
import Header from '../../components/Header';

type Building = {
    id: string;
    label: string;
    name: string;
    description: string;
    contents: string[];
    links: { label: string; href: string }[];
    position: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
    accent: string;
};

const buildings: Building[] = [
    {
        id: 'ib',
        label: 'IB',
        name: 'Instructional Building',
        description:
            'A central academic building with study space and food options that students pass through throughout the day.',
        contents: ['Harvey’s', 'Second Cup Café', 'Classrooms', 'Study seating'],
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Events', href: '/events' },
        ],
        position: { left: 12, top: 20, width: 18, height: 14 },
        accent: 'bg-amber-200 text-amber-950 ring-amber-300',
    },
    {
        id: 'dv',
        label: 'DV',
        name: 'Deerfield Hall',
        description:
            'A busy lecture and student traffic building that is useful as a navigation anchor for nearby food and study areas.',
        contents: ['Subway', 'Lecture rooms', 'Student services', 'Study nooks'],
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Parking', href: '/parking' },
        ],
        position: { left: 38, top: 16, width: 16, height: 12 },
        accent: 'bg-blue-200 text-blue-950 ring-blue-300',
    },
    {
        id: 'dh',
        label: 'DH',
        name: 'Davis Building',
        description:
            'A major classroom building that helps connect the academic side of campus with student amenities.',
        contents: ['Starbucks', 'Classrooms', 'Labs', 'Meeting space'],
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Events', href: '/events' },
        ],
        position: { left: 60, top: 28, width: 18, height: 13 },
        accent: 'bg-emerald-200 text-emerald-950 ring-emerald-300',
    },
    {
        id: 'kn',
        label: 'KN',
        name: 'Kaneff Centre',
        description:
            'A recognizable hub near food and common student traffic, useful for quickly orienting users on the map.',
        contents: ['Starbucks', 'Subway', 'Campus walkways', 'Student gathering space'],
        links: [
            { label: 'Open Food', href: '/food' },
            { label: 'Open Parking', href: '/parking' },
        ],
        position: { left: 24, top: 52, width: 18, height: 14 },
        accent: 'bg-violet-200 text-violet-950 ring-violet-300',
    },
    {
        id: 'rawc',
        label: 'RAWC',
        name: 'Recreation, Athletics and Wellness Centre',
        description:
            'The main athletics destination on campus, making it a natural anchor for capacity and activity exploration.',
        contents: ['Gym', 'Fitness areas', 'Courts', 'Locker rooms'],
        links: [
            { label: 'Open Gym', href: '/gym' },
            { label: 'Open Parking', href: '/parking' },
        ],
        position: { left: 58, top: 56, width: 22, height: 16 },
        accent: 'bg-rose-200 text-rose-950 ring-rose-300',
    },
];

export default function MapPage() {
    const [selectedId, setSelectedId] = useState<string>(buildings[0].id);

    const selectedBuilding = useMemo(
        () => buildings.find((building) => building.id === selectedId) ?? buildings[0],
        [selectedId]
    );

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff6ea,transparent_35%),radial-gradient(circle_at_bottom_right,#dbeafe,transparent_30%),linear-gradient(to_bottom,#f8fafc,#eef2ff)] dark:bg-[radial-gradient(circle_at_top,#2a2114,transparent_35%),radial-gradient(circle_at_bottom_right,#172554,transparent_30%),linear-gradient(to_bottom,#09090b,#18181b)]">
            <Header />

            <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
                <section className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
                    <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-zinc-700/70 dark:bg-zinc-900/80 dark:shadow-black/30">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600 dark:text-rose-300">
                                    SCRUM-53 scaffold
                                </p>
                                <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
                                    Interactive campus map
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-zinc-300">
                                    This first pass gives us a clickable 2D campus view with
                                    key buildings, quick context, and direct links into the
                                    existing dashboard pages.
                                </p>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                                <Compass className="size-4" />
                                Click a building to inspect it
                            </div>
                        </div>

                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f4f1ea_0%,#efeadd_100%)] p-4 dark:border-zinc-700 dark:bg-[linear-gradient(180deg,#27272a_0%,#18181b_100%)]">
                            <div className="relative min-h-[440px] overflow-hidden rounded-[20px] border border-white/80 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.9),transparent_18%),linear-gradient(135deg,#cbd5e1_0%,#e2e8f0_40%,#bfdbfe_100%)] shadow-inner dark:border-zinc-600 dark:bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.06),transparent_18%),linear-gradient(135deg,#1f2937_0%,#111827_45%,#172554_100%)]">
                                <div className="absolute inset-x-[7%] top-[9%] h-[12%] rounded-full border border-white/50 bg-white/20 dark:border-zinc-500/60 dark:bg-white/5" />
                                <div className="absolute inset-x-[10%] top-[39%] h-[7%] rounded-full border border-white/40 bg-white/15 dark:border-zinc-500/50 dark:bg-white/5" />
                                <div className="absolute left-[45%] top-[8%] h-[78%] w-[8%] rounded-full border border-white/40 bg-white/20 dark:border-zinc-500/50 dark:bg-white/5" />
                                <div className="absolute left-[12%] top-[74%] h-[10%] w-[76%] rounded-full border border-white/40 bg-white/15 dark:border-zinc-500/50 dark:bg-white/5" />

                                {buildings.map((building) => {
                                    const isSelected = building.id === selectedBuilding.id;

                                    return (
                                        <button
                                            key={building.id}
                                            type="button"
                                            onClick={() => setSelectedId(building.id)}
                                            className={`absolute rounded-2xl border px-3 py-2 text-left shadow-lg transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 dark:focus:ring-offset-zinc-900 ${
                                                isSelected
                                                    ? 'border-gray-900 ring-2 ring-gray-900/20 dark:border-white dark:ring-white/20'
                                                    : 'border-transparent'
                                            } ${building.accent}`}
                                            style={{
                                                left: `${building.position.left}%`,
                                                top: `${building.position.top}%`,
                                                width: `${building.position.width}%`,
                                                height: `${building.position.height}%`,
                                            }}
                                        >
                                            <span className="block text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                                                Building
                                            </span>
                                            <span className="mt-1 block text-lg font-bold">
                                                {building.label}
                                            </span>
                                        </button>
                                    );
                                })}

                                <div className="absolute bottom-4 left-4 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-200">
                                    Prototype campus layout for Sprint 3 exploration
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-zinc-700/70 dark:bg-zinc-900/85 dark:shadow-black/30">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-400">
                                    Selected building
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-gray-900 dark:text-zinc-50">
                                    {selectedBuilding.name}
                                </h2>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
                                <MapPinned className="size-5 text-slate-700 dark:text-zinc-200" />
                            </div>
                        </div>

                        <p className="text-sm leading-6 text-gray-600 dark:text-zinc-300">
                            {selectedBuilding.description}
                        </p>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/80">
                            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                Contents and services
                            </p>
                            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-zinc-300">
                                {selectedBuilding.contents.map((item) => (
                                    <li key={item} className="flex items-start gap-2">
                                        <span className="mt-1 size-2 rounded-full bg-rose-500" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/80">
                            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                Quick links
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {selectedBuilding.links.map((link) => (
                                    <Link
                                        key={link.href + link.label}
                                        href={link.href}
                                        className="inline-flex items-center rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-dashed border-slate-300 p-4 dark:border-zinc-700">
                            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                Next sprint-friendly extensions
                            </p>
                            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-zinc-300">
                                <li>Search for buildings directly from the map.</li>
                                <li>Hook buildings into live backend availability data.</li>
                                <li>Add zoom and pan once the layout is finalized.</li>
                            </ul>
                        </div>
                    </aside>
                </section>

                <section className="grid gap-4 rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-lg shadow-slate-200/50 backdrop-blur dark:border-zinc-700/70 dark:bg-zinc-900/80 dark:shadow-black/20 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/70">
                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            Why this placeholder is useful
                        </p>
                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-300">
                            It gives the team a visible map route, a stable building data
                            shape, and a UI surface to iterate on without waiting on backend
                            dependencies.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/70">
                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            Building labels included
                        </p>
                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-300">
                            IB, DV, DH, KN, and RAWC are all clickable so the story already
                            demonstrates the intended interaction model.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/70">
                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            Existing feature integration
                        </p>
                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-300">
                            Each selected building points users back into food, gym, parking,
                            or events so this feature already fits the rest of the dashboard.
                        </p>
                    </div>
                </section>

                <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-300">
                    <Navigation className="size-4" />
                    This is a frontend scaffold only. Backend integration and richer campus
                    data can be layered on later this week.
                </div>
            </main>
        </div>
    );
}
