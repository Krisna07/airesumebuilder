import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";


export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: {
                    label: "Email/ Username",
                    type: "text",
                    placeholder: "jsmith",
                },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required.");
                }

                const existingUser = await db.user.findFirst({
                    where: {
                        OR: [{ email: credentials.email }]
                    },
                    include: { verification: true },
                });

                if (!existingUser) {
                    throw new Error(
                        JSON.stringify({
                            data: credentials,
                            message: "No user found with the provided credentials.",
                        })
                    );
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password,
                    existingUser.password
                );

                if (!passwordMatch) {
                    const userDetails = {
                        id: `${existingUser.id}`,
                        email: existingUser.email,
                    };
                    throw new Error(
                        JSON.stringify({
                            data: userDetails,
                            message: "Password does not match",
                        })
                    );
                }

                return {
                    id: `${existingUser.id}`,
                    email: existingUser.email,
                    image: existingUser.avatar,
                    verified: existingUser.verification?.verified || false,
                    timestamp: existingUser.createdAt, // Use createdAt instead of timestamp
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                return {
                    ...token,
                    email: user.email,
                    id: user.id,
                    timestamp: user.timestamp,
                    verified: user.verified,
                };
            }
            return token;
        },
        async session({ session, token }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    email: token.email,
                    timestamp: token.timestamp,
                    id: token.id,
                    isVerified: token.verified,
                },
            };
        },
    },
};

export async function getCurrentUser() {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    return user;
}