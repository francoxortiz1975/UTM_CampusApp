/** Shared Tailwind class strings for consistent, accessible UI. */

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]';

export const btnPrimary =
  `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-[var(--primary-fg)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] ${focusRing} disabled:pointer-events-none disabled:opacity-50 motion-safe:transition-colors`;

export const btnSecondary =
  `inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-4 py-2.5 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted-pressed)] ${focusRing}`;

export const btnGhost =
  `inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--surface-muted)] ${focusRing}`;

export const inputBase =
  `w-full rounded-lg border border-[var(--border)] bg-[var(--surface-card)] px-3 py-2 text-[var(--fg)] placeholder:text-[var(--fg-muted)] ${focusRing}`;

export const cardSurface =
  'rounded-xl border border-[var(--border)] bg-[var(--surface-card)] shadow-sm';

export const pageBackground = 'min-h-screen bg-[var(--surface-page)] text-[var(--fg)]';

export const pageSection = 'mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8';
