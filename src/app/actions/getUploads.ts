'use server';

import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { Root } from '@/lib/instagram-models'; // Import Root type if data field needs typing

// Define the structure of the returned upload document
export type UserUpload = {
    _id: string; // Or ObjectId if you prefer
    conversationTitle: string;
    participantCount: number;
    messageCount: number;
    createdAt: Date;
    data: Root; // The parsed JSON data
};

type GetUploadsResult = {
    success: boolean;
    message?: string;
    uploads?: UserUpload[];
};

/**
 * Fetches all uploads associated with a user ID.
 */
export async function getUploadsAction(userId: string): Promise<GetUploadsResult> {
    if (!userId) {
        return { success: false, message: 'User ID is required.' };
    }

    let userObjectId: ObjectId;
    try {
        userObjectId = new ObjectId(userId);
    } catch (error) {
        console.error('Invalid User ID format:', error);
        return { success: false, message: 'Invalid User ID format.' };
    }

    try {
        const { db } = await connectToDatabase();
        const uploadsCollection = db.collection('uploads');

        const uploads = await uploadsCollection.find(
            { userId: userObjectId },
            {
                projection: {
                    // Explicitly include fields needed, exclude large 'data' if not needed immediately
                    // Or include 'data' if it's needed for the dropdown functionality
                    conversationTitle: 1,
                    participantCount: 1,
                    messageCount: 1,
                    createdAt: 1,
                    data: 1 // Include data needed for the stats dropdown
                },
                sort: { createdAt: -1 } // Sort by newest first
            }
        ).toArray();

        // Convert ObjectId to string for serialization
        const serializedUploads = uploads.map((upload: any) => ({
            ...upload,
            _id: upload._id.toString(),
            // Ensure data is included if projected
            data: upload.data as Root // Cast data to the correct type
        })) as UserUpload[];

        return { success: true, uploads: serializedUploads };

    } catch (error) {
        console.error('Error fetching uploads from database:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'An internal server error occurred while fetching uploads.'
        };
    }
} 