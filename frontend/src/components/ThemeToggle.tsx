'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { focusRing } from '../lib/ui-classes';
import type { ThemePreference } from '../lib/theme';

const options: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light theme', Icon: Sun },
  { value: 'dark', label: 'Dark theme', Icon: Moon },
  { value: 'system', label: 'Use system theme', Icon: Monitor },
];

export default function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-page)] p-1"
    >
      {options.map(({ value, label, Icon }) => {
        const selected = preference === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPreference(value)}
            aria-pressed={selected}
            aria-label={label}
            title={label}
            className={`rounded-md p-2 motion-safe:transition-colors ${focusRing} ${
              selected
                ? 'bg-[var(--surface-card)] text-[var(--fg)] shadow-sm'
                : 'text-[var(--fg-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--fg)]'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
