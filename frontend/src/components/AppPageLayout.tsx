'use client';

import type { ReactNode } from 'react';
import Header from './Header';
import { pageBackground } from '../lib/ui-classes';

const contentMaxClass = {
  sm: 'max-w-4xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
} as const;

export type AppContentMax = keyof typeof contentMaxClass;

export function PageIntro({
  eyebrow = 'Campus dashboard',
  title,
  description,
  className = '',
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`max-w-2xl ${className}`.trim()}>
      {eyebrow ? (
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--fg-muted)]">{eyebrow}</p>
      ) : null}
      <h1 className="mt-1 text-balance text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
        {title}
      </h1>
      {description != null && description !== '' ? (
        <div className="mt-3 text-pretty text-base text-[var(--fg-muted)] sm:text-lg">{description}</div>
      ) : null}
    </header>
  );
}

type AppPageLayoutProps = {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  /** Max width of the main column (default wide `lg` = 6xl) */
  contentMax?: AppContentMax;
  /** Extra classes on `<main>` */
  mainClassName?: string;
  /** When true, skip the intro header (use for custom headers inside children) */
  hideIntro?: boolean;
  children: ReactNode;
};

export default function AppPageLayout({
  title,
  description,
  eyebrow,
  contentMax = 'lg',
  mainClassName = '',
  hideIntro = false,
  children,
}: AppPageLayoutProps) {
  return (
    <div className={pageBackground}>
      <Header />
      <main
        id="main-content"
        className={`mx-auto w-full px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8 ${contentMaxClass[contentMax]} ${mainClassName}`.trim()}
      >
        {!hideIntro ? (
          <PageIntro eyebrow={eyebrow} title={title} description={description} className="mb-8" />
        ) : null}
        {children}
      </main>
    </div>
  );
}
