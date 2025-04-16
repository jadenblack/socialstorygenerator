'use server';

import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/db';
import { revalidatePath } from 'next/cache';

/**
 * Delete an upload by its ID
 */
export async function deleteUploadAction(uploadId: string): Promise<{
    success: boolean;
    message?: string;
}> {
    try {
        // Validate the upload ID
        if (!uploadId || typeof uploadId !== 'string') {
            return { success: false, message: 'Invalid upload ID' };
        }

        // Connect to the database
        const { db } = await connectToDatabase();

        // Delete the upload document
        const result = await db.collection('uploads').deleteOne({
            _id: new ObjectId(uploadId)
        });

        if (result.deletedCount === 0) {
            return { success: false, message: 'Upload not found' };
        }

        // Revalidate the /uploads path to refresh the UI
        revalidatePath('/uploads');

        return {
            success: true,
            message: 'Upload deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting upload:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete upload'
        };
    }
} 