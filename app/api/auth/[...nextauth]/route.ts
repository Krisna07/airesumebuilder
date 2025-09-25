// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client';
import type { JWT } from 'next-auth/jwt'
import type { Account } from 'next-auth'


const prisma = new PrismaClient();


const handleLogin = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('User not found, please register.');
  }
  if (!user.password) {
    throw new Error('User has no password set, use SSO login. or Sign up to set password.');
  }
  const bcrypt = await import('bcryptjs');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('Invalid credentials.');
  }
  return { id: user.id, email: user.email, name: user.name, image: user.image || null };
};

const handleOAuthUserRegister = async (email: string, name: string | null | undefined, image: string | null | undefined, provider: string, providerId: string) => {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        image: image ? image : `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name || email)}`,
        provider: provider || 'credentials',
        providerId: providerId || null
      },
    });
  } else {
    user = await prisma.user.update({
      where: { email: email },
      data: {
        email: email,
        name: name || email.split('@')[0],
        image: image ? image : `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name || email)}`,
        provider: provider || 'credentials',
        providerId: providerId || null
      },
    });
  }
  return {
    stored: true,
    ...user
  };

};

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      httpOptions: {
        timeout: 10000,
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Check if user exists in your database
          console.log('Authorizing user with email:', credentials.email)
          const user = await handleLogin(credentials.email, credentials.password)

          if (user) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image || null,
              provider: 'credentials',
              providerId: user.id
            }
          }

          return null
        } catch (error) {
          console.error('Auth error:', error)
          // Throw to let NextAuth handle the error properly and to ensure the return type is User | null
          throw new Error(error instanceof Error ? error.message : 'Login failed')
        }
      }
    })
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, account, user }: { token: JWT; account?: Account | null; user?: any }) {
      if (account) {
        ; token.provider = account.provider
          ; token.providerId = account.providerAccountId ?? account.id ?? null
      }

      if (token.provider && token.provider !== 'credentials') {
        if (token.id == token.providerId || token.providerId !== token.sub) {
          try {
            console.log('Handling OAuth user register/login for:', token.email)
            user = await handleOAuthUserRegister(token.email!, token.name, token.picture, token.provider, token.providerId as string)
          } catch (error) {
            console.log(error)
            return token
          }
        }
      }

      if (user?.id) (token.id = user.id)
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: JWT }) {
      if (session.user) {
        ; session.user.id = token.id as string | undefined
          ; session.user.provider = token.provider as string | undefined
          ; session.user.providerId = token.providerId as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/createuser', // Custom sign-in page
  },
  session: {
    strategy: 'jwt'
  },
  // debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }
