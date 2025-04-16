'use server';

import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

type SaveUploadParams = {
    userId: string;
    jsonData: string;
    conversationTitle: string;
    participantCount: number;
    messageCount: number;
}

type SaveUploadResult = {
    success: boolean;
    message?: string;
    uploadId?: string;
};

/**
 * Saves the uploaded JSON data associated with a user.
 */
export async function saveUploadAction({
    userId,
    jsonData,
    conversationTitle,
    participantCount,
    messageCount
}: SaveUploadParams): Promise<SaveUploadResult> {
    if (!userId || !jsonData || !conversationTitle || participantCount === undefined || messageCount === undefined) {
        return { success: false, message: 'User ID, JSON data, title, participant count, and message count are required.' };
    }

    try {
        const { db } = await connectToDatabase();
        const uploadsCollection = db.collection('uploads');

        let parsedData;
        try {
            parsedData = JSON.parse(jsonData);
        } catch (error) {
            console.error('Error parsing JSON data:', error);
            return { success: false, message: 'Invalid JSON data format provided.' };
        }

        const result = await uploadsCollection.insertOne({
            userId: new ObjectId(userId), // Assuming userId is a MongoDB ObjectId string
            conversationTitle, // Save the title
            participantCount,  // Save participant count
            messageCount,      // Save message count
            data: parsedData,
            createdAt: new Date(),
        });

        if (result.insertedId) {
            console.log(`Upload saved successfully for user ${userId} with ID ${result.insertedId}`);
            return { success: true, uploadId: result.insertedId.toString() };
        } else {
            console.error('Failed to insert upload document for user:', userId);
            return { success: false, message: 'Failed to save the upload to the database.' };
        }

    } catch (error) {
        console.error('Error saving upload to database:', error);
        // Handle potential ObjectId conversion error
        if (error instanceof Error && error.message.includes('Argument passed in must be a string of 12 bytes or a string of 24 hex characters')) {
            return { success: false, message: 'Invalid User ID format.' };
        }
        return {
            success: false,
            message: error instanceof Error ? error.message : 'An internal server error occurred while saving the upload.'
        };
    }
} 