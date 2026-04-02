'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Profile, Logout } from '../types/Authentication';
import { useState, useEffect } from 'react';
import type { User } from '../types/Authentication';
import ThemeToggle from './ThemeToggle';

type HeaderProps = {
    backHref?: string;
    backLabel?: string;
};

export default function Header({ backHref = '/', backLabel = '← Back' }: HeaderProps) {
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
        router.push(backHref);
    };

    const handleLogout = async () => {
        await Logout();
        setUser(null);
    };

    if (loading) {
        return (
            <header className="bg-[linear-gradient(135deg,#1d4ed8_0%,#0f2f6b_100%)] p-6 text-white">
                <span>Loading...</span>
                <ThemeToggle />
            </header>
        );
    }

    return (
        <header className="bg-[linear-gradient(135deg,#1d4ed8_0%,#0f2f6b_100%)]">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-6">
                    {pathname !== '/' && (
                        <button
                            onClick={goToHomePage}
                            className="inline-flex items-center text-sm font-medium text-white/80 transition-colors hover:text-white"
                        >
                            {backLabel}
                        </button>
                    )}

                    <h1 className="font-display text-2xl font-bold text-white">
                        UTM CampusApp
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    {user == null ? (
                        <button
                            onClick={() => router.push('/signin')}
                            className="rounded-lg border border-blue-200/45 bg-blue-300/15 px-4 py-2 font-medium text-white backdrop-blur-sm transition-all hover:border-blue-100/60 hover:bg-blue-300/25 dark:border-blue-200/35 dark:bg-blue-300/10 dark:hover:bg-blue-300/20"
                        >
                            Sign In
                        </button>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="rounded-lg border border-blue-200/45 bg-blue-300/15 px-4 py-2 font-medium text-white backdrop-blur-sm transition-all hover:border-blue-100/60 hover:bg-blue-300/25 dark:border-blue-200/35 dark:bg-blue-300/10 dark:hover:bg-blue-300/20"
                        >
                            Sign Out
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
