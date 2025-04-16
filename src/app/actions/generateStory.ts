'use server';

import { z } from 'zod';
import { getUploadByIdAction } from './getUploadById'; // To fetch the full data
import { shouldSkip } from '@/lib/sentimentAnalysis'; // Import for server-side filtering
import { cleanContent } from '@/lib/sentimentAnalysis'; // Also import cleanContent if needed
import { Message } from '@/lib/instagram-models';
import { GenerateStoryResult } from '@/lib/apiTypes';

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

        // 3. Prepare messages for LLM (Example: clean and format)
        const preparedMessages = finalFilteredMessages.map(msg => ({
            sender: msg.sender_name,
            timestamp: new Date(msg.timestamp_ms).toISOString(),
            content: cleanContent(msg.content || '') // Use cleanContent
        }));

        console.log(`Prepared ${preparedMessages.length} messages for LLM.`);
        // console.log("Sample prepared message:", preparedMessages[0]);

        // --- Placeholder for actual story generation logic --- 
        // 4. Call the LLM with preparedMessages
        // 5. Handle the LLM response
        // --- End Placeholder ---

        // Simulate success for now
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate async work

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