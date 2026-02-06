'use client';

import { usePathname, useRouter } from 'next/navigation';
import {Profile, Logout, User} from '../types/Authentication';
import { useState, useEffect } from 'react';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // NOTE (HALF): yes it needs to be in an async function :/
        async function fetchUser() {
            const currUser: User | null = await Profile();
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
        return <header>Loading...</header>;
    }

    return (
        <header className="flex items-center justify-between p-6 bg-white shadow">
            <div className="flex items-center gap-4">
                {pathname !== '/' && (
                    <button
                        onClick={goToHomePage}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        ← Back
                    </button>
                )}

                <h1 className="text-2xl font-bold text-gray-900">
                    Dashboard
                </h1>
            </div>

            {user == null && (
                <button onClick={() => router.push('/signin')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Sign In
                </button>
            ) || (
                <button onClick={handleLogout}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Sign Out
                </button>
            )
            }

        </header>
    );
}
