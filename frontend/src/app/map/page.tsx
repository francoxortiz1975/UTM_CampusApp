'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, LoaderCircle, MapPinned } from 'lucide-react';
import Header from '../../components/Header';
import {
    buildFallbackStatus,
    loadAllBuildingStatuses,
    type MapBuildingStatus,
    type MapResourceSnapshot,
} from './mapAvailability';
import { MAP_BUILDINGS, MAP_VIEWBOX } from './mapData';

type Tone = MapBuildingStatus['tone'];

const statusPillClasses: Record<Tone, string> = {
    green:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200',
    yellow:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200',
    red:
        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200',
};

const polygonPalette: Record<
    Tone,
    { fill: string; stroke: string; text: string; dot: string }
> = {
    green: {
        fill: 'rgba(16, 185, 129, 0.55)',
        stroke: 'rgba(5, 150, 105, 0.7)',
        text: '#052e16',
        dot: '#10b981',
    },
    yellow: {
        fill: 'rgba(250, 204, 21, 0.55)',
        stroke: 'rgba(202, 138, 4, 0.7)',
        text: '#713f12',
        dot: '#eab308',
    },
    red: {
        fill: 'rgba(248, 113, 113, 0.55)',
        stroke: 'rgba(225, 29, 72, 0.7)',
        text: '#881337',
        dot: '#f43f5e',
    },
};

function ResourceSection({
    title,
    items,
}: {
    title: string;
    items: MapResourceSnapshot[];
}) {
    if (items.length === 0) return null;

    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/80">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</p>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {items.length}
                </span>
            </div>
            <div className="space-y-2">
                {items.map((item) => (
                    <div
                        key={`${item.kind}-${item.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                    >
                        <span className="min-w-0 text-sm text-gray-700 dark:text-zinc-200">
                            {item.name}
                        </span>
                        <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            {item.displayValue}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function BuildingLabel({
    label,
    x,
    y,
    width,
    textColor,
    dotColor,
    fontSize,
}: {
    label: string;
    x: number;
    y: number;
    width?: number;
    textColor: string;
    dotColor: string;
    fontSize: number;
}) {
    const lines = label.split('\n');
    const lineHeight = fontSize + 6;
    const boxWidth = width ?? Math.max(...lines.map((line) => line.length)) * (fontSize * 0.72) + 28;
    const boxHeight = lines.length * lineHeight + 18;

    return (
        <g>
            <rect
                x={x - boxWidth / 2}
                y={y - boxHeight / 2}
                width={boxWidth}
                height={boxHeight}
                rx={18}
                fill="rgba(255,255,255,0.93)"
                stroke="rgba(255,255,255,0.96)"
                strokeWidth={2}
            />
            <circle
                cx={x - boxWidth / 2 + 16}
                cy={y}
                r={7}
                fill={dotColor}
                stroke="rgba(255,255,255,0.96)"
                strokeWidth={2}
            />
            <text
                x={x + 8}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={textColor}
                fontSize={fontSize}
                fontWeight={800}
                letterSpacing="0.08em"
                style={{ textTransform: 'uppercase' }}
            >
                {lines.map((line, index) => (
                    <tspan
                        key={`${label}-${index}`}
                        x={x + 8}
                        dy={index === 0 ? `${-(lines.length - 1) * 0.5}em` : '1.2em'}
                    >
                        {line}
                    </tspan>
                ))}
            </text>
        </g>
    );
}

export default function MapPage() {
    const [selectedId, setSelectedId] = useState<string>('student');
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
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff6ea,transparent_32%),radial-gradient(circle_at_bottom_right,#dbeafe,transparent_28%),linear-gradient(to_bottom,#f8fafc,#eef2ff)] dark:bg-[radial-gradient(circle_at_top,#261d11,transparent_30%),radial-gradient(circle_at_bottom_right,#172554,transparent_25%),linear-gradient(to_bottom,#09090b,#18181b)]">
            <Header />

            <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600 dark:text-rose-300">
                            Interactive campus map
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">
                            UTM campus activity at a glance
                        </h1>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                        {isRefreshing ? (
                            <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                            <MapPinned className="size-4" />
                        )}
                        {isRefreshing ? 'Refreshing live estimates' : 'Click a building'}
                    </div>
                </div>

                <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
                    <div className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-zinc-700/70 dark:bg-zinc-900/85 dark:shadow-black/30">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-slate-600 dark:text-zinc-300">
                                UTM campus &mdash; buildings placed from real GPS coordinates.
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                                {[
                                    ['Quiet', 'green'],
                                    ['Moderate', 'yellow'],
                                    ['Busy', 'red'],
                                ].map(([label, tone]) => (
                                    <span
                                        key={label}
                                        className={`rounded-full border px-3 py-1 ${statusPillClasses[tone as Tone]}`}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div
                            className="relative overflow-hidden rounded-[24px] border border-slate-200 shadow-inner dark:border-zinc-700"
                            style={{
                                aspectRatio: `${MAP_VIEWBOX.width} / ${MAP_VIEWBOX.height}`,
                            }}
                        >
                            <svg
                                viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
                                className="absolute inset-0 h-full w-full"
                                aria-label="Interactive campus map"
                            >
                                {/* ── Base ground ── */}
                                <rect width={MAP_VIEWBOX.width} height={MAP_VIEWBOX.height} className="fill-[#f0f0f0] dark:fill-[#1a1a2e]" />

                                {/* ── Campus area (subtle oval zone) ── */}
                                <ellipse cx="530" cy="450" rx="500" ry="400" className="fill-[#e8e8e8] dark:fill-[#252540]" opacity="0.5" />

                                {/* ── Building polygons + labels ── */}
                                {MAP_BUILDINGS.map((building) => {
                                    const status =
                                        statuses[building.id] ?? buildFallbackStatus(building);
                                    const palette = polygonPalette[status.tone];
                                    const isSelected = building.id === selectedBuilding.id;

                                    return (
                                        <g
                                            key={building.id}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`${building.name}, ${building.label}`}
                                            aria-pressed={isSelected}
                                            onClick={() => setSelectedId(building.id)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    setSelectedId(building.id);
                                                }
                                            }}
                                            className="cursor-pointer outline-none"
                                        >
                                            <polygon
                                                points={building.polygon.points}
                                                fill={palette.fill}
                                                stroke={isSelected ? '#ffffff' : palette.stroke}
                                                strokeWidth={isSelected ? 5 : 2.5}
                                                strokeLinejoin="round"
                                                style={{
                                                    filter: isSelected
                                                        ? 'drop-shadow(0 0 12px rgba(15, 23, 42, 0.35))'
                                                        : 'drop-shadow(0 2px 6px rgba(15, 23, 42, 0.15))',
                                                    transition: 'filter 0.2s, stroke-width 0.2s',
                                                }}
                                            />
                                            <BuildingLabel
                                                label={building.label}
                                                x={building.polygon.labelX}
                                                y={building.polygon.labelY}
                                                width={building.polygon.labelWidth}
                                                textColor={palette.text}
                                                dotColor={palette.dot}
                                                fontSize={building.polygon.labelFontSize ?? (isSelected ? 22 : 19)}
                                            />
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>

                    <aside className="flex flex-col gap-4 rounded-[30px] border border-white/70 bg-white/88 p-5 shadow-xl shadow-slate-200/60 backdrop-blur dark:border-zinc-700/70 dark:bg-zinc-900/88 dark:shadow-black/30">
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
                                <MapPinned className="size-5 text-slate-700 dark:text-zinc-200" aria-hidden />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${statusPillClasses[selectedStatus.tone]}`}
                            >
                                {selectedStatus.label}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                                {Math.round(selectedStatus.score)}% avg busy
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                                {selectedResourceCount} tracked
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
                    <Navigation className="size-4" aria-hidden />
                    This is a frontend scaffold only. Backend integration and richer campus
                    data can be layered on later this week.
                </div>
            </main>
        </div>
    );
}
