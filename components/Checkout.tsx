'use client'
import { useCallback, useMemo } from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { startCheckoutSession } from '@/app/actions/stripe'
import { ANALYTICS_EVENTS, trackAnalyticsEvent } from '@/lib/analytics/events'

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

type Props = {
  productId: 'supporter' | 'ultimate'
  supporterAmount?: number
}

export default function Checkout({ productId, supporterAmount }: Props) {
  const fetchClientSecret = useCallback(async () => {
    try {
      trackAnalyticsEvent(ANALYTICS_EVENTS.CHECKOUT_INTENT, {
        product_id: productId,
        has_custom_amount: Boolean(supporterAmount),
      })

      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const amountInCents = productId === 'supporter' && supporterAmount ? Math.round(supporterAmount * 100) : undefined
      const secret = await startCheckoutSession(productId, origin, amountInCents)
      if (!secret) {
        throw new Error('No client secret returned')
      }
      return secret
    } catch (err) {
      console.error('Failed to create checkout session:', err)
      throw err
    }
  }, [productId, supporterAmount])

  const options = useMemo(
    () => ({
      fetchClientSecret,
    }),
    [fetchClientSecret]
  )

  return (
    <div id="checkout" className="w-full">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
