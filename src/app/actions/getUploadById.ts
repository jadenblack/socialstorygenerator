'use server';

import { connectToDatabase } from '@/lib/db';
import { ObjectId } from 'mongodb'; // Import ObjectId
import { getServerSession } from '@/lib/auth-server-utils';
import { UserUpload } from './getUploads'; // Reusing the type
import { Root } from '@/lib/instagram-models';

export interface GetUploadResult {
    success: boolean;
    upload?: UserUpload | null;
    message?: string;
}

export async function getUploadByIdAction(uploadId: string): Promise<GetUploadResult> {
    const session = await getServerSession();
    if (!session?.user?.id) {
        return { success: false, message: 'User not authenticated' };
    }

    if (!uploadId) {
        return { success: false, message: 'Upload ID is required' };
    }

    let userObjectId: ObjectId;
    let uploadObjectId: ObjectId;
    try {
        userObjectId = new ObjectId(session.user.id);
        uploadObjectId = new ObjectId(uploadId);
    } catch (error) {
        console.error('Invalid ID format:', error);
        return { success: false, message: 'Invalid ID format.' };
    }

    try {
        const { db } = await connectToDatabase();
        const uploadsCollection = db.collection('uploads');

        // Find the upload by ID and ensure it belongs to the logged-in user
        const upload = await uploadsCollection.findOne({
            _id: uploadObjectId,
            userId: userObjectId
        });

        if (!upload) {
            return { success: false, message: 'Upload not found or access denied' };
        }

        // Ensure data exists and is the correct type (assuming it's stored correctly)
        if (!upload.data || typeof upload.data !== 'object') {
            throw new Error('Upload data is missing or in an unexpected format.');
        }

        const resultUpload: UserUpload = {
            _id: upload._id.toString(),
            conversationTitle: upload.conversationTitle,
            participantCount: upload.participantCount,
            messageCount: upload.messageCount,
            data: upload.data as Root, // Cast to Root, assuming it's stored as an object
            createdAt: upload.createdAt,
            sentimentAnalysisResult: upload.sentimentAnalysisResult
        };

        return { success: true, upload: resultUpload };

    } catch (error) {
        console.error('Error fetching upload by ID:', error);
        let message = 'Failed to fetch upload.';
        if (error instanceof Error) {
            message = error.message;
        }
        return { success: false, message };
    }
} 