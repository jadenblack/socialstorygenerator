'use client';
import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { UserUpload } from '@/app/actions/getUploads';
import { processInstagramData, InstagramStats } from '@/lib/processors';
import StatsDisplay from '@/app/components/StatsDisplay';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { deleteUploadAction } from '@/app/actions/deleteUpload';

interface UploadsTableProps {
    uploads: UserUpload[];
}

// Simple date formatter for the table
const formatTableDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString();
};

export default function UploadsTable({ uploads }: UploadsTableProps) {
    const [openIndex, setOpenIndex] = useState<number>(-1);
    const [detailedStats, setDetailedStats] = useState<InstagramStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    const handleToggle = (index: number, data: any) => {
        if (openIndex === index) {
            setOpenIndex(-1); // Close if already open
            setDetailedStats(null);
        } else {
            setIsLoadingStats(true);
            setOpenIndex(index);
            // Simulate processing time or potential async operation
            setTimeout(() => {
                try {
                    const stats = processInstagramData(data);
                    setDetailedStats(stats);
                } catch (error) {
                    console.error("Error processing data for stats:", error);
                    setDetailedStats(null); // Handle processing error
                    // Optionally show an error message in the dropdown
                }
                setIsLoadingStats(false);
            }, 50); // Small delay to show loading spinner
        }
    };

    const handleDeleteClick = (uploadId: string) => {
        setShowDeleteConfirm(uploadId);
    };

    const confirmDelete = async (uploadId: string) => {
        try {
            setIsDeleting(uploadId);
            setDeleteError(null);

            const result = await deleteUploadAction(uploadId);

            if (result.success) {
                // No need to manually remove from the list
                // revalidatePath in the action will trigger a re-render
            } else {
                setDeleteError(result.message || 'Failed to delete upload');
            }
        } catch (error) {
            console.error('Error deleting upload:', error);
            setDeleteError(error instanceof Error ? error.message : 'An unexpected error occurred');
        } finally {
            setIsDeleting(null);
            setShowDeleteConfirm(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(null);
    };

    if (!uploads || uploads.length === 0) {
        return <p className="text-gray-600">No uploads found.</p>;
    }

    return (
        <div className="overflow-x-auto">
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this conversation and its story? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                                disabled={!!isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => confirmDelete(showDeleteConfirm)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                disabled={!!isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <LoadingSpinner size="w-4 h-4 inline mr-2" />
                                        Deleting...
                                    </>
                                ) : 'Delete'}
                            </button>
                        </div>
                        {deleteError && (
                            <p className="mt-4 text-sm text-red-600">{deleteError}</p>
                        )}
                    </div>
                </div>
            )}

            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversation</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participants</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saved On</th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Details</span>
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {uploads.map((upload, index) => {
                        // Determine if sentiment analysis exists and is populated
                        const hasSentimentData = upload.sentimentAnalysisResult && upload.sentimentAnalysisResult.messages.length > 0;
                        const buttonText = hasSentimentData ? 'View Story' : 'Create Story';
                        const buttonLink = hasSentimentData ? `/story/${upload._id}` : `/generate/${upload._id}`;
                        const buttonClass = hasSentimentData
                            ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded no-style' // Style for 'View Story'
                            : 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded no-style'; // Style for 'Create Story'

                        return (
                            <React.Fragment key={upload._id}>
                                <tr key={`${upload._id}-row`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{upload.conversationTitle}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{upload.participantCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{upload.messageCount.toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTableDate(upload.createdAt)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleToggle(index, upload.data)}
                                            className="text-indigo-600 hover:text-indigo-900 focus:outline-none mr-4"
                                            aria-expanded={openIndex === index}
                                        >
                                            {openIndex === index ? 'Hide' : 'Details'}
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 inline-block ml-1 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                                        <button
                                            onClick={() => handleDeleteClick(upload._id.toString())}
                                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                            disabled={isDeleting === upload._id.toString()}
                                        >
                                            {isDeleting === upload._id.toString() ? (
                                                <>
                                                    <LoadingSpinner size="w-4 h-4 inline mr-1" />
                                                    Deleting...
                                                </>
                                            ) : 'Delete'}
                                        </button>
                                        <Link href={buttonLink} className={buttonClass}>
                                            {buttonText}
                                        </Link>
                                    </td>
                                </tr>
                                {openIndex === index && (
                                    <tr key={`${upload._id}-details`}>
                                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                            {isLoadingStats ? (
                                                <div className="flex justify-center items-center p-4">
                                                    <LoadingSpinner size="w-6 h-6" />
                                                    <span className="ml-2 text-sm text-gray-600">Loading stats...</span>
                                                </div>
                                            ) : detailedStats ? (
                                                <StatsDisplay stats={detailedStats} />
                                            ) : (
                                                <p className="text-center text-red-600">Could not load stats for this upload.</p>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
} 