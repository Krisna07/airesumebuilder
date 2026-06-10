import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const GRACE_PERIOD_DAYS = 15

export const runtime = 'nodejs'
export const maxDuration = 60

function isAuthorized(req: Request): boolean {
  if (req.headers.get('x-vercel-cron') === '1') {
    return true
  }

  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.warn('[cleanup-deleted-accounts] No CRON_SECRET set - allowing unauthenticated request')
    return true
  }

  const authHeader = req.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  const headerSecret = req.headers.get('x-cron-secret') || ''

  return bearer === secret || headerSecret === secret
}

async function handleCron(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const result = await cleanupExpiredDeletedAccounts()
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error || 'Failed to cleanup deleted accounts', deletedCount: 0 },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { success: true, deletedCount: result.deletedCount },
    { status: 200 },
  )
}

/**
 * Cleanup function for permanently deleting accounts that passed 15-day grace period
 * Call this function from your daily cron job
 * 
 * Returns: { success: boolean, deletedCount: number }
 */
export async function cleanupExpiredDeletedAccounts() {
  try {
    // Calculate the cutoff date (15 days ago)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - GRACE_PERIOD_DAYS)

    // Find all deleted accounts past their grace period
    const expiredAccounts = await prisma.user.findMany({
      where: {
        deletedAt: {
          not: null,
          lte: cutoffDate, // deletedAt is 15+ days old
        },
      },
      select: { id: true, email: true, deletedAt: true },
    })

    if (expiredAccounts.length === 0) {
      console.log('[cleanup-deleted-accounts] No expired accounts to clean up')
      return { success: true, deletedCount: 0 }
    }

    console.log(`[cleanup-deleted-accounts] Found ${expiredAccounts.length} expired accounts to delete`)

    // Permanently delete the expired accounts (cascade will handle related data)
    const deleteResult = await prisma.user.deleteMany({
      where: {
        id: { in: expiredAccounts.map(a => a.id) },
      },
    })

    console.log(
      `[cleanup-deleted-accounts] Successfully deleted ${deleteResult.count} permanently expired accounts`
    )

    // Log details
    expiredAccounts.forEach(account => {
      const daysDeleted = Math.floor(
        (new Date().getTime() - new Date(account.deletedAt!).getTime()) / (1000 * 60 * 60 * 24)
      )
      console.log(
        `[cleanup-deleted-accounts] Deleted account: ${account.email} (deleted ${daysDeleted} days ago)`
      )
    })

    return { success: true, deletedCount: deleteResult.count }
  } catch (error) {
    console.error('[cleanup-deleted-accounts] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      deletedCount: 0,
    }
  }
}

export async function GET(req: Request) {
  return handleCron(req)
}

export async function POST(req: Request) {
  return handleCron(req)
}
