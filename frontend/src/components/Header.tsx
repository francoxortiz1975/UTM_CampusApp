'use client';

import { usePathname, useRouter } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();

    const goToHomePage = () => {
        router.push('/');
    };

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

            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Sign In
            </button>
        </header>
    );
}
