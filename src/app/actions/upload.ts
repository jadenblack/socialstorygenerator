'use server';

import { revalidatePath } from 'next/cache';
import { Root } from '@/lib/instagram-models';
import { processInstagramData, type InstagramStats } from '@/lib/processors';
import { Buffer } from 'buffer';

// Function to fix Instagram JSON encoding issues by replicating the
// Python `encode('raw_unicode_escape').decode('utf-8')` pattern.
function fixInstagramEncoding(text: string): string {
    try {
        // Stage 1: Unescape JSON \uXXXX sequences to get the literal characters.
        // This mimics part of what raw_unicode_escape does.
        let unescapedText = text.replace(/\\u([a-fA-F0-9]{4})/g, (match, grp) => {
            return String.fromCharCode(parseInt(grp, 16));
        });

        // Stage 2: Encode the string into bytes using Latin-1.
        // Latin-1 maps char codes 0-255 directly to byte values 0-255.
        // This treats the misinterpreted characters as their raw byte values.
        const latin1Buffer = Buffer.from(unescapedText, 'latin1');

        // Stage 3: Decode the bytes back into a string using UTF-8.
        // This interprets the raw bytes as the correct UTF-8 sequence.
        const utf8Text = latin1Buffer.toString('utf8');

        return utf8Text;
    } catch (error) {
        console.error("Error fixing Instagram encoding:", error);
        // Fallback to returning the original text if an error occurs
        return text;
    }
}

/**
 * Process the uploaded JSON file
 */
export async function processJsonFile(formData: FormData): Promise<{
    success: boolean;
    message?: string;
    data?: Root;
    stats?: InstagramStats;
}> {
    try {
        const file = formData.get('file') as File;

        if (!file) {
            return { success: false, message: 'No file uploaded' };
        }

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.json') && !file.type.includes('json')) {
            return { success: false, message: 'Only JSON files are allowed' };
        }

        // Read file content
        const content = await file.text();

        // --- FIX ENCODING ---
        const fixedContent = fixInstagramEncoding(content);
        // --- END FIX ---

        // Parse JSON
        let data: Root;
        try {
            // Use the fixed content for parsing
            data = JSON.parse(fixedContent);
        } catch (parseError) {
            console.error('JSON Parsing Error after fixing encoding:', parseError);
            console.error('Original content snippet:', content.substring(0, 500));
            console.error('Fixed content snippet:', fixedContent.substring(0, 500));
            // Fallback: try parsing original content? Or return specific error.
            try {
                console.log('Attempting to parse original content as fallback...');
                data = JSON.parse(content);
                console.warn('Successfully parsed original content after fixed content failed.');
            } catch (originalParseError) {
                console.error('Failed to parse even original content:', originalParseError);
                return { success: false, message: 'Invalid JSON format, even after attempting encoding fixes.' };
            }
        }

        // Validate the structure if needed
        if (!data.messages || !Array.isArray(data.messages) || !data.participants) {
            return { success: false, message: 'Invalid Instagram data format' };
        }

        // Process the data
        const stats = processInstagramData(data);

        // Revalidate the path to refresh the data on the client
        revalidatePath('/');

        return {
            success: true,
            data,
            stats
        };
    } catch (error) {
        console.error('Error processing file:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to process file'
        };
    }
} 