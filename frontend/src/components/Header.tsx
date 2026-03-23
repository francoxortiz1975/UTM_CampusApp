'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Profile, Logout } from '../types/Authentication';
import { useState, useEffect } from 'react';
import type { User } from '../types/Authentication';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { btnGhost, btnPrimary, focusRing } from '../lib/ui-classes';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const currUser = await Profile();
      setUser(currUser);
      setLoading(false);
    }
    fetchUser();
  }, []);

  const goToHomePage = () => {
    router.push('/');
  };

  const handleLogout = async () => {
    await Logout();
    setUser(null);
  };

  if (loading) {
    return (
      <header
        className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface-card)]"
        role="banner"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <span className="h-4 w-32 animate-pulse rounded bg-[var(--surface-muted)]" />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <span className="h-9 w-24 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
          </div>
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          Loading header
        </span>
      </header>
    );
  }

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface-card)] shadow-sm"
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {pathname !== '/' && (
            <button
              type="button"
              onClick={goToHomePage}
              className={btnGhost}
            >
              <span aria-hidden="true">←</span>
              <span>Back to home</span>
            </button>
          )}

          <Link
            href="/"
            className={`truncate text-lg font-bold text-[var(--fg)] sm:text-xl ${focusRing} rounded-md`}
          >
            Campus Dashboard
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <nav aria-label="Account" className="flex items-center gap-2">
            {user == null ? (
              <button
                type="button"
                onClick={() => router.push('/signin')}
                className={btnPrimary}
              >
                Sign in
              </button>
            ) : (
              <button type="button" onClick={handleLogout} className={btnPrimary}>
                Sign out
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
