
import { User } from "@/types/types";
import { authOptions } from "./auth";
import { getServerSession } from "next-auth";

export async function getCurrentUser() {
    const session: any = await getServerSession(authOptions);
    const user: User = session?.user;

    return user;
}