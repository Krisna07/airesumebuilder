import 'server-only'

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // cast to satisfy Stripe types — the app expects this api version string
  apiVersion: '2026-02-25.clover' as unknown as Stripe.StripeConfig['apiVersion'],
})
