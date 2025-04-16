'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ClientWrapper from '../components/ClientWrapper';

export default function VerifyEmailPage() {
    return (
        <ClientWrapper>
            <VerifyEmailContent />
        </ClientWrapper>
    );
}

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    return (
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
            <div>
                {error ? (
                    <>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Verification Failed
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            {error === 'invalid_token'
                                ? 'The verification link is invalid or has expired. Please request a new verification email.'
                                : 'An error occurred during email verification. Please try again.'}
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Email Verified!
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Your email has been successfully verified. You can now sign in to your account.
                        </p>
                    </>
                )}
            </div>
            <div className="text-center">
                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign in to your account
                </Link>
            </div>
        </div>
    );
} 