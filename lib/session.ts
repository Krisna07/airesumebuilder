import { getServerSession, User } from "next-auth";
import { authOptions } from "./auth";


export async function getCurrentUser() {
    const session: any = await getServerSession(authOptions);
    const user: User = session?.user;
    if (!user) {
        return null; // Return null if no user is found
    }
    return user;
}