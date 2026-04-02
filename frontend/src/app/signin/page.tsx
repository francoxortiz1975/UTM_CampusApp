'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { Login } from '../../types/Authentication';
import { useRouter } from 'next/navigation';

export default function SignIn() {
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
        // Main container
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50 dark:from-zinc-950 dark:to-zinc-900">
            <Header />
            {/* Sign In form container */}
            <main id="main-content" className="mt-16 flex items-center justify-center px-4">
                <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md dark:bg-zinc-900 dark:shadow-zinc-950/50">
                    {/* Form title */}
                    <h1 className="mb-6 text-center text-3xl font-bold text-black dark:text-zinc-100">
                        Sign In
                    </h1>
                    {/* Sign In form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email input section */}
                        <div>
                            <label
                                htmlFor="signin-email"
                                className="mb-2 block font-medium text-black dark:text-zinc-200"
                            >
                                Email
                            </label>
                            <input
                                id="signin-email"
                                type="email"
                                name="email"
                                autoComplete="username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-blue-500"
                                placeholder="Enter your email"
                            />
                        </div>
                        {/* Password input section */}
                        <div>
                            <label
                                htmlFor="signin-password"
                                className="mb-2 block font-medium text-black dark:text-zinc-200"
                            >
                                Password
                            </label>
                            <input
                                id="signin-password"
                                type="password"
                                name="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-blue-500"
                                placeholder="Enter your password"
                            />
                        </div>
                        {/* Submit button */}
                        <button
                            type="submit"
                            className="w-full rounded-lg border border-blue-200/45 bg-blue-300/15 py-2 font-medium text-blue-950 backdrop-blur-sm transition-all hover:border-blue-200/70 hover:bg-blue-300/25 dark:border-blue-200/30 dark:bg-blue-300/10 dark:text-white dark:hover:bg-blue-300/20"
                        >
                            Sign In
                        </button>
                    </form>
                    {/* Link to sign up page */}
                    <p className="mt-4 text-center text-black dark:text-zinc-200">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
                            Create one
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
