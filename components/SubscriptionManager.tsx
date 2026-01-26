'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/authContext'
import { useToast } from '@/context/PopupContext'
import dynamic from 'next/dynamic'

// Dynamic import to avoid loading Stripe on every page load
const Checkout = dynamic(() => import('@/components/Checkout'), { ssr: false })

export default function SubscriptionManager() {
  const { subscription, getSubscription, setSubscriptionPlan } = useAuth()
  const toast = useToast()

  const [plan, setPlan] = useState<'FREE' | 'SUPPORTER' | 'ULTIMATE'>(subscription?.plan ?? 'FREE')
  const [saving, setSaving] = useState(false)

  // Plan upgrade with Stripe
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<'SUPPORTER' | 'ULTIMATE' | null>(null)
  const [supporterAmount, setSupporterAmount] = useState<string>('5') // Default $5
  const [showSupporterAmountModal, setShowSupporterAmountModal] = useState(false)

  useEffect(() => {
    if (subscription) {
      setPlan(subscription.plan)
    }
  }, [subscription])

  // Poll for subscription updates when checkout is open
  useEffect(() => {
    if (!showCheckout) return

    const interval = setInterval(async () => {
      const updated = await getSubscription(true)
      if (updated && updated.plan !== 'FREE' && updated.plan !== subscription?.plan) {
        // Plan has been upgraded! Close checkout and show success
        setShowCheckout(false)
        setPlan(updated.plan)
        toast.showToast(`Successfully upgraded to ${updated.plan}!`, 'success', 3000)
      }
    }, 3000) // Check every 3 seconds (reduce pressure)

    return () => clearInterval(interval)
  }, [showCheckout, subscription, getSubscription, toast])

  const updatePlan = async () => {
    // If selecting FREE, just update directly
    if (plan === 'FREE') {
      setSaving(true)
      try {
        const updated = await setSubscriptionPlan('FREE')
        if (updated) {
          toast.showToast('Plan downgraded to FREE', 'success', 2500)
        } else {
          toast.showToast('Failed to update subscription', 'error', 3000)
        }
      } finally {
        setSaving(false)
      }
      return
    }

    // For Supporter, show amount input modal first
    if (plan === 'SUPPORTER') {
      setShowSupporterAmountModal(true)
      return
    }

    // For Ultimate, go straight to checkout
    setSelectedPlanForCheckout(plan as 'ULTIMATE')
    setShowCheckout(true)
  }

  const handleSupporterAmountConfirm = () => {
    const amountNum = parseFloat(supporterAmount) || 5
    if (amountNum < 1) {
      toast.showToast('Amount must be at least $1', 'error', 2000)
      return
    }
    setShowSupporterAmountModal(false)
    setSelectedPlanForCheckout('SUPPORTER')
    setShowCheckout(true)
  }

  return (
    <>
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
            Cover Letters: {subscription.clCount}, Analysis: {subscription.analysisCount}
          </div>
        )}
      </section>

      {/* Supporter Amount Input Modal */}
      {showSupporterAmountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-sm w-full mx-4 border border-slate-200 dark:border-slate-700 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Choose Your Support Amount</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              How much would you like to support us with? This is a one-time payment.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Amount (USD)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-semibold text-slate-600 dark:text-slate-400">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={supporterAmount}
                    onChange={(e) => setSupporterAmount(e.target.value)}
                    placeholder="5.00"
                    className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minimum $1.00</p>
              </div>

              <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-3">
                <p className="text-sm text-teal-800 dark:text-teal-200">
                  <strong>One-time payment.</strong> Unlock unlimited usage immediately.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSupporterAmountModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSupporterAmountConfirm}
                className="flex-1 px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Checkout Modal */}
      {showCheckout && selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700 shadow-xl my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                Upgrade to {selectedPlanForCheckout}
              </h3>
              <button
                onClick={() => {
                  setShowCheckout(false)
                  // Reset plan to current subscription if user cancels
                  setPlan(subscription?.plan ?? 'FREE')
                  setSelectedPlanForCheckout(null)
                }}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 text-2xl font-light"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Complete the payment to show your support. You&apos;ll have access to higher limits immediately.
            </p>
            <Checkout
              productId={selectedPlanForCheckout === 'SUPPORTER' ? 'supporter' : 'ultimate'}
              supporterAmount={selectedPlanForCheckout === 'SUPPORTER' ? parseFloat(supporterAmount) || 5 : undefined}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
              Close this window to cancel the upgrade.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
