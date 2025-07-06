
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";

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
                        OR: [{ email: credentials.email },
                        { username: credentials.email }],
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
                        username: existingUser.username,
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
                    verified: existingUser.verification?.verified ?? false,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                return {
                    ...token,
                    username: user.username,
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
                    username: token.username,
                    timestamp: token.timestamp,
                    id: token.id,
                    isVerified: token.verified,
                },
            };
        },
    },
};