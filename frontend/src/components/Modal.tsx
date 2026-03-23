'use client';

import { ReactNode } from 'react';

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
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        {title && <h2 className="mb-4 text-lg font-semibold text-black">{title}</h2>}

        {children}

        <div className="mt-6 flex justify-between">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-black hover:bg-gray-200"
          >
            Close
          </button>
          <button
            onClick={handlePrimaryAction}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700"
          >
            {primaryButtonText ?? submitLabel ?? 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
