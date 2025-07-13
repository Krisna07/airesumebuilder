'use client';

import { User } from '@/types/types';
import { createContext, useContext, useEffect, useState } from 'react';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const loading = status === 'loading';

  useEffect(() => {
    if (session?.user) {
      // Transform NextAuth session to your User type
      setUser({
        id: session.user.id,
        email: session.user.email!,
        avatar: session.user.image,
        verified: session.user.verified || false,
        createdAt: session.user.timestamp || new Date()
        // Add other User properties as needed
      } as User);
    } else {
      setUser(null);
    }
  }, [session]);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await nextAuthSignIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        // Parse error message if it's JSON
        try {
          const errorData = JSON.parse(result.error);
          return { success: false, error: errorData.message };
        } catch {
          return { success: false, error: result.error };
        }
      }

      if (result?.ok) {
        router.push('/dashboard');
        return { success: true };
      }

      return { success: false, error: 'Sign in failed' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during sign in'
      };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Sign up failed' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during sign up'
      };
    }
  };

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false });
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    await nextAuthSignIn(provider, { callbackUrl: '/dashboard' });
  };

  const value = {
    signInWithOAuth,
    loading,
    signIn,
    signUp,
    signOut,
    user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
