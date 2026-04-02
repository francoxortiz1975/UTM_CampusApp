'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    const applyStoredOrSystem = () => {
      const t = localStorage.getItem('theme');
      const isDark =
        t === 'dark' ||
        (t !== 'light' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
      setDark(isDark);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'theme') return;
      applyStoredOrSystem();
    };

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onOsTheme = () => {
      const t = localStorage.getItem('theme');
      if (t === 'light' || t === 'dark') return;
      document.documentElement.classList.toggle('dark', mq.matches);
      setDark(mq.matches);
    };

    window.addEventListener('storage', onStorage);
    mq.addEventListener('change', onOsTheme);
    return () => {
      window.removeEventListener('storage', onStorage);
      mq.removeEventListener('change', onOsTheme);
    };
  }, []);

  const toggle = () => {
    const nextDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', nextDark);
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
    setDark(nextDark);
  };

  const buttonClass =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200/45 bg-blue-300/15 text-white backdrop-blur-sm hover:border-blue-100/60 hover:bg-blue-300/25 dark:border-blue-200/35 dark:bg-blue-300/10 dark:hover:bg-blue-300/20';

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={buttonClass}
        disabled
      >
        <span className="h-5 w-5" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={buttonClass}
    >
      {dark ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
    </button>
  );
}
