'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '../../components/Header';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Sign In:', { email, password });
        //TO DO: BACK END AUHTENTICATION
    };

    return (
        // Main container
        <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-50">
            <Header />
            {/* Sign In form container */}
            <main className="flex justify-center items-center mt-16 px-4">
                <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
                    {/* Form title */}
                    <h1 className="text-3xl font-bold mb-6 text-black text-center">
                        Sign In
                    </h1>
                    {/* Sign In form */}
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
                        {/* Submit button */}
                        <button
                            type="submit"
                            className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                            Sign In
                        </button>
                    </form>
                    {/* Link to sign up page */}
                    <p className="text-center text-black mt-4">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                            Create one
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
