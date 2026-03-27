'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Compass, LoaderCircle, MapPinned, Navigation } from 'lucide-react';
import Header from '../../components/Header';
import {
    buildFallbackStatus,
    loadAllBuildingStatuses,
    type MapBuildingStatus,
    type MapResourceSnapshot,
} from './mapAvailability';
import { MAP_BUILDINGS, MAP_EMBED_SRC } from './mapData';

type Tone = MapBuildingStatus['tone'];

const overlayToneClasses: Record<Tone, string> = {
    green:
        'border-emerald-50/90 bg-emerald-400/70 text-emerald-950 shadow-emerald-950/20 hover:bg-emerald-300/75',
    yellow:
        'border-amber-50/90 bg-amber-300/75 text-amber-950 shadow-amber-950/20 hover:bg-amber-200/80',
    red:
        'border-rose-50/90 bg-rose-400/75 text-rose-950 shadow-rose-950/20 hover:bg-rose-300/80',
};

const pillToneClasses: Record<Tone, string> = {
    green:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200',
    yellow:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200',
    red:
        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200',
};

function toneFromScore(score: number): Tone {
    if (score <= 34) return 'green';
    if (score <= 64) return 'yellow';
    return 'red';
}

function ResourceSection({
    title,
    items,
}: {
    title: string;
    items: MapResourceSnapshot[];
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/80">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</p>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {items.length} tracked
                </span>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {items.map((item) => {
                    const tone = toneFromScore(item.score);
                    return (
                        <div
                            key={`${item.kind}-${item.id}`}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                        >
                            <span className="min-w-0 text-sm text-gray-700 dark:text-zinc-200">
                                {item.name}
                            </span>
                            <span
                                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${pillToneClasses[tone]}`}
                            >
                                {item.displayValue}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function MapPage() {
    const [selectedId, setSelectedId] = useState<string>(MAP_BUILDINGS[0].id);
    const [statuses, setStatuses] = useState<Record<string, MapBuildingStatus>>(() =>
        Object.fromEntries(
            MAP_BUILDINGS.map((building) => [building.id, buildFallbackStatus(building)])
        )
    );
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    const selectedBuilding = useMemo(
        () => MAP_BUILDINGS.find((building) => building.id === selectedId) ?? MAP_BUILDINGS[0],
        [selectedId]
    );

    const selectedStatus =
        statuses[selectedBuilding.id] ?? buildFallbackStatus(selectedBuilding);

    const selectedResourceCount =
        selectedStatus.resources.food.length +
        selectedStatus.resources.gym.length +
        selectedStatus.resources.parking.length;

    const sections = [
        { title: 'Food venues', items: selectedStatus.resources.food },
        { title: 'Gym facilities', items: selectedStatus.resources.gym },
        { title: 'Parking', items: selectedStatus.resources.parking },
    ].filter((section) => section.items.length > 0);

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff6ea,transparent_30%),radial-gradient(circle_at_bottom_right,#dbeafe,transparent_26%),linear-gradient(to_bottom,#f8fafc,#eef2ff)] dark:bg-[radial-gradient(circle_at_top,#261d11,transparent_30%),radial-gradient(circle_at_bottom_right,#172554,transparent_25%),linear-gradient(to_bottom,#09090b,#18181b)]">
            <Header />

            <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
                <section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
                    <div className="overflow-hidden rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-zinc-700/70 dark:bg-zinc-900/80 dark:shadow-black/30">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="max-w-3xl">
                                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600 dark:text-rose-300">
                                    Interactive campus map
                                </p>
                                <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
                                    UTM busyness at the building level
                                </h1>
                                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-zinc-300">
                                    The aerial view below uses our own overlays and current
                                    dashboard estimates to show which tracked buildings look
                                    quiet, moderate, or busy right now.
                                </p>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                                {isRefreshing ? (
                                    <LoaderCircle className="size-4 animate-spin" />
                                ) : (
                                    <Compass className="size-4" />
                                )}
                                {isRefreshing ? 'Refreshing live estimates' : 'Click a building to inspect it'}
                            </div>
                        </div>

                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f3efe5_0%,#ece6d5_100%)] p-4 dark:border-zinc-700 dark:bg-[linear-gradient(180deg,#27272a_0%,#18181b_100%)]">
                            <div className="relative min-h-[560px] overflow-hidden rounded-[22px] border border-white/80 shadow-inner dark:border-zinc-700">
                                <iframe
                                    title="University of Toronto Mississauga satellite map"
                                    src={MAP_EMBED_SRC}
                                    loading="lazy"
                                    className="pointer-events-none absolute inset-0 h-full w-full border-0 saturate-[1.12] contrast-110"
                                />
                                <div className="absolute inset-0 bg-slate-950/14 dark:bg-black/36" />

                                <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
                                    {[
                                        ['Quiet', 'green'],
                                        ['Moderate', 'yellow'],
                                        ['Busy', 'red'],
                                    ].map(([label, tone]) => (
                                        <span
                                            key={label}
                                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${pillToneClasses[tone as Tone]}`}
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </div>

                                <div className="absolute right-4 top-4 z-20 max-w-xs rounded-2xl border border-white/80 bg-white/88 px-4 py-3 text-xs leading-5 text-slate-700 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/88 dark:text-zinc-200">
                                    The Google satellite view is used as a fixed visual
                                    reference. Our overlays provide the interaction and the
                                    building colors are computed from current tracked services.
                                </div>

                                {MAP_BUILDINGS.map((building) => {
                                    const status =
                                        statuses[building.id] ?? buildFallbackStatus(building);
                                    const isSelected = building.id === selectedBuilding.id;

                                    return (
                                        <button
                                            key={building.id}
                                            type="button"
                                            onClick={() => setSelectedId(building.id)}
                                            className={`absolute z-10 overflow-hidden border text-left shadow-xl transition duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 ${overlayToneClasses[status.tone]} ${
                                                isSelected
                                                    ? 'ring-2 ring-white/95 dark:ring-zinc-100'
                                                    : ''
                                            }`}
                                            style={{
                                                left: `${building.position.left}%`,
                                                top: `${building.position.top}%`,
                                                width: `${building.position.width}%`,
                                                height: `${building.position.height}%`,
                                                clipPath: building.position.clipPath,
                                            }}
                                        >
                                            <div className="flex h-full flex-col justify-between p-3 backdrop-blur-[1px]">
                                                <div className="flex items-start justify-between gap-3">
                                                    <span className="text-xl font-black tracking-[0.18em]">
                                                        {building.label}
                                                    </span>
                                                    <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-900">
                                                        {status.label}
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                                                        Avg busyness
                                                    </p>
                                                    <p className="text-lg font-bold">
                                                        {Math.round(status.score)}%
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}

                                <div className="absolute bottom-4 left-4 z-20 rounded-full border border-white/80 bg-white/88 px-4 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/88 dark:text-zinc-200">
                                    UTM satellite reference • overlays are fixed for demo
                                    stability
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="flex flex-col gap-4 rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-zinc-700/70 dark:bg-zinc-900/85 dark:shadow-black/30">
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

                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${pillToneClasses[selectedStatus.tone]}`}
                            >
                                {selectedStatus.label}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                                {Math.round(selectedStatus.score)}% avg busyness
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                                {selectedResourceCount} tracked resources
                            </span>
                        </div>

                        <p className="text-sm leading-6 text-gray-600 dark:text-zinc-300">
                            {selectedBuilding.description}
                        </p>

                        {sections.map((section) => (
                            <ResourceSection
                                key={section.title}
                                title={section.title}
                                items={section.items}
                            />
                        ))}

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/80">
                            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                                Open detailed views
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {selectedBuilding.links.map((link) => (
                                    <Link
                                        key={`${selectedBuilding.id}-${link.href}`}
                                        href={link.href}
                                        className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                                    >
                                        {link.label}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-dashed border-slate-300 p-4 dark:border-zinc-700">
                            <div className="flex items-start gap-2">
                                <Navigation className="mt-0.5 size-4 shrink-0 text-slate-500 dark:text-zinc-400" />
                                <p className="text-sm leading-6 text-gray-600 dark:text-zinc-300">
                                    If live backend values are unavailable, this map falls back
                                    to the current hardcoded estimates from the existing pages
                                    so the demo stays stable.
                                </p>
                            </div>
                        </div>
                    </aside>
                </section>

                <section className="grid gap-4 rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-lg shadow-slate-200/50 backdrop-blur dark:border-zinc-700/70 dark:bg-zinc-900/80 dark:shadow-black/20 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/70">
                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            Food buildings
                        </p>
                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-300">
                            Wait times are converted into a busy score, so long food lines push
                            a building toward yellow or red.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/70">
                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            RAWC
                        </p>
                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-300">
                            Gym spaces already expose capacity estimates, so the map can use
                            those percentages directly.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/70">
                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                            CCT
                        </p>
                        <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-zinc-300">
                            The CCT building combines one tracked cafe with CCT Garage, making
                            it a useful mixed resource example for the presentation.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
