'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  readStoredTheme,
  resolveDark,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '../lib/theme';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyDom(preference: ThemePreference) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', resolveDark(preference));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    const stored = readStoredTheme();
    setPreferenceState(stored);
    applyDom(stored);
  }, []);

  useEffect(() => {
    applyDom(preference);
  }, [preference]);

  useEffect(() => {
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyDom('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [preference]);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    applyDom(value);
  }, []);

  const value = useMemo(
    () => ({ preference, setPreference }),
    [preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
