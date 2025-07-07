import NextAuth from "next-auth";

declare module "next-auth" {
    interface User {
        email: string;
        timestamp: int;
        verified: boolean;
    }
    interface Session {
        user: User & {
            email: string;
            timestamp: number;
        };
        token: {
            email: string;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        email?: string;
        timestamp?: number;
    }
}