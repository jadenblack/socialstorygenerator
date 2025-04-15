'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { processJsonFile } from '@/app/actions/upload';
import FileUploadContainer from './FileUploadContainer';
import { authClient } from '@/lib/auth-client';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function UploadPage() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isPending && !session?.user) {
            router.push('/login');
        }
    }, [isPending, session, router]);

    // Show loading spinner while checking authentication
    if (isPending) {
        return (
            <div className="w-full flex justify-center items-center h-64">
                <LoadingSpinner size="w-12 h-12" />
                <span className="ml-3 text-gray-600">Loading...</span>
            </div>
        );
    }

    // Don't render content if not authenticated
    if (!session?.user) {
        return null;
    }

    return (
        <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Social Media Data</h1>
            <p className="mb-6 text-gray-600">
                Upload your social media export file in JSON format to generate stories.
            </p>

            <FileUploadContainer serverAction={processJsonFile} />
        </div>
    );
} 