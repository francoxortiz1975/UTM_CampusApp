'use client';

import type { ReactNode } from 'react';
import Header from './Header';
import { pageBackground } from '../lib/ui-classes';

type AuthPageLayoutProps = {
  children: ReactNode;
};

/** Centered auth card with shared chrome (header + full-height main). */
export default function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className={pageBackground}>
      <Header />
      <main
        id="main-content"
        className="mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-md flex-col justify-center px-4 py-10 sm:px-6"
      >
        {children}
      </main>
    </div>
  );
}
