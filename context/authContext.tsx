// context/authContext.tsx - Enhanced version
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useSession, signIn, signOut, getSession } from 'next-auth/react'
import { RegisterData, UserService } from '@/services/userService'

interface User {
  id: string
  email: string | null
  name?: string | null
  password?: string | null
  image?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: typeof signIn
  signOut: typeof signOut
  register: (user: RegisterData) => Promise<void>
  isGuest: boolean
  migrateGuestData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const sessionUser = session?.user

  const register = async (user: RegisterData) => {
    // console.log(user)
    const response = await UserService.createUser(user)
    if (!response.ok) {
      console.log(response)
      return
    }
    const signInResult = await signIn('credentials', {
      email: user.email,
      password: user.password,
      redirect: false,
    })
    if (signInResult?.ok) {
      const refreshed = await getSession()
      if (refreshed?.user) {
        setUser({
          id: refreshed.user.id!,
          name: refreshed.user.name ?? undefined,
          email: refreshed.user.email ?? null,
          image: refreshed.user.image ?? undefined,
        })
      }
    }
  }

  useEffect(() => {
    const getUser = async () => {
      if (!sessionUser) {
        return
      }
      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          name: sessionUser.name,
          email: sessionUser.email,
          image: sessionUser.image
        })
        if (sessionUser.provider !== 'credential') {
          const registerData: RegisterData = sessionUser
          await register(registerData)
        }
      } else { setUser(null) }
    }
    getUser()
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
