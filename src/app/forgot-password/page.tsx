'use client';

import Link from 'next/link';
import { useState } from 'react';
import { forgetPassword } from '@/lib/auth-client';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setError(null);

        try {
            const { data, error: resetError } = await forgetPassword({
                email,
                redirectTo: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/reset-password`,
            });

            if (resetError) {
                throw new Error(resetError.message);
            }

            setStatus('success');
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Failed to send reset link');
        }
    };

    if (status === 'success') {
        return (
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Check Your Email
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        We've sent a password reset link to {email}. Please check your inbox and follow the instructions.
                    </p>
                </div>
                <div className="text-center">
                    <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Return to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
            <div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Forgot Your Password?
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Enter your email address below and we'll send you a link to reset your password.
                </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label htmlFor="email-address" className="sr-only">
                            Email address
                        </label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="Email address"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </div>

                {status === 'error' && error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-sm text-center">
                    <p className="text-gray-600">
                        Remember your password?{' '}
                        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Log in
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
} 