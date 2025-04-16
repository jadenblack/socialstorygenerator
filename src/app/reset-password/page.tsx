'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth-client';
import { useSearchParams } from 'next/navigation';
import ClientWrapper from '@/app/components/ClientWrapper';

export default function ResetPasswordPage() {
    return (
        <ClientWrapper>
            <ResetPasswordContent />
        </ClientWrapper>
    );
}

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing token. Please request a new password reset link.');
            setStatus('error');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setError(null);
        setValidationError(null);

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setValidationError('Passwords do not match');
            setStatus('idle');
            return;
        }

        // Validate password length
        if (newPassword.length < 8) {
            setValidationError('Password must be at least 8 characters long');
            setStatus('idle');
            return;
        }

        if (!token) {
            setError('Missing token. Please request a new password reset link.');
            setStatus('error');
            return;
        }

        try {
            const { error: resetError } = await resetPassword({
                newPassword,
                token,
            });

            if (resetError) {
                throw new Error(resetError.message);
            }

            setStatus('success');
        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Failed to reset password');
        }
    };

    const content = status === 'success' ? (
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
            <div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Password Reset Complete
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Your password has been successfully reset. You can now log in with your new password.
                </p>
            </div>
            <div className="text-center">
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Go to login
                </Link>
            </div>
        </div>
    ) : (
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
            <div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Reset Your Password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Enter your new password below.
                </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                            New Password
                        </label>
                        <input
                            id="new-password"
                            name="newPassword"
                            type="password"
                            required
                            minLength={8}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="New password"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <input
                            id="confirm-password"
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={8}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="Confirm new password"
                        />
                    </div>
                </div>

                {validationError && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{validationError}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={status === 'loading' || status === 'error' || !token}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {status === 'loading' ? 'Resetting...' : 'Reset Password'}
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

    return (
        <div className="min-h-screen bg-gray-50 relative">
            {/* Grid background pattern */}
            <div className="absolute inset-0 bg-[#F1F5F9] bg-opacity-90">
                <div className="absolute inset-0" style={{
                    backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                    backgroundSize: '4rem 4rem'
                }} />
            </div>

            {/* Content */}
            <div className="relative min-h-screen flex flex-col">
                <main className="flex-grow flex items-center justify-center py-7 px-4 sm:px-6 lg:px-8">
                    {content}
                </main>

                {/* Footer */}
                <footer className="bg-black text-gray-300">
                    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4">
                        <div className="flex flex-col sm:flex-row items-center sm:justify-center gap-4 sm:gap-12">
                            <div>
                                Need Help?&nbsp;
                                <Link href="/contact" className="text-white font-medium transition-colors duration-300 hover:text-gray-300">
                                    Contact Us
                                </Link>
                            </div>
                            <div>© Social Story Generator 2025</div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
} 