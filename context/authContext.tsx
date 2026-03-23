// context/authContext.tsx - Enhanced version
'use client'
import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useSession, signIn, getSession, signOut } from 'next-auth/react'
import { RegisterData, UserService } from '@/services/userService'
import { useToast } from './PopupContext'
import type { IncrementKey, Subscription } from '@/types/subscription'

interface User {
  id: string
  email: string | null
  name?: string | null
  password?: string | null
  image?: string | null
  isVerified?: boolean
  plan?: 'FREE' | 'SUPPORTER' | 'ULTIMATE'
  isAdmin?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: typeof signIn
  logOut: () => Promise<void>
  register: (user: RegisterData) => Promise<void>
  verifyCode: (code: string) => Promise<boolean>
  resendVerification: () => Promise<{ expiresAt?: string | null } | null>
  isGuest: boolean
  migrateGuestData: () => Promise<void>
  subscription: Subscription | null
  getSubscription: (forceRefresh?: boolean) => Promise<Subscription | null>
  setSubscriptionPlan: (plan: 'FREE' | 'SUPPORTER' | 'ULTIMATE') => Promise<Subscription | null>
  incrementUsage: (key: IncrementKey, amount?: number) => Promise<Subscription | null>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const subscriptionRef = useRef<Subscription | null>(null)
  const sessionUser = session?.user

  const toast = useToast()
  const register = async (user: RegisterData) => {
    const response = await UserService.createUser(user)
    const data = await response.json()
    console.log(data)
    if (!response.ok) {
      toast.showToast(`${data.error}`, 'error', 3000)
      return data
    }
    if (data.data.provider !== 'credentials') {
      return
    }
    // verification data is stored server-side in the Verification table
    const signInResult = await signIn('credentials', {
      email: user.email,
      password: user.password,
      redirect: false,
    })

    if (signInResult?.ok) {
      const refreshed = await getSession()
      console.log(refreshed)
      if (refreshed?.user) {
        setUser({
          id: refreshed.user.id!,
          name: refreshed.user.name ?? undefined,
          email: refreshed.user.email ?? null,
          image: refreshed.user.image ?? undefined,
          isVerified: refreshed.user.isVerified || false,
          plan: refreshed.user.plan ?? 'FREE',
          isAdmin: refreshed.user.isAdmin ?? false
        })
      }
      window.location.href = '/builder'

    }

  }

  useEffect(() => {
    subscriptionRef.current = subscription
  }, [subscription])

  const getSubscription = useCallback(async (forceRefresh = false) => {
    // Deduplicate in-flight requests and throttle refreshes
    const inflightRef = (getSubscription as unknown as { inflight?: Promise<Subscription | null>; lastFetch?: number })
    const now = Date.now()
    const THROTTLE_MS = 2000
    try {
      if (!forceRefresh && subscriptionRef.current) return subscriptionRef.current
      if (inflightRef.inflight) return inflightRef.inflight
      if (inflightRef.lastFetch && now - inflightRef.lastFetch < THROTTLE_MS) {
        return subscriptionRef.current
      }
      inflightRef.lastFetch = now
      inflightRef.inflight = (async () => {
        const resp = await fetch('/api/subscription')
        inflightRef.inflight = undefined
        if (!resp.ok) return null
        const data = await resp.json()
        setSubscription(data)
        return data
      })()
      return inflightRef.inflight
    } catch (err) {
      console.error('Error fetching subscription', err)
      inflightRef.inflight = undefined
      return null
    }
  }, [])

  const setSubscriptionPlan = useCallback(async (plan: 'FREE' | 'SUPPORTER' | 'ULTIMATE') => {
    try {
      const resp = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })
      if (!resp.ok) return null
      const updated = await resp.json()
      setSubscription(updated)
      setUser(prev => prev ? { ...prev, plan: updated.plan } : prev)
      const refreshed = await getSession()
      if (refreshed?.user?.plan) {
        setUser(prev => prev ? { ...prev, plan: refreshed.user.plan } : prev)
      }
      return updated
    } catch (err) {
      console.error('Error setting subscription plan', err)
      return null
    }
  }, [])

  const incrementUsage = useCallback(async (key: IncrementKey, amount = 1) => {
    try {
      const resp = await fetch('/api/subscription/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, amount })
      })
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to increment usage')
      }
      const updated = await resp.json()
      setSubscription(updated)
      return updated
    } catch (err) {
      console.error('Error incrementing usage', err)
      toast.showToast((err as Error).message || 'Error incrementing usage', 'error', 3000)
      return null
    }
  }, [toast])

  const refreshUser = useCallback(async () => {
    const refreshed = await getSession()
    if (refreshed?.user) {
      setUser({
        id: refreshed.user.id!,
        name: refreshed.user.name ?? undefined,
        email: refreshed.user.email ?? null,
        image: refreshed.user.image ?? undefined,
        isVerified: refreshed.user.isVerified || false,
        plan: refreshed.user.plan ?? 'FREE'
      })
      // refresh subscription from server so Account page reflects plan changes immediately
      await getSubscription(true)
    }
  }, [getSubscription])

  useEffect(() => {
    const getUser = async () => {
      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          name: sessionUser.name,
          email: sessionUser.email,
          image: sessionUser.image,
          isVerified: sessionUser.isVerified || false,
          plan: sessionUser.plan ?? 'FREE',
          isAdmin: sessionUser.isAdmin ?? false
        })
      }
    }
    getUser()
  }, [sessionUser])

  useEffect(() => {
    if (user?.id && !subscription) {
      getSubscription(true)
    }
  }, [user?.id, subscription, getSubscription])

  const migrateGuestData = async () => {
    //disabling thr function 
    return
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

  const logOut = async () => {
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.clear()
    // Prevent NEXTAUTH_URL from forcing prod domain; we handle redirect manually
    await signOut({ redirect: false })
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  };

  // Verify a code entered by the user. This compares the code with the
  // verification object in sessionStorage, and if it matches calls the
  // server to mark the user verified and updates local user state.
  const verifyCode = async (code: string) => {
    try {
      if (!user?.email) {
        toast.showToast('No user email available for verification', 'error', 3000)
        return false
      }

      const resp = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, code }),
      })

      const result = await resp.json()
      if (!resp.ok) {
        toast.showToast(result.error || 'Verification failed', 'error', 3000)
        return false
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, isVerified: true } : prev)
      toast.showToast('Email verified successfully!', 'success', 3000)
      return true
    } catch (err) {
      console.error('Error verifying code:', err)
      toast.showToast('Error verifying code', 'error', 3000)
      return false
    }
  }

  const resendVerification = async () => {
    try {
      if (!user?.email) {
        toast.showToast('No user email available to resend code', 'error', 3000)
        return null
      }

      const resp = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        toast.showToast(body.error || 'Failed to resend code', 'error', 3000)
        return null
      }

      const data = await resp.json()
      toast.showToast('Verification code resent', 'success', 2500)
      return { expiresAt: data.expiresAt }
    } catch (err) {
      console.error('Error resending verification code', err)
      toast.showToast('Error resending code', 'error', 3000)
      return null
    }
  }
  const userDetail = useMemo(() => (user), [user])

  return (
    <AuthContext.Provider value={{
      user: userDetail,
      loading,
      signIn,
      logOut,
      isGuest,
      register,
      verifyCode,
      resendVerification,
      subscription,
      getSubscription,
      setSubscriptionPlan,
      incrementUsage,
      refreshUser,
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
