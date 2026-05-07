import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resetCountsData } from '@/lib/subscription'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Authorization strategy (checked in order):
 * 1. Vercel cron invocations send `x-vercel-cron: 1` — always trust these.
 * 2. Bearer token in Authorization header matches CRON_SECRET.
 * 3. x-cron-secret header matches CRON_SECRET.
 * 4. If NO secret is configured at all, allow the request (open — only do this in dev).
 */
function isAuthorized(req: Request): boolean {
  // Vercel's own cron runner always sets this header
  if (req.headers.get('x-vercel-cron') === '1') {
    return true
  }

  const secret = process.env.CRON_SECRET

  // No secret configured — allow (useful for local testing, warn in logs)
  if (!secret) {
    console.warn('[cron/subscription-reset] No CRON_SECRET set — allowing unauthenticated request')
    return true
  }

  const authHeader = req.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  const headerSecret = req.headers.get('x-cron-secret') || ''

  return bearer === secret || headerSecret === secret
}

async function handleCron(req: Request) {
  // Authorization first
  if (!isAuthorized(req)) {
    console.error('[cron/subscription-reset] Unauthorized invocation')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const startTime = Date.now()
    console.log('[cron/subscription-reset] Starting daily subscription reset...')

    // Get all FREE plan subscriptions that need reset
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const subscriptionsToReset = await prisma.subscription.findMany({
      where: {
        plan: 'FREE',
        lastResetDate: {
          lt: yesterday, // Last reset was more than 24 hours ago
        },
      },
    })

    console.log(`[cron/subscription-reset] Found ${subscriptionsToReset.length} subscriptions to reset`)

    // Reset all eligible subscriptions
    const resetData = resetCountsData(now)
    const updatePromises = subscriptionsToReset.map((sub) =>
      prisma.subscription.update({
        where: { id: sub.id },
        data: resetData,
      })
    )

    await Promise.all(updatePromises)

    const durationMs = Date.now() - startTime
    console.log(`[cron/subscription-reset] Done — reset ${subscriptionsToReset.length} subscriptions in ${durationMs}ms`)

    return NextResponse.json({
      success: true,
      resetCount: subscriptionsToReset.length,
      durationMs,
      timestamp: now.toISOString(),
    }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected cron error'
    console.error('[cron/subscription-reset] Failed:', message, error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  return handleCron(req)
}

export async function POST(req: Request) {
  return handleCron(req)
}
