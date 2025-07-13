import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

// Replace any with proper type
export async function getSession() {
    return await getServerSession(authOptions);
}

// Or if you need the user specifically:
export async function getCurrentUser() {
    const session = await getServerSession(authOptions);
    return session?.user || null;
}