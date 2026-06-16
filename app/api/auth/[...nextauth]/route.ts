// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { JWT } from 'next-auth/jwt'
import type { Account } from 'next-auth'
import { prisma } from '@/lib/prisma'

async function getUserIsAdmin(userId: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<Array<{ isAdmin: boolean | null }>>`
      SELECT "isAdmin"
      FROM "User"
      WHERE id = ${userId}
      LIMIT 1
    `

    return Boolean(rows[0]?.isAdmin)
  } catch {
    return false
  }
}

const handleLogin = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('User not found, please register.');
  }

  // Check if user is unverified and their account has expired (ttl passed)
  if (!user.isVerified && user.ttl) {
    const now = new Date();
    if (user.ttl < now) {
      throw new Error('ACCOUNT_EXPIRED');
    }
  }

  // Check if user account is deleted
  if (user.deletedAt) {
    throw new Error('ACCOUNT_DELETED');
  }

  if (!user.password) {
    throw new Error('User has no password set, use SSO login. or Sign up to set password.');
  }
  const bcrypt = await import('bcryptjs');
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('Invalid credentials.');
  }
  return { id: user.id, email: user.email, name: user.name, image: user.image || null, isVerified: user.isVerified ?? false };
};

const handleOAuthUserRegister = async (email: string, name: string | null | undefined, image: string | null | undefined, provider: string, providerId: string) => {
  let user = await prisma.user.findUnique({ where: { email } });
  const isNewUser = !user;
  let isRestoredAccount = false;

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        image: image ? image : `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name || email)}`,
        provider: provider || 'credentials',
        providerId: providerId || null,
        isVerified: true
      },
    });
  } else {
    // If user exists and has password - they should login with email/password, not OAuth
    if (user.password && !user.deletedAt) {
      throw new Error('EXISTING_ACCOUNT_WITH_PASSWORD');
    }

    // If user was deleted but within grace period, restore the account
    if (user.deletedAt) {
      const GRACE_PERIOD_DAYS = 15;
      const deletionDate = new Date(user.deletedAt);
      const expirationDate = new Date(deletionDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

      if (expirationDate > new Date()) {
        // Grace period still active - restore account
        user = await prisma.user.update({
          where: { email: email },
          data: {
            deletedAt: null,
            name: name || email.split('@')[0],
            image: image ? image : `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name || email)}`,
            provider: provider || 'credentials',
            providerId: providerId || null,
            isVerified: true
          },
        });
        isRestoredAccount = true;
      } else {
        // Grace period expired - cannot restore
        throw new Error('ACCOUNT_PERMANENTLY_DELETED');
      }
    } else {
      user = await prisma.user.update({
        where: { email: email },
        data: {
          email: email,
          name: name || email.split('@')[0],
          image: image ? image : `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(name || email)}`,
          provider: provider || 'credentials',
          providerId: providerId || null,
          isVerified: true
        },
      });
    }
  }

  // Send welcome email to new OAuth users
  if (isNewUser) {
    try {
      const { EmailService } = await import('@/utils/sendEmail');
      await EmailService.sendWelcomeEmail(email, user.name);
    } catch (error) {
      console.error('Failed to send welcome email to OAuth user:', error);
      // Don't throw error - user registration should succeed even if email fails
    }
  }

  // Send restoration email to restored accounts
  if (isRestoredAccount) {
    try {
      const { EmailService } = await import('@/utils/sendEmail');
      await EmailService.sendAccountRestoredEmail(email, user.name);
    } catch (error) {
      console.error('Failed to send account restored email:', error);
      // Don't throw error - restoration should succeed even if email fails
    }
  }

  return {
    stored: true,
    ...user
  };

};

export const authOptions = {
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
              providerId: user.id,
              isVerified: user.isVerified
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

            // Mark if account was restored
            if (user && !user.deletedAt && (user as any).isRestoredAccount) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              token.accountRestored = true
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'OAuth error';
            console.log('OAuth error:', errorMessage)

            // If existing account with password, mark token for redirection
            if (errorMessage === 'EXISTING_ACCOUNT_WITH_PASSWORD') {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              token.existingAccountError = true
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              token.userEmail = token.email
            }

            return token
          }
        }
      }

      if (user?.id) (token.id = user.id)
      // Propagate isVerified into the token on initial sign-in
      if (typeof user?.isVerified !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        token.isVerified = Boolean(user.isVerified)
      }

      // Recover token.id for older sessions that were minted before user.id was stored in JWT.
      if (!token.id && token.email) {
        try {
          const dbUserByEmail = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { id: true },
          })
          if (dbUserByEmail?.id) {
            token.id = dbUserByEmail.id
          }
        } catch (_err) {
          // No-op: token falls back to existing behavior.
        }
      }

      // Attach subscription plan to token (fallback to FREE if none)
      if (token.id && typeof token.plan === 'undefined') {
        try {
          const [sub, isAdmin] = await Promise.all([
            prisma.subscription.findUnique({
              where: { userId: token.id as string },
              select: { plan: true },
            }),
            getUserIsAdmin(token.id as string),
          ])
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          token.isAdmin = isAdmin
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          token.plan = sub?.plan ?? 'FREE'
        } catch (_err: unknown) {
          console.error('Error fetching subscription for token:', _err)
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          token.plan = token.plan ?? 'FREE'
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          token.isAdmin = Boolean(token.isAdmin)
        }
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: JWT }) {
      // Handle existing account with password error
      if ((token as any).existingAccountError) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        session.error = 'EXISTING_ACCOUNT_WITH_PASSWORD';
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        session.userEmail = (token as any).userEmail;
        return session;
      }

      if (session.user) {
        ; session.user.id = token.id as string | undefined
          ; session.user.provider = token.provider as string | undefined
          ; session.user.providerId = token.providerId as string | undefined
        // Ensure session reflects latest user profile and verification/plan state
        try {
          if (token.id) {
            const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } })
            session.user.name = dbUser?.name ?? session.user.name
            session.user.email = dbUser?.email ?? session.user.email
            session.user.image = dbUser?.image ?? session.user.image
            session.user.isVerified = dbUser?.isVerified ?? false
            session.user.isAdmin = await getUserIsAdmin(token.id as string)

            const dbSub = await prisma.subscription.findUnique({
              where: { userId: token.id as string },
              select: { plan: true },
            })
            session.user.plan = dbSub?.plan ?? 'FREE'
          } else {
            // fallback to token value if DB not available
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            session.user.isVerified = Boolean(token.isVerified)
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            session.user.plan = token.plan ?? 'FREE'
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            session.user.isAdmin = Boolean(token.isAdmin)
          }
        } catch (_err) {
          console.error('Error fetching user/session data:', _err)
          // fallback to token value
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          session.user.isVerified = Boolean(token.isVerified)
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          session.user.plan = token.plan ?? 'FREE'
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          session.user.isAdmin = Boolean(token.isAdmin)
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
  },
  session: {
    strategy: 'jwt' as const,
    // One week expiry for sessions (in seconds)
    maxAge: 60 * 60 * 24 * 7, // 7 days
    // How often to update the session age (in seconds)
    updateAge: 60 * 60 * 24 // 24 hours
  },
  // debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
