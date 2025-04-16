'use client';
import React from 'react';
import { useState } from 'react';
import { UserUpload } from '@/app/actions/getUploads';
import { processInstagramData, InstagramStats } from '@/lib/processors';
import StatsDisplay from '@/app/components/StatsDisplay';
import LoadingSpinner from '@/app/components/LoadingSpinner';

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

    if (!uploads || uploads.length === 0) {
        return <p className="text-gray-600">No uploads found.</p>;
    }

    return (
        <div className="overflow-x-auto">
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
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {uploads.map((upload, index) => (
                        <React.Fragment key={upload._id}>
                            <tr key={upload._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{upload.conversationTitle}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{upload.participantCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{upload.messageCount.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTableDate(upload.createdAt)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleToggle(index, upload.data)}
                                        className="text-indigo-600 hover:text-indigo-900 focus:outline-none"
                                        aria-expanded={openIndex === index}
                                    >
                                        {openIndex === index ? 'Hide' : 'Details'}
                                        {/* Optional: Add Chevron Icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 inline-block ml-1 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                            {/* Dropdown Row */}
                            {openIndex === index && (
                                <tr key={`${upload._id}-details`}>
                                    <td colSpan={5} className="px-6 py-4 bg-gray-50">
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
                    ))}
                </tbody>
            </table>
        </div>
    );
} 