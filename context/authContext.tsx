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
  verificationExpiresAt: string | null
  getVerificationStatus: (forceRefresh?: boolean) => Promise<{ isVerified: boolean; expiresAt: string | null }>
  isGuest: boolean
  migrateGuestData: () => Promise<void>
  subscription: Subscription | null
  getSubscription: (forceRefresh?: boolean) => Promise<Subscription | null>
  setSubscriptionPlan: (plan: 'FREE' | 'SUPPORTER' | 'ULTIMATE') => Promise<Subscription | null>
  incrementUsage: (key: IncrementKey, amount?: number) => Promise<Subscription | null>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const VERIFICATION_CACHE_KEY = 'auth:verification:cache:v1'
const VERIFICATION_INACTIVITY_MS = 60 * 60 * 1000

type VerificationCachePayload = {
  email: string
  isVerified: boolean
  expiresAt: string | null
  lastCheckedAt: number
  lastActiveAt: number
}

const readVerificationCache = (email: string | null | undefined): VerificationCachePayload | null => {
  if (typeof window === 'undefined' || !email) return null

  try {
    const raw = sessionStorage.getItem(VERIFICATION_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as VerificationCachePayload

    if (parsed.email !== email) {
      sessionStorage.removeItem(VERIFICATION_CACHE_KEY)
      return null
    }

    if (!parsed.lastActiveAt || Date.now() - parsed.lastActiveAt > VERIFICATION_INACTIVITY_MS) {
      sessionStorage.removeItem(VERIFICATION_CACHE_KEY)
      return null
    }

    return parsed
  } catch {
    sessionStorage.removeItem(VERIFICATION_CACHE_KEY)
    return null
  }
}

const writeVerificationCache = (payload: { email: string; isVerified: boolean; expiresAt: string | null }) => {
  if (typeof window === 'undefined') return
  const now = Date.now()
  const cachePayload: VerificationCachePayload = {
    ...payload,
    lastCheckedAt: now,
    lastActiveAt: now,
  }
  sessionStorage.setItem(VERIFICATION_CACHE_KEY, JSON.stringify(cachePayload))
}

const touchVerificationCache = (email: string | null | undefined) => {
  if (typeof window === 'undefined' || !email) return
  const current = readVerificationCache(email)
  if (!current) return
  current.lastActiveAt = Date.now()
  sessionStorage.setItem(VERIFICATION_CACHE_KEY, JSON.stringify(current))
}

const clearVerificationCache = () => {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(VERIFICATION_CACHE_KEY)
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [verificationExpiresAt, setVerificationExpiresAt] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const subscriptionRef = useRef<Subscription | null>(null)
  const verificationInflightRef = useRef<Promise<{ isVerified: boolean; expiresAt: string | null }> | null>(null)
  const sessionUser = session?.user

  const sessionDerivedUser = useMemo<User | null>(() => {
    if (!sessionUser?.id) {
      return null
    }

    return {
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email,
      image: sessionUser.image,
      isVerified: sessionUser.isVerified || false,
      plan: sessionUser.plan ?? 'FREE',
      isAdmin: sessionUser.isAdmin ?? false,
    }
  }, [sessionUser])

  const toast = useToast()
  const effectiveUser = useMemo<User | null>(() => user ?? sessionDerivedUser, [user, sessionDerivedUser])
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

  const getVerificationStatus = useCallback(async (forceRefresh = false) => {
    const email = effectiveUser?.email
    const alreadyVerified = Boolean(effectiveUser?.isVerified)

    if (!email) {
      return { isVerified: false, expiresAt: null }
    }

    if (alreadyVerified) {
      setVerificationExpiresAt(null)
      writeVerificationCache({ email, isVerified: true, expiresAt: null })
      return { isVerified: true, expiresAt: null }
    }

    const cached = !forceRefresh ? readVerificationCache(email) : null
    if (cached) {
      setVerificationExpiresAt(cached.expiresAt)
      return { isVerified: cached.isVerified, expiresAt: cached.expiresAt }
    }

    if (verificationInflightRef.current) {
      return verificationInflightRef.current
    }

    verificationInflightRef.current = (async () => {
      try {
        const url = `/api/auth/verification?email=${encodeURIComponent(email)}`
        const resp = await fetch(url)
        if (!resp.ok) {
          return { isVerified: false, expiresAt: null }
        }

        const data = await resp.json()
        const nextExpiresAt = data?.verification?.expiresAt ?? null
        setVerificationExpiresAt(nextExpiresAt)
        writeVerificationCache({ email, isVerified: false, expiresAt: nextExpiresAt })
        return { isVerified: false, expiresAt: nextExpiresAt }
      } catch (err) {
        console.error('Error fetching verification status:', err)
        return { isVerified: false, expiresAt: null }
      } finally {
        verificationInflightRef.current = null
      }
    })()

    return verificationInflightRef.current
  }, [effectiveUser?.email, effectiveUser?.isVerified])

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
    const email = effectiveUser?.email
    if (!email) {
      setVerificationExpiresAt(null)
      return
    }

    const cached = readVerificationCache(email)
    if (cached) {
      setVerificationExpiresAt(cached.expiresAt)
      if (cached.isVerified) {
        setUser(prev => (prev ? { ...prev, isVerified: true } : prev))
      }
      return
    }

    void getVerificationStatus(false)
  }, [effectiveUser?.email, getVerificationStatus])

  useEffect(() => {
    const email = effectiveUser?.email
    if (!email) return

    const onActivity = () => touchVerificationCache(email)
    const events: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll']
    events.forEach((eventName) => window.addEventListener(eventName, onActivity, { passive: true }))

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        onActivity()
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, onActivity))
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [effectiveUser?.email])

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
  const isGuest = !effectiveUser && !loading

  const logOut = async () => {
    setUser(null);
    clearVerificationCache()
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
      if (!effectiveUser?.email) {
        toast.showToast('No user email available for verification', 'error', 3000)
        return false
      }

      const resp = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: effectiveUser.email, code }),
      })

      const result = await resp.json()
      if (!resp.ok) {
        toast.showToast(result.error || 'Verification failed', 'error', 3000)
        return false
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, isVerified: true } : prev)
      if (effectiveUser?.email) {
        writeVerificationCache({ email: effectiveUser.email, isVerified: true, expiresAt: null })
      }
      setVerificationExpiresAt(null)
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
      if (!effectiveUser?.email) {
        toast.showToast('No user email available to resend code', 'error', 3000)
        return null
      }

      const resp = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: effectiveUser.email }),
      })

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        toast.showToast(body.error || 'Failed to resend code', 'error', 3000)
        return null
      }

      const data = await resp.json()
      const nextExpiresAt = data.expiresAt ?? null
      if (effectiveUser?.email) {
        writeVerificationCache({ email: effectiveUser.email, isVerified: false, expiresAt: nextExpiresAt })
      }
      setVerificationExpiresAt(nextExpiresAt)
      toast.showToast('Verification code resent', 'success', 2500)
      return { expiresAt: nextExpiresAt }
    } catch (err) {
      console.error('Error resending verification code', err)
      toast.showToast('Error resending code', 'error', 3000)
      return null
    }
  }
  return (
    <AuthContext.Provider value={{
      user: effectiveUser,
      loading,
      signIn,
      logOut,
      isGuest,
      register,
      verifyCode,
      resendVerification,
      verificationExpiresAt,
      getVerificationStatus,
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
