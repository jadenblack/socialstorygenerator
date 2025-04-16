'use server';

import { z } from 'zod';
import { ObjectId } from 'mongodb'; // Import ObjectId
import { connectToDatabase } from '@/lib/db'; // Import db connection
import { getUploadByIdAction } from './getUploadById'; // To fetch the full data
import { shouldSkip } from '@/lib/sentimentAnalysis'; // Import for server-side filtering
import { Message } from '@/lib/instagram-models';
import { GenerateStoryResult } from '@/lib/apiTypes';
import { analyzeChatSentiment } from '@/lib/sentimentAnalysis';

// Define the expected input schema using Zod for validation
const GenerateStoryInputSchema = z.object({
    uploadId: z.string(),
    startDate: z.string().datetime(), // Expect ISO string format
    endDate: z.string().datetime(),   // Expect ISO string format
    selectedParticipants: z.array(z.string()),
});

export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

export async function generateStoryAction(input: GenerateStoryInput): Promise<GenerateStoryResult> {
    // Validate input against the schema
    const validationResult = GenerateStoryInputSchema.safeParse(input);
    if (!validationResult.success) {
        console.error("Invalid input for generateStoryAction:", validationResult.error.errors);
        return {
            success: false,
            message: `Invalid input: ${validationResult.error.errors.map(e => e.message).join(', ')}`
        };
    }

    const { uploadId, startDate, endDate, selectedParticipants } = validationResult.data;

    console.log("Generating story with the following parameters:");
    console.log("Upload ID:", uploadId);
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);
    console.log("Selected Participants:", selectedParticipants);

    try {
        // 1. Fetch full upload data
        const uploadResult = await getUploadByIdAction(uploadId);
        if (!uploadResult.success || !uploadResult.upload) {
            return { success: false, message: uploadResult.message || "Failed to fetch upload data for story generation." };
        }
        const allMessages = uploadResult.upload.data.messages;

        // 2. Perform SERVER-SIDE filtering (including shouldSkip)
        const startTimestamp = new Date(startDate).getTime();
        const endTimestamp = new Date(endDate).getTime(); // Assuming ISO strings

        const finalFilteredMessages = allMessages.filter((msg: Message) => {
            if (!msg.content || !msg.sender_name || !msg.timestamp_ms) {
                return false;
            }
            // Apply shouldSkip here
            if (shouldSkip(msg.content)) {
                return false;
            }
            // Filter by date
            if (msg.timestamp_ms < startTimestamp || msg.timestamp_ms > endTimestamp) {
                return false;
            }
            // Filter by participant
            if (!selectedParticipants.includes(msg.sender_name)) {
                return false;
            }
            return true;
        });

        const finalFilteredMessageCount = finalFilteredMessages.length;

        if (finalFilteredMessageCount === 0) {
            return { success: false, message: "No messages match the selected filters after applying all rules.", data: { story: "", filteredMessageCount: 0 } };
        }

        const data = uploadResult.upload.data;
        data.messages = finalFilteredMessages;
        const sentimentResult = await analyzeChatSentiment(data);

        if (sentimentResult) {
            try {
                const { db } = await connectToDatabase();
                const uploadsCollection = db.collection('uploads');
                const updateResult = await uploadsCollection.updateOne(
                    { _id: new ObjectId(uploadId) },
                    { $set: { sentimentAnalysisResult: sentimentResult } }
                );

                if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 1) {
                    console.log(`Sentiment analysis result for upload ${uploadId} already exists or is the same.`);
                } else if (updateResult.matchedCount === 0) {
                    console.warn(`Upload with ID ${uploadId} not found for updating sentiment analysis.`);
                    // Optionally return an error or specific message here
                } else {
                    console.log(`Successfully saved sentiment analysis result for upload ${uploadId}.`);
                }
            } catch (dbError) {
                console.error("Error saving sentiment analysis result to database:", dbError);
                // Decide if this should be a fatal error for the action
                // For now, we'll log it but continue to return the story placeholder
            }
        } else {
            console.warn(`Sentiment analysis failed for upload ${uploadId}, result not saved.`);
            // Optionally return a specific error message if sentiment analysis failure should stop the process
        }

        return {
            success: true,
            message: `Story generation request processed. ${finalFilteredMessageCount} messages were used. (Placeholder)`,
            data: {
                story: `This is a placeholder story based on your ${finalFilteredMessageCount} filtered messages.`,
                filteredMessageCount: finalFilteredMessageCount
            }
        };

    } catch (error) {
        console.error("Error during story generation process:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "An unexpected error occurred during story generation."
        };
    }
} 