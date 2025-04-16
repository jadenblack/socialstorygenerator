import { getServerSession } from '@/lib/auth-server-utils';
import { getUploadsAction, UserUpload } from '@/app/actions/getUploads';
import UploadsTable from './UploadsTable';
import { redirect } from 'next/navigation'; // Import redirect
import Link from "next/link";

// This is now a Server Component
export default async function UploadsPage() {
    const session = await getServerSession();

    // Redirect if not logged in
    if (!session?.user?.id) {
        // Or display a login message/component
        // For simplicity, redirecting to login (adjust path if needed)
        redirect('/login?callbackUrl=/uploads');
    }

    let uploads: UserUpload[] = [];
    let error: string | null = null;

    try {
        const result = await getUploadsAction(session.user.id);
        if (result.success && result.uploads) {
            uploads = result.uploads;
        } else {
            error = result.message || 'Failed to fetch uploads.';
            console.error("Error fetching uploads:", error);
        }
    } catch (err) {
        console.error("Fetch uploads error:", err);
        error = err instanceof Error ? err.message : 'An unexpected error occurred while fetching uploads.';
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-black">My Uploads</h1>
                <Link href="/upload" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4! rounded no-style">
                    Upload More
                </Link>
            </div>

            {error ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            ) : (
                // UploadsTable is a Client Component and receives data via props
                <UploadsTable uploads={uploads} />
            )}
        </div>
    );
} 