'use client';

import { useState } from 'react';
import FileUpload from '@/app/components/FileUpload';
import StatsDisplay from '@/app/components/StatsDisplay';
import { InstagramStats } from '@/lib/processors';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';

type ProcessJsonResult = {
    success: boolean;
    message?: string;
    data?: any;
    stats?: InstagramStats;
};

type SaveUploadResult = {
    success: boolean;
    message?: string;
    uploadId?: string;
};

type FileUploadContainerProps = {
    serverAction: (formData: FormData) => Promise<ProcessJsonResult>;
    saveUploadAction: (params: {
        userId: string;
        jsonData: string;
        conversationTitle: string;
        participantCount: number;
        messageCount: number;
    }) => Promise<SaveUploadResult>;
};

export default function FileUploadContainer({ serverAction, saveUploadAction }: FileUploadContainerProps) {
    const [result, setResult] = useState<ProcessJsonResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { data: authData, isPending: isSessionPending } = useSession();
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    const handleFileSelected = async (file: File) => {
        setIsProcessing(true);
        setResult(null);
        setSaveMessage(null);
        setIsSaved(false);

        try {
            // Create a FormData object to send to server
            const formData = new FormData();
            formData.append('file', file);

            // Call the server action
            const response = await serverAction(formData);
            setResult(response);

            if (response.success) {
                console.log('File processed successfully:', response.data);
                setIsSaved(false);
                setSaveMessage(null);
            } else {
                setIsSaved(false);
                setSaveMessage(null);
            }

        } catch (error) {
            console.error('Error processing file:', error);
            setResult({
                success: false,
                message: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            setIsSaved(false);
            setSaveMessage(null);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleError = (error: string) => {
        setResult({
            success: false,
            message: error
        });
        setIsSaved(false);
        setSaveMessage(null);
    };

    const handleSaveUpload = async () => {
        if (!result?.success || !result.data || !result.stats || !authData?.user?.id) {
            setSaveMessage('Cannot save. Data, stats, or user session is missing.');
            return;
        }

        if (isSessionPending) {
            setSaveMessage('Cannot save. Still verifying user session.');
            return;
        }

        setIsSaving(true);
        setSaveMessage(null);

        try {
            const response = await saveUploadAction({
                userId: authData.user.id,
                jsonData: JSON.stringify(result.data),
                conversationTitle: result.stats.conversationTitle,
                participantCount: result.stats.participantCount,
                messageCount: result.stats.messageCount,
            });
            if (response.success) {
                setSaveMessage('Upload saved successfully!');
                setIsSaved(true);
            } else {
                setSaveMessage(response.message || 'Failed to save upload.');
                setIsSaved(false);
            }
        } catch (error) {
            console.error('Error saving upload:', error);
            setSaveMessage(error instanceof Error ? error.message : 'An unexpected error occurred during save.');
            setIsSaved(false);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <FileUpload
                onFileSelected={handleFileSelected}
                onError={handleError}
            />

            {!isProcessing && result && (
                <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    {result.success ? (
                        <div className="text-green-700">
                            <h3 className="font-medium">File uploaded and processed successfully!</h3>

                            {result.stats && <StatsDisplay stats={result.stats} />}

                            {result.data && authData?.user?.id && (
                                <div className="mt-4 pt-4 border-t border-green-200 flex items-center space-x-4">
                                    {isSessionPending ? (
                                        <p className="text-sm text-gray-600">Checking user session...</p>
                                    ) : !isSaved ? (
                                        <button
                                            onClick={handleSaveUpload}
                                            disabled={isSaving || isSessionPending}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSaving ? 'Saving...' : 'Save Upload Data'}
                                        </button>
                                    ) : (
                                        <Link href="/uploads"
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                        >
                                            View Uploads
                                        </Link>
                                    )}
                                    {saveMessage && (
                                        <p className={`mt-2 text-sm ${isSaved ? 'text-green-800' : 'text-red-700'}`}>
                                            {saveMessage}
                                        </p>
                                    )}
                                    {result.data && !isSessionPending && !authData?.user?.id && (
                                        <p className="text-sm text-yellow-700">Please log in to save your upload.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-red-700">
                            <h3 className="font-medium">Error</h3>
                            <p>{result.message || 'An unknown error occurred'}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 