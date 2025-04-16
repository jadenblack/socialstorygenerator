'use client';

import { useState, useMemo } from 'react';
import { generateStoryAction, GenerateStoryInput } from '@/app/actions/generateStory';
import { UserUpload } from '@/app/actions/getUploads';
// Remove shouldSkip import from client component
// import { shouldSkip } from '@/lib/sentimentAnalysis'; 
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { Message } from '@/lib/instagram-models';

// Basic date formatting to YYYY-MM-DD for input[type=date]
const formatDateForInput = (date: Date): string => {
    // Handle potential invalid date objects gracefully
    if (isNaN(date.getTime())) {
        console.warn("Invalid date passed to formatDateForInput, returning empty string.");
        // Return current date or an empty string, depending on desired fallback
        return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
};

// Helper to calculate word count
const countWords = (str: string): number => {
    if (!str) return 0;
    return str.trim().split(/\s+/).length;
};

const MAX_WORD_COUNT = 6000; // Define the maximum word count limit

interface GenerateClientPageProps {
    initialUploadData: UserUpload;
    uploadId: string;
}

export default function GenerateClientPage({ initialUploadData, uploadId }: GenerateClientPageProps) {
    // Removed uploadData state, using prop directly
    // const [uploadData, setUploadData] = useState<UserUpload | null>(null);
    const [generationResult, setGenerationResult] = useState<{ message: string; story?: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [clientError, setClientError] = useState<string | null>(null); // Separate state for client-side issues

    // --- Date Initialization ---
    // Find the earliest and latest valid timestamps
    const validTimestamps = initialUploadData.data.messages
        .map(msg => msg.timestamp_ms)
        .filter(ts => typeof ts === 'number' && !isNaN(ts)); // Filter out undefined/NaN

    const firstMsgDate = validTimestamps.length > 0 ? new Date(Math.min(...validTimestamps)) : new Date(); // Use earliest or fallback to now
    const lastMsgDate = validTimestamps.length > 0 ? new Date(Math.max(...validTimestamps)) : new Date();  // Use latest or fallback to now

    // --- Filter State ---
    const [startDate, setStartDate] = useState<string>(formatDateForInput(firstMsgDate));
    const [endDate, setEndDate] = useState<string>(formatDateForInput(lastMsgDate));
    // Initialize with all participant names
    const allParticipantNames = useMemo(() => initialUploadData.data.participants.map(p => p.name), [initialUploadData.data.participants]);
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>(allParticipantNames);

    // Calculate filtered messages and counts (CLIENT-SIDE filtering WITHOUT shouldSkip)
    const filteredMessages = useMemo(() => {
        // Ensure we have data before proceeding
        if (!initialUploadData?.data?.messages) return [];

        // Convert date strings to timestamps only once
        const startTimestamp = startDate ? new Date(startDate).getTime() : 0;
        // Add time to include the entire end day
        const endTimestamp = endDate ? new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1) : Infinity;
        const selectedSet = new Set(selectedParticipants); // Use Set for faster lookups

        return initialUploadData.data.messages.filter((msg: Message) => {
            // Basic validation for essential message properties
            if (!msg.content || !msg.sender_name || typeof msg.timestamp_ms !== 'number' || isNaN(msg.timestamp_ms)) {
                return false;
            }
            // Date range check
            if (msg.timestamp_ms < startTimestamp || msg.timestamp_ms > endTimestamp) {
                return false;
            }
            // For word counts per user, we want all messages within date range regardless of selection
            return true;
        });
    }, [initialUploadData, startDate, endDate]); // Remove selectedParticipants dependency since we want all messages

    // Calculate word counts per participant within the date range
    const participantWordCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredMessages.forEach(msg => {
            if (msg.sender_name && msg.content) {
                counts[msg.sender_name] = (counts[msg.sender_name] || 0) + countWords(msg.content);
            }
        });
        return counts;
    }, [filteredMessages]);

    // Calculate total filtered messages and word count based on selected participants
    const filteredMessageCount = useMemo(() => {
        return filteredMessages.filter(msg => selectedParticipants.includes(msg.sender_name || '')).length;
    }, [filteredMessages, selectedParticipants]);

    const filteredWordCount = useMemo(() => {
        return filteredMessages.reduce((count, msg) => {
            if (msg.sender_name && selectedParticipants.includes(msg.sender_name)) {
                return count + countWords(msg.content || '');
            }
            return count;
        }, 0);
    }, [filteredMessages, selectedParticipants]);

    // Check if the word count limit is exceeded
    const isWordCountExceeded = filteredWordCount > MAX_WORD_COUNT;

    // Handle participant selection change with checkboxes
    const handleParticipantChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = event.target;
        setSelectedParticipants(prevSelected =>
            checked
                ? [...prevSelected, value] // Add participant if checked
                : prevSelected.filter(name => name !== value) // Remove participant if unchecked
        );
    };

    const handleGenerateClick = async () => {
        setIsGenerating(true);
        setGenerationResult(null);
        setClientError(null);

        // Ensure dates are valid before creating ISO strings
        const startIso = startDate ? new Date(startDate).toISOString() : new Date(0).toISOString();
        const endIso = endDate ? new Date(endDate).toISOString() : new Date().toISOString(); // Use current date if end date is missing


        const input: GenerateStoryInput = {
            uploadId,
            startDate: startIso,
            endDate: endIso,
            selectedParticipants,
        };

        try {
            const result = await generateStoryAction(input);
            if (result.success) {
                setGenerationResult({ message: result.message || 'Success!', story: result.story });
            } else {
                setClientError(result.message || 'Failed to generate story.');
            }
        } catch (error) {
            console.error("Error calling generateStoryAction:", error);
            setClientError(error instanceof Error ? error.message : "An unexpected error occurred.");
        }

        setIsGenerating(false);
    };

    // Removed Loading/Error states related to initial data fetch

    // Main Render
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Generate Story: {initialUploadData.conversationTitle || 'Conversation'}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Filters Column */}
                <div className="md:col-span-1 space-y-4 p-4 border rounded-lg bg-white shadow-sm">
                    <h2 className="text-xl font-semibold mb-3">Filters</h2>
                    {/* Date Filters */}
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {/* Participant Filter (Checkboxes) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
                        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1 bg-white">
                            {allParticipantNames.map(name => (
                                <div key={name} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`participant-${name}`}
                                            value={name}
                                            checked={selectedParticipants.includes(name)}
                                            onChange={handleParticipantChange}
                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <label htmlFor={`participant-${name}`} className="ml-2 block text-sm text-gray-900 select-none">
                                            {name}
                                        </label>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {(participantWordCounts[name] || 0).toLocaleString()} words
                                    </span>
                                </div>
                            ))}
                            {allParticipantNames.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No participants found.</p>
                            )}
                        </div>
                        {/* Optional: Add Select/Deselect All buttons if needed */}
                    </div>

                    {/* Estimate Display */}
                    <div className="mt-4 p-3 bg-gray-100 rounded border border-gray-200">
                        <h3 className="font-medium mb-1 text-gray-800">Filtered Selection (Estimate)</h3>
                        <p className="text-sm text-gray-700">Messages: <span className="font-semibold">{filteredMessageCount.toLocaleString()}</span></p>
                        <p className={`text-sm ${isWordCountExceeded ? 'text-red-600' : 'text-gray-700'}`}> {/* Conditional red color */}
                            Word Count: <span className="font-semibold">{filteredWordCount.toLocaleString()}</span> / {MAX_WORD_COUNT.toLocaleString()}
                        </p>
                        {isWordCountExceeded && (
                            <p className="text-xs text-red-600 mt-1">Word count exceeds the limit of {MAX_WORD_COUNT.toLocaleString()}. Please adjust filters.</p>
                        )}
                        {filteredMessageCount === 0 && !isGenerating && (
                            <p className="text-xs text-red-600 mt-1">Generation disabled with 0 messages selected.</p>
                        )}
                    </div>
                </div>

                {/* Generation Column */}
                <div className="md:col-span-2 space-y-4 p-4 border rounded-lg bg-white shadow-sm">
                    <h2 className="text-xl font-semibold mb-3">Story Generation</h2>

                    {/* Generation Process Description */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">What happens when you generate?</h3>
                        <div className="space-y-3 text-sm text-gray-600">
                            <p>
                                When you click generate, we'll process your filtered messages through several steps:
                            </p>
                            <ol className="list-decimal list-inside space-y-2 ml-2">
                                <li>Analyze each message using AI to determine its sentiment and importance</li>
                                <li>Filter out less significant messages while keeping the story's essence</li>
                                <li>Generate complementary music and colors that match the emotional journey</li>
                                <li>Create an engaging presentation where messages appear dynamically</li>
                            </ol>
                            <p className="mt-3 text-sm text-gray-700 italic">
                                The result will be displayed as an infinite-scroll style story, where new messages emerge every few seconds,
                                accompanied by matching music and visual elements.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateClick}
                        disabled={isGenerating || filteredMessageCount === 0 || isWordCountExceeded}
                        className={`w-full px-4 py-2 font-semibold text-white rounded-md transition duration-150 ease-in-out ${isGenerating || filteredMessageCount === 0 || isWordCountExceeded ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                    >
                        {isGenerating ? (
                            <>
                                <LoadingSpinner size="w-5 h-5 inline mr-2" />
                                Generating...
                            </>
                        ) : 'Generate Story'}
                    </button>

                    {clientError && !isGenerating && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                            <p><span className="font-semibold">Error:</span> {clientError}</p>
                        </div>
                    )}

                    {generationResult && !isGenerating && ( // Only show results when not generating
                        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
                            <p className="font-semibold text-green-800 mb-2">{generationResult.message}</p>
                            {generationResult.story && (
                                <div className="mt-2 p-3 bg-white border rounded max-h-96 overflow-y-auto">
                                    <h4 className="text-md font-semibold mb-2 text-gray-800">Generated Story:</h4>
                                    {/* Use prose for better text formatting */}
                                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                        <p>{generationResult.story}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 