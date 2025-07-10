'use client'

import { User } from '@/types/types'
import { createContext, useContext, useEffect, useState } from 'react'

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


  useEffect(() => {
    const getUser = async () => {
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

    

  
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log(email, password)
  
  }

  const signUp = async (email: string, password: string) => {
    
    console.log(email, password)
    
    }
   
  

  const signOut = async () => {
    
  }

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    console.log(`Signing in with ${provider}`)
  }



  const value = {
    signInWithOAuth,
    loading,
    signIn,
    signUp,
    signOut,
    user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    console.log("there is no contextß")
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
