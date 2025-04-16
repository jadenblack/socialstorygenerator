'use server';

import { getUploadByIdAction } from '@/app/actions/getUploadById';
import StoryClientPage from './StoryClientPage'; // Import the client component
import { notFound, redirect } from 'next/navigation';
import { UserUpload } from '@/app/actions/getUploads';

interface StoryPageParams {
    params: Promise<{ // No promise here, Next.js resolves it
        uploadId: string;
    }>;
}

// This is the Server Component
export default async function StoryPage({ params }: StoryPageParams) {
    const { uploadId } = await params;

    if (!uploadId) {
        console.error("StoryPage: No uploadId provided in params.");
        notFound();
    }

    const result = await getUploadByIdAction(uploadId);

    if (!result.success || !result.upload) {
        console.error(`StoryPage: Failed to fetch upload ${uploadId}: ${result.message}`);
        // Maybe redirect to uploads page with an error message?
        notFound(); // Keep it simple for now
    }

    // Crucially, check if sentiment analysis data exists
    if (!result.upload.sentimentAnalysisResult || result.upload.sentimentAnalysisResult.messages.length === 0) {
        console.warn(`StoryPage: Upload ${uploadId} exists but has no sentiment analysis data. Redirecting to generate page.`);
        // Redirect back to the generate page if sentiment data is missing
        redirect(`/generate/${uploadId}?error=no_sentiment_data`);
    }

    // Combine message data with sentiment analysis results
    const sentimentMap = new Map(result.upload.sentimentAnalysisResult.messages.map(s => [s.id, s]));

    const messagesWithSentiment = result.upload.data.messages
        .map(msg => {
            // Use timestamp_ms as the ID, assuming it's consistent with how sentiment analysis IDs were generated
            const sentiment = sentimentMap.get(String(msg.timestamp_ms));
            if (sentiment) {
                // Combine the original message with its sentiment analysis
                return { ...msg, ...sentiment };
            }
            return null; // Filter out messages that weren't analyzed (e.g., 'liked a message') or had errors
        })
        .filter(msg => msg !== null);


    // Pass only the necessary data to the client
    const initialClientData = {
        participants: result.upload.data.participants,
        messagesWithSentiment: messagesWithSentiment,
        conversationTitle: result.upload.conversationTitle,
    };

    return (
        <StoryClientPage initialData={initialClientData} />
    );
} 