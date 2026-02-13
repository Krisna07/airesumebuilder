'use server'

import { stripe } from '@/lib/stripe'
import { requireUserSession } from '@/lib/subscription-server'
import { prisma } from '@/lib/prisma'

const PRODUCTS = {
  supporter: {
    id: 'supporter',
    name: 'Supporter',
    description: 'Supporter plan – unlimited usage (pay what you want)',
    priceInCents: 0,
  },
  ultimate: {
    id: 'ultimate',
    name: 'Ultimate',
    description: 'Ultimate plan – unlimited usage and all features',
    priceInCents: 1000,
  },
} as const

type ProductId = keyof typeof PRODUCTS

export async function startCheckoutSession(productId: ProductId, origin?: string, amountInCents?: number) {
  try {
    const product = PRODUCTS[productId]
    if (!product) {
      throw new Error('Invalid product')
    }

    const session = await requireUserSession()
    const { userId, email } = session

    // Make sure the user has a subscription row so webhook upsert works cleanly
    await prisma.subscription.upsert({
      where: { userId },
      update: {},
      create: { userId, plan: 'FREE' },
    })

    const checkoutSession = await stripe.checkout.sessions.create(
      productId === 'supporter'
        ? ({
            ui_mode: 'embedded',
            redirect_on_completion: 'never',
            mode: 'payment',
            customer_email: email,
            client_reference_id: userId,
            line_items: [
              {
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: product.name,
                    description: product.description,
                  },
                  // Use provided amount or default to $5
                  unit_amount: typeof amountInCents === 'number' && amountInCents >= 100 ? amountInCents : 500,
                },
                quantity: 1,
              },
            ],
            metadata: {
              productId: product.id,
              userId,
            },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)
        : {
            ui_mode: 'embedded',
            redirect_on_completion: 'never',
            mode: 'subscription',
            customer_email: email,
            client_reference_id: userId,
            line_items: [
              {
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: product.name,
                    description: product.description,
                  },
                  unit_amount: product.priceInCents,
                  recurring: { interval: 'month' },
                },
                quantity: 1,
              },
            ],
            metadata: {
              productId: product.id,
              userId,
            },
            subscription_data: {
              metadata: {
                productId: product.id,
                userId,
              },
            },
          }
    )

    if (!checkoutSession.client_secret) {
      throw new Error('Failed to create checkout session: no client_secret returned')
    }

    return checkoutSession.client_secret
  } catch (error) {
    console.error('startCheckoutSession error:', error)
    throw error
  }
}

