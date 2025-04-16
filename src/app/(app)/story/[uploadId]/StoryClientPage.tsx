'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Participant, Message as OriginalMessage } from '@/lib/instagram-models';
import { SentimentAnalysisMessage } from '@/lib/sentimentAnalysis';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion'; // For animations

// Combined message type
type MessageWithSentiment = OriginalMessage & SentimentAnalysisMessage;

interface StoryClientPageProps {
    initialData: {
        participants: Participant[];
        messagesWithSentiment: MessageWithSentiment[];
        conversationTitle: string;
    };
}

// Helper to count words (simplified)
const countWords = (text: string = ''): number => text.trim().split(/\s+/).filter(Boolean).length;

// Define sentiment to color mapping based on provided enum logic
const sentimentToClassMap: Record<string, string> = {
    Awkwardness: 'SelfJudgment',
    Romantic: 'Positivity', // Assuming positive
    Guilt: 'SelfJudgment',
    Fear: 'Fear',
    Neutral: 'Neutral',
    Anger: 'Distress',
    Sympathy: 'Warmth',
    Sadness: 'Sorrow',
    Sarcasm: 'Sarcasm',
    Joy: 'Positivity',
    Surprise: 'Wonder',
    // Add fallbacks if needed
    default: 'Neutral'
};

// Simple hash function for color assignment (adjust as needed for better distribution)
const stringToHslColor = (str: string, s: number = 70, l: number = 50): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, ${s}%, ${l}%)`;
};

// Format timestamp to include date and time
const formatTimestamp = (timestamp_ms: number): string => {
    return new Date(timestamp_ms).toLocaleString([], {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Helper to format date for separator
const formatDateSeparator = (timestamp_ms: number): string => {
    return new Date(timestamp_ms).toLocaleDateString([], {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
};

export default function StoryClientPage({ initialData }: StoryClientPageProps) {
    const { participants, messagesWithSentiment: initialMessages, conversationTitle } = initialData;
    const [impersonatedUser, setImpersonatedUser] = useState<string | null>(null);
    const [includeVulgar, setIncludeVulgar] = useState<boolean>(true);
    const [neutralImportanceThreshold] = useState<number>(7);
    const [nonNeutralImportanceThreshold] = useState<number>(5);
    const [displayedMessages, setDisplayedMessages] = useState<MessageWithSentiment[]>([]);
    const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
    const [isPaused, setIsPaused] = useState<boolean>(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messageContainerRef = useRef<HTMLDivElement>(null); // Ref for scrolling

    // Assign colors to participants
    const participantColors = useMemo(() => {
        const colors: Record<string, string> = {};
        participants.forEach(p => {
            colors[p.name] = stringToHslColor(p.name);
        });
        return colors;
    }, [participants]);

    // Sort initial messages chronologically
    const sortedMessages = useMemo(() => {
        return [...initialMessages].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
    }, [initialMessages]);

    // Filter messages based on vulgarity and importance logic
    const filteredMessages = useMemo(() => {
        console.log(`Filtering with thresholds: Neutral=${neutralImportanceThreshold}, NonNeutral=${nonNeutralImportanceThreshold}`);
        // 1. Apply vulgarity filter first
        const baseMessages = includeVulgar ? sortedMessages : sortedMessages.filter(msg => !msg.vulgar);

        // 2. Apply importance filtering
        const finalMessageIndices = new Set<number>();
        const nonImportantBufferIndices: number[] = [];
        const MAX_BUFFER_SIZE = 4;
        const TIME_WINDOW_MS = 48 * 60 * 60 * 1000;

        baseMessages.forEach((currentMsg, i) => {
            const isImportant = (
                (currentMsg.sentiment !== 'Neutral' && currentMsg.importance >= nonNeutralImportanceThreshold) ||
                (currentMsg.sentiment === 'Neutral' && currentMsg.importance >= neutralImportanceThreshold)
            );

            if (isImportant) {
                // Add preceding non-important messages within the time window
                nonImportantBufferIndices.forEach(bufferedIndex => {
                    if (currentMsg.timestamp_ms - baseMessages[bufferedIndex].timestamp_ms <= TIME_WINDOW_MS) {
                        finalMessageIndices.add(bufferedIndex);
                    }
                    // No need to check older ones as buffer is implicitly sorted by add order
                });
                // Add the important message itself
                finalMessageIndices.add(i);
                // Clear the buffer
                nonImportantBufferIndices.length = 0; // Efficient way to clear
            } else {
                // Add non-important message index to buffer
                nonImportantBufferIndices.push(i);
                // Maintain buffer size
                if (nonImportantBufferIndices.length > MAX_BUFFER_SIZE) {
                    nonImportantBufferIndices.shift(); // Remove the oldest
                }
            }
        });

        // 3. Build the final list from the selected indices
        const finalIndicesArray = Array.from(finalMessageIndices).sort((a, b) => a - b);
        const result = finalIndicesArray.map(index => baseMessages[index]);
        console.log(`Original: ${baseMessages.length}, Filtered: ${result.length}`);
        return result;

    }, [sortedMessages, includeVulgar, neutralImportanceThreshold, nonNeutralImportanceThreshold]);

    // Reset displayed messages and index when filteredMessages change
    useEffect(() => {
        console.log('Filtered messages changed, resetting display.');
        setDisplayedMessages([]);
        setCurrentMessageIndex(0);
        setIsPaused(true); // Start paused after filter change
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, [filteredMessages]);

    // Effect to handle message display timing
    useEffect(() => {
        // Clear any previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Only proceed if not paused, a user is selected, and there are more messages
        if (!isPaused && impersonatedUser && currentMessageIndex < filteredMessages.length) {
            const currentMessage = filteredMessages[currentMessageIndex];

            // --- Step 1: Add the current message immediately (if not already present) ---
            // This ensures the message appears before its associated delay starts.
            setDisplayedMessages(prev => {
                // Check using a more reliable unique key if possible (assuming timestamp_ms is unique enough here)
                const alreadyExists = prev.some(m => m.timestamp_ms === currentMessage.timestamp_ms);
                if (!alreadyExists) {
                    // Handle slider jumps correctly: ensure all messages up to current are shown
                    if (prev.length < currentMessageIndex) {
                        console.log(`Slider jump detected? Displaying up to index ${currentMessageIndex}`);
                        return filteredMessages.slice(0, currentMessageIndex + 1);
                    } else if (prev.length === currentMessageIndex) {
                        // Standard playback: add the next message
                        return [...prev, currentMessage];
                    }
                }
                // If message already exists or state is ahead, don't modify
                return prev;
            });

            // --- Step 2: Calculate delay based on the message JUST added ---
            const wordCount = countWords(currentMessage.content);
            // Base delay: 500ms minimum + 200ms per word
            const minDelay = currentMessage.sentiment !== 'Neutral' ? 1750 : 500;
            const baseDelay = Math.max(minDelay, 200 * wordCount);

            // Calculate sentiment multiplier
            let sentimentMultiplier = 1.0;
            if (currentMessage.sentiment !== 'Neutral') {
                // Start with double duration (extra = 1.0)
                // Decrease towards 1.2x duration (extra = 0.2) by 50 words
                const reductionFactor = Math.min(1.0, wordCount / 50); // Cap reduction at 50 words
                const extraMultiplier = Math.max(0.2, 1.0 - reductionFactor * 0.8);
                sentimentMultiplier = 1.0 + extraMultiplier;
            }

            // Final delay incorporates sentiment multiplier
            const finalDelay = baseDelay * sentimentMultiplier;

            // --- Step 3: Schedule ONLY the index increment for the *next* message ---
            // The delay now happens *after* the current message is displayed.
            timeoutRef.current = setTimeout(() => {
                // Move to the next message index after the delay
                setCurrentMessageIndex(prev => prev + 1);
            }, finalDelay); // Use finalDelay here
        }

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
        // Depend on isPaused, impersonatedUser, currentMessageIndex, and filteredMessages
    }, [isPaused, impersonatedUser, currentMessageIndex, filteredMessages]);

    // Effect to scroll to the bottom when new messages are added
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [displayedMessages]);

    // Handler to start the story display
    const handleStartStory = (selectedUser: string) => {
        setImpersonatedUser(selectedUser);
        setIsPaused(false); // Start playing
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handlePerspectiveChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedUser = event.target.value;
        if (selectedUser) {
            handleStartStory(selectedUser);
        } else {
            setIsPaused(true);
            setImpersonatedUser(null);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }
    };

    const handleVulgarityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIncludeVulgar(event.target.checked);
    };

    // Handler for Pause/Resume button
    const handlePauseResume = () => {
        setIsPaused(prev => !prev);
        // If pausing, clear the timeout
        if (!isPaused && timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        // If resuming, the useEffect will pick it up
    };

    // Handler for Slider change
    const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newIndex = parseInt(event.target.value, 10);

        // Pause playback on manual interaction
        setIsPaused(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        setCurrentMessageIndex(newIndex);
        // Update displayed messages to reflect the slider position
        setDisplayedMessages(filteredMessages.slice(0, newIndex)); // Show messages up to the new index

        // Scroll adjustment might be needed here if jumping far
        requestAnimationFrame(() => {
            if (messageContainerRef.current) {
                // Optional: Try to scroll the *new* last message into view if jumping forward
                // This is complex; a simple scroll to bottom might suffice for now
                messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
            }
        });
    };


    return (
        <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
            <h1 className="text-3xl font-bold mb-4 text-center">Story: {conversationTitle}</h1>

            {/* --- Settings --- */}
            <div className="flex flex-wrap justify-center items-center gap-4 mb-6 px-4 py-3 bg-gray-100 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                    <label htmlFor="perspective-select" className="text-sm font-medium text-gray-700">View as:</label>
                    <select
                        id="perspective-select"
                        value={impersonatedUser || ''}
                        onChange={handlePerspectiveChange}
                        className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">-- Select User --</option>
                        {participants.map(p => (
                            <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="include-vulgar"
                        checked={includeVulgar}
                        onChange={handleVulgarityChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="include-vulgar" className="text-sm font-medium text-gray-700">Include Vulgar Messages</label>
                </div>
            </div>

            {/* --- Message Display Area --- */}
            <div ref={messageContainerRef} className="flex-grow overflow-y-auto p-4 bg-white border border-gray-200 rounded-lg shadow-inner mb-4 space-y-3">
                {!impersonatedUser && (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500 italic">Select a user perspective to start the story.</p>
                    </div>
                )}
                {impersonatedUser && displayedMessages.length === 0 && !isPaused && (
                    <div className="flex justify-center items-center h-full">
                        <LoadingSpinner />
                        <span className="ml-2 text-gray-600">Loading first message...</span>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {impersonatedUser && displayedMessages.map((msg, index) => {
                        const isImpersonated = msg.sender_name === impersonatedUser;
                        // --- Alignment Reversed ---
                        const alignment = isImpersonated ? 'justify-end' : 'justify-start';
                        const sentimentClass = sentimentToClassMap[msg.sentiment] || sentimentToClassMap.default;
                        const senderColor = participantColors[msg.sender_name] || '#000000'; // Default black

                        // Check if the date changed from the previous message
                        const prevMsg = index > 0 ? displayedMessages[index - 1] : null;
                        const showDateSeparator = !prevMsg || new Date(msg.timestamp_ms).toDateString() !== new Date(prevMsg.timestamp_ms).toDateString();

                        return (
                            <React.Fragment key={msg.id || msg.timestamp_ms}> {/* Use React.Fragment for keys */}
                                {/* --- Date Separator --- */}
                                {showDateSeparator && (
                                    <div className="text-center text-xs text-gray-500 py-2 my-2 border-t border-b border-gray-200">
                                        {formatDateSeparator(msg.timestamp_ms)}
                                    </div>
                                )}

                                <motion.div
                                    // key is now on the Fragment above
                                    className={`flex ${alignment}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className={`p-3 rounded-lg max-w-xs sm:max-w-md md:max-w-lg shadow-md message-bubble ${sentimentClass}`}>
                                        <p
                                            className="font-semibold text-sm mb-1"
                                            style={{ color: senderColor }}
                                        >
                                            {msg.sender_name}
                                        </p>
                                        {msg.content && <p className="text-sm mb-1 text-gray-800">{msg.content}</p>}
                                        {/* --- Sentiment Text Added --- */}
                                        <p className="text-xs mt-1 text-gray-600 opacity-80">Sentiment: {msg.sentiment} - {msg.importance}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            {/* --- Updated Timestamp Format --- */}
                                            <span className="text-xs text-gray-500 italic">{formatTimestamp(msg.timestamp_ms)}</span>
                                            {/* Animate Reactions */}
                                            {msg.reactions && msg.reactions.length > 0 && (
                                                <motion.div
                                                    className="flex space-x-1"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 20 }}
                                                >
                                                    {msg.reactions.map((r, i) => (
                                                        <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-200 rounded-full shadow-sm">{r.reaction}</span>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </React.Fragment>
                        );
                    })}
                </AnimatePresence>

                {impersonatedUser && currentMessageIndex >= filteredMessages.length && filteredMessages.length > 0 && (
                    <div className="text-center text-gray-500 italic py-4">End of story.</div>
                )}
            </div>

            {/* --- Controls Area --- */}
            <div className="mt-4 p-4 bg-gray-100 rounded-lg shadow-sm flex flex-col sm:flex-row items-center gap-4">
                <button
                    onClick={handlePauseResume}
                    disabled={!impersonatedUser} // Disable if no user selected
                    className={`px-4 py-2 rounded font-semibold text-white transition-colors duration-200 ${!impersonatedUser ? 'bg-gray-400 cursor-not-allowed' : (isPaused ? 'bg-blue-500 hover:bg-blue-600' : 'bg-yellow-500 hover:bg-yellow-600')}`}
                >
                    {isPaused ? (currentMessageIndex < filteredMessages.length ? 'Resume' : 'Restart') : 'Pause'}
                </button>
                <div className="flex-grow flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm text-gray-600">0</span>
                    <input
                        type="range"
                        min="0"
                        max={filteredMessages.length > 0 ? filteredMessages.length : 0} // Show up to the end
                        value={currentMessageIndex}
                        onChange={handleSliderChange} // Use onChange for broader compatibility, onInput for more real-time
                        disabled={!impersonatedUser || filteredMessages.length === 0}
                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex-grow"
                        aria-label="Story Progress"
                    />
                    <span className="text-sm text-gray-600">{filteredMessages.length}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">{currentMessageIndex} / {filteredMessages.length}</span>

            </div>
        </div>
    );
} 