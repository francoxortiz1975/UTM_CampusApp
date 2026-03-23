'use client';

import { ReactNode, useEffect, useId, useRef } from 'react';
import { btnPrimary, btnSecondary, focusRing } from '../lib/ui-classes';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  onSubmit?: () => void | Promise<void>;
  submitLabel?: string;
  primaryButtonText?: string;
  primaryButtonOnClick?: () => void;
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel,
  primaryButtonText,
  primaryButtonOnClick,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const handlePrimaryAction = async () => {
    if (primaryButtonOnClick) {
      primaryButtonOnClick();
      return;
    }

    if (onSubmit) {
      try {
        await onSubmit();
      } finally {
        onClose();
      }
      return;
    }

    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    const t = window.setTimeout(() => {
      const root = panelRef.current;
      const focusable = root?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 0);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      window.clearTimeout(t);
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className={`absolute inset-0 bg-[var(--fg)]/40 ${focusRing}`}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className="relative z-10 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface-card)] p-6 shadow-lg"
      >
        {title && (
          <h2 id={titleId} className="mb-4 text-lg font-semibold text-[var(--fg)]">
            {title}
          </h2>
        )}

        {children}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Close
          </button>
          <button type="button" onClick={handlePrimaryAction} className={btnPrimary}>
            {primaryButtonText ?? submitLabel ?? 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
