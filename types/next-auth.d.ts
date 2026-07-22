// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    error?: string
    userEmail?: string | null
    user: {
      id: string
      name?: string | null
      email: string | null
      image?: string | null
      provider: string | null
      providerId?: string | null
      isVerified?: boolean | null
      isAdmin?: boolean
      plan?: 'FREE' | 'SUPPORTER' | 'ULTIMATE'
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    provider?: string
    providerId?: string
    plan?: 'FREE' | 'SUPPORTER' | 'ULTIMATE'
    isVerified?: boolean
    isAdmin?: boolean
    existingAccountError?: boolean
    userEmail?: string | null
  }
}