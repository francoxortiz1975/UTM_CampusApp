'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Profile, Logout } from '../types/Authentication';
import { useState, useEffect } from 'react';
import type { User } from '../types/Authentication';
import ThemeToggle from './ThemeToggle';

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
            <header className="flex items-center justify-between bg-white p-6 text-gray-900 shadow dark:bg-zinc-900 dark:text-zinc-100">
                <span>Loading...</span>
                <ThemeToggle />
            </header>
        );
    }

    return (
        <header className="flex items-center justify-between bg-white p-6 shadow dark:bg-zinc-900 dark:shadow-zinc-950/50">
            <div className="flex items-center gap-4">
                {pathname !== '/' && (
                    <button
                        onClick={goToHomePage}
                        className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        ← Back
                    </button>
                )}

                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                    Dashboard
                </h1>
            </div>

            <div className="flex items-center gap-3">
                <ThemeToggle />
                {user == null ? (
                    <button
                        onClick={() => router.push('/signin')}
                        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                        Sign In
                    </button>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                        Sign Out
                    </button>
                )}
            </div>
        </header>
    );
}
