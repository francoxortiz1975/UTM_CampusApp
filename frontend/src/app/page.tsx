import Link from 'next/link';
import { CalendarDays, Car, Dumbbell, Map, PackageOpen, Sparkles, Utensils } from 'lucide-react';
import Header from '../components/Header';

const apps = [
    {
        name: 'Food Availability',
        description: 'See which cafeterias are open and typical wait times.',
        href: '/food',
        icon: Utensils,
        accent:
            'bg-amber-100 text-amber-800 ring-amber-200/80 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-800/50',
    },
    {
        name: 'Gym Availability',
        description: 'Check gym occupancy and plan your workout.',
        href: '/gym',
        icon: Dumbbell,
        accent:
            'bg-emerald-100 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800/50',
    },
    {
        name: 'Parking Availability',
        description: 'Find lots with space before you arrive.',
        href: '/parking',
        icon: Car,
        accent:
            'bg-blue-100 text-blue-800 ring-blue-200/80 dark:bg-blue-950/60 dark:text-blue-200 dark:ring-blue-800/50',
    },
    {
        name: 'Event Calendar',
        description: 'View upcoming club events on campus.',
        href: '/events',
        icon: CalendarDays,
        accent:
            'bg-violet-100 text-violet-800 ring-violet-200/80 dark:bg-violet-950/60 dark:text-violet-200 dark:ring-violet-800/50',
    },
    {
        name: 'Interactive Map',
        description: 'Explore key campus buildings and jump to services inside them.',
        href: '/map',
        icon: Map,
        accent:
            'bg-rose-100 text-rose-800 ring-rose-200/80 dark:bg-rose-950/60 dark:text-rose-200 dark:ring-rose-800/50',
    },
    {
        name: 'Lost And Found',
        description: 'See what others have lost/found on campus',
        href: '/lostandfound',
        icon: PackageOpen,
        accent:
            'bg-amber-100 text-amber-800 ring-amber-200/80 dark:bg-amber-950/60 dark:text-amber-200 dark:ring-amber-800/50',
    },
    {
        name: 'Day Planner',
        description: 'Upload your calendar and generate a campus plan around classes, food, and gym time.',
        href: '/planner',
        icon: Sparkles,
        accent:
            'bg-cyan-100 text-cyan-800 ring-cyan-200/80 dark:bg-cyan-950/60 dark:text-cyan-200 dark:ring-cyan-800/50',
    },
] as const;

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            <Header />

            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 dark:focus:bg-zinc-900 dark:focus:text-zinc-100 dark:focus:ring-offset-zinc-950"
            >
                Skip to main content
            </a>

            <main id="main-content" className="px-4 pb-20 pt-10 sm:px-6 lg:px-8">
                <header className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                        Campus dashboard
                    </p>
                    <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-zinc-50">
                        Everything you need on campus
                    </h1>
                    <p className="mt-4 text-pretty text-lg leading-relaxed text-gray-600 sm:text-xl dark:text-zinc-400">
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
                        className="mb-6 text-center text-lg font-semibold text-gray-900 dark:text-zinc-100"
                    >
                        Choose a service
                    </h2>
                    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                        {apps.map((app) => {
                            const Icon = app.icon;
                            return (
                                <li key={app.name} className="min-w-0">
                                    <Link
                                        href={app.href}
                                        className="group flex h-full min-h-[11rem] flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm outline-none transition-[border-color,box-shadow,transform] duration-200 hover:border-gray-300 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:transform-none dark:border-zinc-700 dark:bg-zinc-900/80 dark:hover:border-zinc-600 dark:hover:shadow-lg dark:hover:shadow-zinc-950/40 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-500 dark:focus-visible:ring-offset-zinc-950"
                                    >
                                        <span
                                            className={`inline-flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ${app.accent}`}
                                            aria-hidden
                                        >
                                            <Icon className="size-5" strokeWidth={2} />
                                        </span>
                                        <span className="mt-4 flex flex-1 flex-col gap-2">
                                            <span className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                                                {app.name}
                                            </span>
                                            <span className="text-sm leading-relaxed text-gray-600 dark:text-zinc-400">
                                                {app.description}
                                            </span>
                                        </span>
                                        <span className="mt-4 flex items-center text-sm font-semibold text-blue-700 dark:text-blue-400">
                                            Open
                                            <span
                                                className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                                                aria-hidden
                                            >
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
