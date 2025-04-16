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
    const [displayedMessages, setDisplayedMessages] = useState<MessageWithSentiment[]>([]);
    const [currentMessageIndex, setCurrentMessageIndex] = useState<number>(0);
    const [isDisplaying, setIsDisplaying] = useState<boolean>(false);
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

    // Sort initial messages chronologically and filter based on vulgarity setting
    const sortedMessages = useMemo(() => {
        // Ensure messages are sorted by timestamp ascending
        return [...initialMessages].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
    }, [initialMessages]);

    const filteredMessages = useMemo(() => {
        const baseMessages = sortedMessages; // Use the sorted messages
        if (includeVulgar) {
            return baseMessages;
        } else {
            return baseMessages.filter(msg => !msg.vulgar);
        }
    }, [sortedMessages, includeVulgar]); // Depend on sortedMessages

    // Effect to handle message display timing
    useEffect(() => {
        // Clear any existing timeout if settings change or component unmounts
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Only proceed if displaying is active and there are more messages
        if (isDisplaying && currentMessageIndex < filteredMessages.length) {
            const message = filteredMessages[currentMessageIndex];
            const wordCount = countWords(message.content);
            const delay = Math.max(250, 250 * wordCount); // Minimum 250ms delay

            timeoutRef.current = setTimeout(() => {
                setDisplayedMessages(prev => [...prev, message]);
                setCurrentMessageIndex(prev => prev + 1);
            }, delay);
        }

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isDisplaying, currentMessageIndex, filteredMessages]);

    // Effect to scroll to the bottom when new messages are added
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [displayedMessages]);

    // Handler to start the story display
    const handleStartStory = (selectedUser: string) => {
        setImpersonatedUser(selectedUser);
        setDisplayedMessages([]); // Reset displayed messages
        setCurrentMessageIndex(0); // Reset index
        setIsDisplaying(true);
    };

    const handlePerspectiveChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedUser = event.target.value;
        if (selectedUser) {
            handleStartStory(selectedUser);
        } else {
            // Stop displaying if placeholder is selected
            setIsDisplaying(false);
            setImpersonatedUser(null);
            setDisplayedMessages([]);
            setCurrentMessageIndex(0);
        }
    };

    const handleVulgarityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        setIncludeVulgar(checked);
        // Optionally restart if perspective is already chosen
        if (impersonatedUser) {
            handleStartStory(impersonatedUser);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
            <h1 className="text-3xl font-bold mb-4 text-center">Story: {conversationTitle}</h1>

            {/* --- Settings --- */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6 px-4 py-3 bg-gray-100 rounded-lg shadow-sm">
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
                {impersonatedUser && displayedMessages.length === 0 && isDisplaying && (
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
                                        <p className="text-xs mt-1 text-gray-600 opacity-80">Sentiment: {msg.sentiment}</p>
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
                                        {/* Optional: Display importance for debugging */}
                                        {/* <p className="text-xs mt-1 text-gray-400">Importance: {msg.importance}</p> */}
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
        </div>
    );
} 