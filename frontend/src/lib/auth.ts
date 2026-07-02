// Cookie-based demo authentication.
//
// The real backend used Flask server-side sessions. For the demo we store the
// signed-in email in a cookie so login/logout/profile behave normally without
// a database. The demo user is given id 1 so that admin-only UI (see the
// hard-coded admin ids in the lost & found page) is visible in the demo.

import { cookies } from 'next/headers';

const COOKIE = 'demo_user';
export const DEMO_USER_ID = 1;

export type DemoUser = { id: number; email: string };

export async function getUser(): Promise<DemoUser | null> {
  const store = await cookies();
  const email = store.get(COOKIE)?.value;
  if (!email) return null;
  return { id: DEMO_USER_ID, email };
}

export async function setUser(email: string): Promise<DemoUser> {
  const store = await cookies();
  store.set(COOKIE, email, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return { id: DEMO_USER_ID, email };
}

export async function clearUser(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
