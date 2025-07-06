declare module "next-auth" {
    interface User {
        username: string;
        timestamp: int;
        verified: boolean;
    }
    interface Session {
        user: User & {
            username: string;
            timestamp: number;
        };
        token: {
            username: string;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        username?: string;
        timestamp?: number;
    }
}