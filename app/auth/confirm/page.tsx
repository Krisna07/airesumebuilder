'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientSupabaseClient } from '@/lib/supabase-client'

export default function AuthConfirm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams?.get('code')
      const next = searchParams?.get('next') || '/dashboard'

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          console.error('Error during auth callback:', error)
          router.push('/auth?error=oauth_error')
        } else {
          router.push(next)
        }
      } else {
        router.push('/auth?error=no_code')
      }
    }

    handleAuthCallback()
  }, [searchParams, router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
