import Link from 'next/link';
import {
  CalendarDays,
  CarFront,
  Dumbbell,
  UtensilsCrossed,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import Header from '../components/Header';
import { cardSurface, focusRing, pageBackground, pageSection } from '../lib/ui-classes';

type AppTile = {
  name: string;
  description: string;
  href: string;
  Icon: LucideIcon;
  /** Subtle icon tint — uses primary hue at low opacity for light/dark */
  accentClass: string;
};

export default function Home() {
  const apps: AppTile[] = [
    {
      name: 'Food',
      description: 'Wait times, hours, and venues across campus.',
      href: '/food',
      Icon: UtensilsCrossed,
      accentClass:
        'bg-[var(--primary)]/10 text-[var(--primary)] dark:bg-[var(--primary)]/20',
    },
    {
      name: 'Gym',
      description: 'Occupancy trends and reports for RAWC spaces.',
      href: '/gym',
      Icon: Dumbbell,
      accentClass:
        'bg-[var(--success)]/15 text-[var(--success)] dark:bg-[var(--success)]/20',
    },
    {
      name: 'Parking',
      description: 'Lot fullness estimates and rate information.',
      href: '/parking',
      Icon: CarFront,
      accentClass:
        'bg-[var(--warning)]/15 text-[var(--warning)] dark:bg-[var(--warning)]/25',
    },
    {
      name: 'Events',
      description: 'Club meetings and activities on the calendar.',
      href: '/events',
      Icon: CalendarDays,
      accentClass:
        'bg-[var(--danger)]/10 text-[var(--danger)] dark:bg-[var(--danger)]/20',
    },
  ];

  return (
    <div className={pageBackground}>
      <Header />

      <main id="main-content" className={`${pageSection} pb-16 pt-6 sm:pt-10`}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--fg-muted)]">
            Campus dashboard
          </p>
          <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
            What do you need today?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-[var(--fg-muted)] sm:text-lg">
            Jump to live food, gym, and parking info, or browse what&apos;s happening on campus.
          </p>
        </div>

        <section
          className="mx-auto mt-12 max-w-4xl"
          aria-labelledby="home-quick-links-heading"
        >
          <h2
            id="home-quick-links-heading"
            className="mb-4 text-center text-sm font-semibold text-[var(--fg)] sm:text-left"
          >
            Choose a destination
          </h2>

          <ul className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {apps.map((app) => {
              const Icon = app.Icon;
              return (
              <li key={app.href}>
                <Link
                  href={app.href}
                  className={`${cardSurface} group flex min-h-[7.5rem] gap-4 p-5 motion-safe:transition-[box-shadow,transform] motion-safe:duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md sm:min-h-[8rem] sm:p-6 ${focusRing}`}
                >
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-14 sm:w-14 ${app.accentClass}`}
                    aria-hidden
                  >
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} />
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col items-start text-left">
                    <span className="text-lg font-semibold text-[var(--fg)] sm:text-xl">
                      {app.name}
                    </span>
                    <span className="mt-1 text-sm leading-relaxed text-[var(--fg-muted)]">
                      {app.description}
                    </span>
                    <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-[var(--primary)]">
                      Open
                      <ArrowRight
                        className="h-4 w-4 motion-safe:transition-transform motion-safe:duration-200 group-hover:translate-x-0.5"
                        aria-hidden
                      />
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
