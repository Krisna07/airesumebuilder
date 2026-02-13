// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email: string | null
      image?: string | null
      provider: string | null
      providerId?: string | null
      isVerified?: boolean | null
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
  }
}