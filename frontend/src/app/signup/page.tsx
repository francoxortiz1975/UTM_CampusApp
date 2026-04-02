'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import { Signup, Login } from '../../types/Authentication';
import { useRouter } from 'next/navigation';

export default function SignUp() {
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
            alert('Could not create account. This can happen if the email already exists or the backend is unreachable.');
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
        // Main container
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50 dark:from-zinc-950 dark:to-zinc-900">
            <Header />
            {/* Sign Up form container */}
            <main id="main-content" className="mt-16 flex items-center justify-center px-4">
                <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md dark:bg-zinc-900 dark:shadow-zinc-950/50">
                    {/* Form title */}
                    <h1 className="mb-6 text-center text-3xl font-bold text-black dark:text-zinc-100">
                        Create Account
                    </h1>
                    {/* Sign Up form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email input section */}
                        <div>
                            <label
                                htmlFor="signup-email"
                                className="mb-2 block font-medium text-black dark:text-zinc-200"
                            >
                                Email
                            </label>
                            <input
                                id="signup-email"
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
                                htmlFor="signup-password"
                                className="mb-2 block font-medium text-black dark:text-zinc-200"
                            >
                                Password
                            </label>
                            <input
                                id="signup-password"
                                type="password"
                                name="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-blue-500"
                                placeholder="Enter your password"
                            />
                        </div>
                        {/* Confirm password input section */}
                        <div>
                            <label
                                htmlFor="signup-password-confirm"
                                className="mb-2 block font-medium text-black dark:text-zinc-200"
                            >
                                Confirm Password
                            </label>
                            <input
                                id="signup-password-confirm"
                                type="password"
                                name="confirm-password"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-blue-500"
                                placeholder="Confirm your password"
                            />
                        </div>
                        {/* Submit button */}
                        <button
                            type="submit"
                            className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            Create Account
                        </button>
                    </form>
                    {/* Link to sign in page */}
                    <p className="mt-4 text-center text-black dark:text-zinc-200">
                        Already have an account?{' '}
                        <Link href="/signin" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                            Sign in
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
