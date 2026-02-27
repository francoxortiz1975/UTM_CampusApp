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
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50">
            <Header />
            {/* Sign Up form container */}
            <main className="flex justify-center items-center mt-16 px-4">
                <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
                    {/* Form title */}
                    <h1 className="text-3xl font-bold mb-6 text-black text-center">
                        Create Account
                    </h1>
                    {/* Sign Up form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email input section */}
                        <div>
                            <label className="block text-black font-medium mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-black"
                                placeholder="Enter your email"
                            />
                        </div>
                        {/* Password input section */}
                        <div>
                            <label className="block text-black font-medium mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-black"
                                placeholder="Enter your password"
                            />
                        </div>
                        {/* Confirm password input section */}
                        <div>
                            <label className="block text-black font-medium mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-black"
                                placeholder="Confirm your password"
                            />
                        </div>
                        {/* Submit button */}
                        <button
                            type="submit"
                            className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                            Create Account
                        </button>
                    </form>
                    {/* Link to sign in page */}
                    <p className="text-center text-black mt-4">
                        Already have an account?{' '}
                        <Link href="/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
