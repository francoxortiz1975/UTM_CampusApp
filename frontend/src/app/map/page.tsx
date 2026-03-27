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
        fill: 'rgba(16, 185, 129, 0.46)',
        stroke: 'rgba(236, 253, 245, 0.95)',
        text: '#052e16',
        dot: '#10b981',
    },
    yellow: {
        fill: 'rgba(250, 204, 21, 0.5)',
        stroke: 'rgba(254, 252, 232, 0.95)',
        text: '#713f12',
        dot: '#eab308',
    },
    red: {
        fill: 'rgba(248, 113, 113, 0.5)',
        stroke: 'rgba(255, 241, 242, 0.95)',
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
                                A clean campus diagram showing where our tracked buildings sit relative to one another.
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
                            className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-inner dark:border-zinc-700 dark:bg-zinc-950"
                            style={{
                                aspectRatio: `${MAP_VIEWBOX.width} / ${MAP_VIEWBOX.height}`,
                            }}
                        >
                            <svg
                                viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
                                className="absolute inset-0 h-full w-full"
                                aria-label="Interactive campus map"
                            >
                                <rect
                                    x="0"
                                    y="0"
                                    width={MAP_VIEWBOX.width}
                                    height={MAP_VIEWBOX.height}
                                    fill="#f5efe4"
                                />
                                <path
                                    d="M 40 92 L 170 42 L 1140 42 L 1160 190 L 1140 786 L 1012 860 L 238 860 L 92 786 L 64 236 Z"
                                    fill="#fbf8f2"
                                />
                                <path
                                    d="M 0 0 L 280 0 L 220 160 L 0 250 Z"
                                    fill="#dff3df"
                                />
                                <path
                                    d="M 930 0 L 1200 0 L 1200 360 L 1060 310 L 990 204 Z"
                                    fill="#dff3df"
                                />
                                <path
                                    d="M 998 570 L 1200 530 L 1200 900 L 1010 900 L 972 822 Z"
                                    fill="#dff3df"
                                />
                                <path
                                    d="M 0 632 L 198 710 L 252 900 L 0 900 Z"
                                    fill="#dff3df"
                                />
                                <path
                                    d="M 170 70 C 250 132, 282 198, 310 300 C 336 390, 410 506, 516 628 C 598 724, 718 804, 958 822"
                                    fill="none"
                                    stroke="#b2bbc7"
                                    strokeWidth="24"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M 542 74 C 760 76, 936 92, 1074 130"
                                    fill="none"
                                    stroke="#b2bbc7"
                                    strokeWidth="18"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M 790 214 L 750 660"
                                    fill="none"
                                    stroke="#b2bbc7"
                                    strokeWidth="18"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M 480 790 C 604 760, 784 748, 1018 784"
                                    fill="none"
                                    stroke="#b2bbc7"
                                    strokeWidth="18"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M 380 274 C 474 246, 618 222, 770 228"
                                    fill="none"
                                    stroke="#c4ccd6"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                />
                                <rect
                                    x="438"
                                    y="234"
                                    width="176"
                                    height="118"
                                    rx="12"
                                    fill="#d4e7c6"
                                    stroke="#b7d0a5"
                                    strokeWidth="4"
                                />
                                <rect
                                    x="965"
                                    y="204"
                                    width="90"
                                    height="148"
                                    rx="12"
                                    fill="#d4e7c6"
                                    stroke="#b7d0a5"
                                    strokeWidth="4"
                                />
                                <rect
                                    x="1038"
                                    y="632"
                                    width="98"
                                    height="170"
                                    rx="12"
                                    fill="#d4e7c6"
                                    stroke="#b7d0a5"
                                    strokeWidth="4"
                                />
                                <ellipse
                                    cx="640"
                                    cy="878"
                                    rx="98"
                                    ry="34"
                                    fill="#bfe3f2"
                                    stroke="#96c8df"
                                    strokeWidth="4"
                                />
                                <text
                                    x="270"
                                    y="430"
                                    fill="#7c8797"
                                    fontSize="26"
                                    fontWeight="700"
                                    transform="rotate(63 270 430)"
                                >
                                    Residence Rd
                                </text>
                                <text
                                    x="586"
                                    y="94"
                                    fill="#7c8797"
                                    fontSize="24"
                                    fontWeight="700"
                                >
                                    Outer Cir
                                </text>
                                <text
                                    x="778"
                                    y="450"
                                    fill="#7c8797"
                                    fontSize="22"
                                    fontWeight="700"
                                    transform="rotate(89 778 450)"
                                >
                                    Middle Rd
                                </text>
                                <text
                                    x="690"
                                    y="760"
                                    fill="#7c8797"
                                    fontSize="24"
                                    fontWeight="700"
                                >
                                    Inner Cir Rd
                                </text>

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
                                            aria-label={`Show ${building.name}`}
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
                                                strokeWidth={isSelected ? 5 : 3}
                                                style={{
                                                    filter: isSelected
                                                        ? 'drop-shadow(0 0 14px rgba(15, 23, 42, 0.35))'
                                                        : 'drop-shadow(0 0 10px rgba(15, 23, 42, 0.18))',
                                                }}
                                            />
                                            <BuildingLabel
                                                label={building.label}
                                                x={building.polygon.labelX}
                                                y={building.polygon.labelY}
                                                width={building.polygon.labelWidth}
                                                textColor={palette.text}
                                                dotColor={palette.dot}
                                                fontSize={isSelected ? 22 : 19}
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
                                <MapPinned className="size-5 text-slate-700 dark:text-zinc-200" />
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
            </main>
        </div>
    );
}
