'use server';
import { auth } from "./auth";
import { headers } from "next/headers";
export async function getServerSession() {
    'use server';
    const headersList = await headers();
    return auth.api.getSession({
        headers: headersList,
    });
}