'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/authContext'
import { useToast } from '@/context/PopupContext'
import type { Subscription } from '@/types/subscription'
import SubscriptionStatus from '@/components/SubscriptionStatus'

const AccountPage = () => {
  const { user, getSubscription, setSubscriptionPlan } = useAuth()
  const toast = useToast()

  const [name, setName] = useState(user?.name ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plan, setPlan] = useState<'FREE' | 'SUPPORTER' | 'ULTIMATE'>('FREE')

  useEffect(() => {
    setName(user?.name ?? '')
  }, [user?.name])

  useEffect(() => {
    let mounted = true
    getSubscription().then((data) => {
      if (mounted && data) {
        setSubscription(data)
        setPlan(data.plan)
      }
    })
    return () => {
      mounted = false
    }
  }, [getSubscription])

  const updateProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      const resp = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, currentPassword, newPassword }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        toast.showToast(data.error || 'Failed to update profile', 'error', 3000)
        return
      }
      toast.showToast('Profile updated', 'success', 2500)
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      console.error(err)
      toast.showToast('Failed to update profile', 'error', 3000)
    } finally {
      setSaving(false)
    }
  }

  const updatePlan = async () => {
    setSaving(true)
    try {
      const updated = await setSubscriptionPlan(plan)
      if (updated) {
        setSubscription(updated)
        toast.showToast('Subscription updated', 'success', 2500)
      } else {
        toast.showToast('Failed to update subscription', 'error', 3000)
      }
    } finally {
      setSaving(false)
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
            <label className="block text-sm text-slate-600 dark:text-slate-300">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
        <div className="pt-2">
          <button
            onClick={updateProfile}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
          >
            Save profile
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-medium text-slate-800 dark:text-white">Password</h2>
        <div className="grid gap-3">
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-300">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
        <div className="pt-2">
          <button
            onClick={updateProfile}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
          >
            Update password
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
        <h2 className="text-lg font-medium text-slate-800 dark:text-white">Subscription</h2>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as 'FREE' | 'SUPPORTER' | 'ULTIMATE')}
            className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="FREE">FREE</option>
            <option value="SUPPORTER">SUPPORTER</option>
            <option value="ULTIMATE">ULTIMATE</option>
          </select>
          <button
            onClick={updatePlan}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
          >
            Update plan
          </button>
        </div>
        {subscription && (
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Current usage — Regen: {subscription.regenCount}, Download: {subscription.downloadCount},
            Cover Letters: {subscription.clCount}, Analysis: {subscription.analysisCount}, Uploads: {subscription.uploadCount}
          </div>
        )}
      </section>
    </div>
  )
}

export default AccountPage
