'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import AuthPageLayout from '../../components/AuthPageLayout';
import { Signup, Login } from '../../types/Authentication';
import { useRouter } from 'next/navigation';
import { btnPrimary, cardSurface, inputBase } from '../../lib/ui-classes';

export default function SignUp() {
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    const newUser = await Signup(email, password);
    if (newUser == null) {
      alert(
        'Could not create account. This can happen if the email already exists or the backend is unreachable.'
      );
      return;
    }

    const user = await Login(email, password);
    if (user == null) {
      alert('Account created, but automatic sign-in failed. Please sign in manually.');
      router.push('/signin');
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
          Create account
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--fg-muted)]">
          Register to submit reports and personalize your experience.
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputBase}
              placeholder="Choose a password"
            />
          </div>
          <div>
            <label htmlFor={confirmId} className="mb-1.5 block text-sm font-medium text-[var(--fg)]">
              Confirm password
            </label>
            <input
              id={confirmId}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={inputBase}
              placeholder="Re-enter your password"
            />
          </div>
          <button type="submit" className={`${btnPrimary} w-full`}>
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--fg-muted)]">
          Already have an account?{' '}
          <Link
            href="/signin"
            className="font-semibold text-[var(--primary)] underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthPageLayout>
  );
}
