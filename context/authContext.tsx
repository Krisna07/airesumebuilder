// context/authContext.tsx - Enhanced version
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'

interface User {
  id: string
  name?: string | null
  password?: string | null
  email: string | null
  image?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: typeof signIn
  signOut: typeof signOut
  register: (user: {
    id?: string,
    email: string,
    password: string,
    image?: string
  }) => void
  isGuest: boolean
  migrateGuestData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)


  const register = (user: {
    id?: string,
    email: string,
    password: string,
    image?: string
  }) => {
    console.log(user)
  }

  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      })

    } else {
      setUser(null)
    }
  }, [session])

  const migrateGuestData = async () => {
    // Migrate localStorage resumes to authenticated user account
    const guestResumes = Object.keys(localStorage)
      .filter(key => key.length === 36) // UUID format
      .map(key => ({
        id: key,
        data: JSON.parse(localStorage.getItem(key) || '{}')
      }))

    if (guestResumes.length > 0 && user) {
      // Send to your API to save
      await fetch('/api/resume/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumes: guestResumes })
      })

      // Clear localStorage after migration
      guestResumes.forEach(resume => localStorage.removeItem(resume.id))
    }
  }

  const loading = status === 'loading'
  const isGuest = !user && !loading

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
      isGuest,
      register,
      migrateGuestData
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
