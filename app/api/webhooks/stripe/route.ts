import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const PRODUCT_TO_PLAN: Record<string, 'SUPPORTER' | 'ULTIMATE'> = {
  supporter: 'SUPPORTER',
  ultimate: 'ULTIMATE',
}

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not set' }, { status: 500 })
  }

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown webhook error'
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const productId = session.metadata?.productId
    const userId = session.metadata?.userId

    if (!productId || !userId) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const plan = PRODUCT_TO_PLAN[productId]
    if (!plan) {
      return NextResponse.json({ error: 'Unknown product' }, { status: 400 })
    }

    await prisma.subscription.upsert({
      where: { userId },
      update: { plan },
      create: { userId, plan },
    })

    // Optionally, you could also store Stripe customer/subscription IDs for future management.
  }

  return NextResponse.json({ received: true })
}
