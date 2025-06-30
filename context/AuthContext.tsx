'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // If user is authenticated, ensure they exist in our database
      if (user) {
        try {
          await fetch('/api/user/ensure', { method: 'POST' })
        } catch (error) {
          console.error('Error ensuring user in database:', error)
        }
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        // If user just signed in, ensure they exist in our database
        if (session?.user && event === 'SIGNED_IN') {
          try {
            await fetch('/api/user/ensure', { method: 'POST' })
          } catch (error) {
            console.error('Error ensuring user in database:', error)
          }
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard')}`,
      },
    })
    
    if (error) {
      // Handle specific Supabase errors with user-friendly messages
      if (error.message.includes('User already registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.')
      } else if (error.message.includes('Password should be at least')) {
        throw new Error('Password should be at least 6 characters long.')
      } else if (error.message.includes('Only a valid email address is allowed')) {
        throw new Error('Please enter a valid email address.')
      }
      throw error
    }
    
    // If user is returned but session is null, it means email confirmation is required
    if (data.user && !data.session) {
      // This is expected behavior when email confirmation is enabled
      return
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard')}`,
      },
    })
    if (error) throw error
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
