'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/authContext'
import { useToast } from '@/context/PopupContext'
import SubscriptionStatus from '@/components/SubscriptionStatus'
import Button from '@/components/Ui/Button'
import Input from '@/components/Input'

const AccountPage = () => {
  const { user, refreshUser, logOut } = useAuth()
  const toast = useToast()

  const [name, setName] = useState(user?.name ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [wrongPasswordAttempt, setWrongPasswordAttempt] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  // Password reset states
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetStep, setResetStep] = useState<'old-password' | 'code' | 'new-password'>('old-password')
  const [resetOldPassword, setResetOldPassword] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState('')


  useEffect(() => {
    setName(user?.name ?? '')
  }, [user?.name])


  const updateProfile = async () => {
    if (!user) return
    const email = user.email
    setSaving(true)
    setWrongPasswordAttempt(false)
    try {
      const resp = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, currentPassword, newPassword }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        // Check if it's a wrong password error
        if (data.error?.includes('incorrect') || data.error?.includes('Current password')) {
          setWrongPasswordAttempt(true)
        }
        toast.showToast(data.error || 'Failed to update profile', 'error', 3000)
        return
      }
      toast.showToast('Profile updated', 'success', 2500)
      setCurrentPassword('')
      setNewPassword('')
      setWrongPasswordAttempt(false)
      await refreshUser()
    } catch (err) {
      console.error(err)
      toast.showToast('Failed to update profile', 'error', 3000)
    } finally {
      setSaving(false)
    }
  }


  const handleForgotPasswordClick = async () => {
    setShowPasswordReset(true)
    setResetStep('old-password')
    setResetOldPassword('')
    setResetCode('')
    setResetNewPassword('')
    setResetConfirmPassword('')
    setResetError('')
  }

  const handleResetOldPassword = async () => {
    if (!resetOldPassword) {
      setResetError('Please enter your current password')
      return
    }
    setResetLoading(true)
    setResetError('')
    try {
      const resp = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Empty body - will use session
      })
      const data = await resp.json()
      if (!resp.ok) {
        setResetError(data.error || 'Failed to send verification code')
        return
      }
      setResetStep('code')
      toast.showToast('Verification code sent to your email', 'success', 2000)
    } catch (err) {
      setResetError('Failed to send verification code')
      throw err
    } finally {
      setResetLoading(false)
    }
  }

  const handleResetCode = async () => {
    if (!resetCode || resetCode.length !== 6) {
      setResetError('Please enter a valid 6-digit code')
      return
    }
    setResetStep('new-password')
  }

  const handleResetPassword = async () => {
    if (!resetNewPassword || !resetConfirmPassword) {
      setResetError('Please fill in all fields')
      return
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match')
      return
    }
    if (resetNewPassword.length < 8) {
      setResetError('Password must be at least 8 characters')
      return
    }

    setResetLoading(true)
    setResetError('')
    try {
      const resp = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: resetCode,
          newPassword: resetNewPassword,
          oldPassword: resetOldPassword,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        setResetError(data.error || 'Failed to reset password')
        return
      }
      toast.showToast('Password reset successfully', 'success', 2500)
      setShowPasswordReset(false)
      setCurrentPassword('')
      setNewPassword('')
      setWrongPasswordAttempt(false)
    } catch (err) {
      setResetError('Failed to reset password')
      throw err
    } finally {
      setResetLoading(false)
    }
  }

  const deleteAccount = async () => {
    if (!user) return
    setDeleting(true)
    try {
      const resp = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword, confirmText }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        toast.showToast(data.error || 'Failed to delete account', 'error', 3000)
        return
      }
      toast.showToast('Account deleted successfully', 'success', 2500)
      // Wait for logout to complete (async), then redirect
      setTimeout(async () => {
        await logOut()
        // Force a hard redirect to ensure session is cleared
        window.location.href = '/'
      }, 1500)
    } catch (err) {
      console.error(err)
      toast.showToast('Failed to delete account', 'error', 3000)
    } finally {
      setDeleting(false)
    }
  }

  if (!user) {
    return <div className="p-6">Please sign in to manage your account.</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">Account Settings</h1>

      <div className="block md:hidden">
        <SubscriptionStatus className="border rounded-xl bg-white dark:bg-slate-900 dark:border-slate-700" />
      </div>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-medium text-slate-800 dark:text-white">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300">Email</label>
            <input
              disabled
              value={user.email ?? ''}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            />
          </div>
          <div>

            <Input type='email'
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}

            /> 
          </div>
        </div>
        <div className="pt-2">
          <Button
            onClick={updateProfile}
            disabled={saving}
            variant='secondary'
            size={'medium'}
            className='w-full'
          >
            Save profile
          </Button>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-medium text-slate-800 dark:text-white">Password</h2>
        <div className="grid gap-3">
          <Input
            type="password"
            label={'Current Password'}
            onChange={(e) => setCurrentPassword(e.target.value)}
            value={currentPassword}
            placeholder=''
          />
          <Input
            type="password"
            label={'New Password'}
            onChange={(e) => setNewPassword(e.target.value)}
            value={newPassword}
            placeholder=''
          />
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <Button
            onClick={updateProfile}
            variant='secondary'
            size='medium'
            disabled={saving || resetLoading}
            className="w-full"   >
            Update password
          </Button>
          {wrongPasswordAttempt && (
            <Button
              onClick={handleForgotPasswordClick}
              variant='secondary'
              size={'small'}
            // className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
            >
              Forgot password?
            </Button>
          )}
        </div>
      </section>


      <section className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-medium text-red-600 dark:text-red-400">Danger Zone</h2>
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Once you delete your account, all your data including resumes, job descriptions, and analysis will be permanently removed.
            This action cannot be undone.
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Delete Account</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <div className="space-y-3 mb-6">
              {user.password && (
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                  Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1 mt-2">
                  Password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="password"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeletePassword('')
                  setConfirmText('')
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={
                  deleting ||
                  confirmText !== 'DELETE' ||
                  (!!user && !!user.password && !deletePassword)
                }
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Reset Password</h3>

            {resetStep === 'old-password' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  First, verify your current password to proceed with the reset.
                </p>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Current password</label>
                  <input
                    type="password"
                    value={resetOldPassword}
                    onChange={(e) => setResetOldPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                {resetError && <p className="text-sm text-red-600">{resetError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowPasswordReset(false)
                      setResetError('')
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetOldPassword}
                    disabled={resetLoading}
                    className="flex-1 px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
                  >
                    {resetLoading ? 'Sending...' : 'Send Code'}
                  </button>
                </div>
              </div>
            )}

            {resetStep === 'code' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enter the 6-digit code sent to your email.
                </p>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Verification code</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-mono text-lg"
                  />
                </div>
                {resetError && <p className="text-sm text-red-600">{resetError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setResetStep('old-password')
                      setResetCode('')
                      setResetError('')
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleResetCode}
                    className="flex-1 px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
                  >
                    Verify Code
                  </button>
                </div>
              </div>
            )}

            {resetStep === 'new-password' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enter your new password.
                </p>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">New password</label>
                  <input
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Confirm password</label>
                  <input
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                {resetError && <p className="text-sm text-red-600">{resetError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setResetStep('code')
                      setResetNewPassword('')
                      setResetConfirmPassword('')
                      setResetError('')
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="flex-1 px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
                  >
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



    </div>
  )
}

export default AccountPage
