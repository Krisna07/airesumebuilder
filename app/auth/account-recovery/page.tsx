'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/authContext'
import { useToast } from '@/context/PopupContext'
import Button from '@/components/Ui/Button'
import Input from '@/components/Input'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function AccountRecoveryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToast()

  const [step, setStep] = useState<'verify' | 'restoring' | 'success'>('verify')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)

  // Simulate checking grace period - in real app, this info comes from API
  useEffect(() => {
    if (user?.email) {
      // Calculate days remaining (you might want to fetch this from an API)
      // For now, we'll estimate based on the grace period
      setDaysRemaining(15)
    }
  }, [user])

  const handleRestore = async () => {
    if (!password) {
      setError('Please enter your password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/account/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 410) {
          setError('Grace period has expired. Your account cannot be restored.')
        } else {
          setError(data.error || 'Failed to restore account')
        }
        setLoading(false)
        return
      }

      setStep('restoring')
      
      // Show success message
      setTimeout(() => {
        setStep('success')
        toast.showToast('Account restored successfully!', 'success', 2000)
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/builder')
        }, 2000)
      }, 1500)
    } catch (err) {
      console.error(err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="w-full max-w-md">
        {step === 'verify' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-8 space-y-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">Account Deleted</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {daysRemaining && `You have ${daysRemaining} days to restore your account`}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
                Restore Your Account
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-center text-sm">
                Enter your password to restore access to your account and all your data.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
              />

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRestore}
                disabled={loading || !password}
                variant="primary"
                size="large"
                className="w-full"
              >
                {loading ? 'Restoring...' : 'Restore Account'}
              </Button>
              <Button
                onClick={() => router.push('/auth/signin')}
                disabled={loading}
                variant="secondary"
                size="medium"
                className="w-full"
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              After 15 days, your account and all data will be permanently deleted.
            </p>
          </div>
        )}

        {step === 'restoring' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-8 space-y-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
            <p className="text-center text-slate-600 dark:text-slate-400 font-medium">
              Restoring your account...
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-8 space-y-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-center">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-full p-3">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Account Restored!
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Redirecting to your dashboard...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
