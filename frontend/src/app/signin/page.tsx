'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import AuthPageLayout from '../../components/AuthPageLayout';
import { Login } from '../../types/Authentication';
import { useRouter } from 'next/navigation';
import { btnPrimary, cardSurface, inputBase } from '../../lib/ui-classes';

export default function SignIn() {
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = await Login(email, password);
    if (user == null) {
      alert('Invalid credentials!');
      return;
    }
    router.push('/');
  };

  return (
    <AuthPageLayout>
      <div className={`${cardSurface} p-8`}>
        <p className="text-center text-xs font-medium uppercase tracking-wide text-[var(--fg-muted)]">
          Campus dashboard
        </p>
        <h1 className="mt-2 text-center text-2xl font-bold text-[var(--fg)] sm:text-3xl">
          Sign in
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--fg-muted)]">
          Use your campus account credentials.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor={emailId} className="mb-1.5 block text-sm font-medium text-[var(--fg)]">
              Email
            </label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputBase}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor={passwordId} className="mb-1.5 block text-sm font-medium text-[var(--fg)]">
              Password
            </label>
            <input
              id={passwordId}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputBase}
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className={`${btnPrimary} w-full`}>
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--fg-muted)]">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}
