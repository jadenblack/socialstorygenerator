import { getUploadByIdAction } from '@/app/actions/getUploadById';
import GenerateClientPage from './GenerateClientPage'; // Import the client component
import { notFound } from 'next/navigation';

interface GeneratePageParams {
    params: Promise<{
        uploadId: string;
    }>;
}

// This is the Server Component
export default async function GeneratePage({ params }: GeneratePageParams) {
    const { uploadId } = await params;

    if (!uploadId) {
        console.error("GeneratePage: No uploadId provided in params.");
        notFound(); // Or redirect to an error page/uploads page
    }

    const result = await getUploadByIdAction(uploadId);

    if (!result.success || !result.upload) {
        console.error(`GeneratePage: Failed to fetch upload ${uploadId}: ${result.message}`);
        notFound();
    }

    return (
        <GenerateClientPage
            initialUploadData={result.upload}
            uploadId={uploadId}
        />
    );
} 