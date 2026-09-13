import { NextResponse } from 'next/server'
import { listExpiredUnpublishedDrafts, hardDeleteBlog } from '@/services/blogCmsService'

const TTL_DAYS = 7

export const runtime = 'nodejs'
export const maxDuration = 60

function isAuthorized(req: Request): boolean {
  if (req.headers.get('x-vercel-cron') === '1') {
    return true
  }

  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.warn('[cleanup-unpublished-blogs] No CRON_SECRET set - allowing unauthenticated request')
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

  const result = await cleanupExpiredUnpublishedBlogs()
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error || 'Failed to cleanup unpublished blogs', deletedCount: 0 },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { success: true, deletedCount: result.deletedCount },
    { status: 200 },
  )
}

/**
 * Permanently deletes drafts that were unpublished more than 7 days ago and
 * never republished. Call this from the daily cron job.
 *
 * Returns: { success: boolean, deletedCount: number }
 */
export async function cleanupExpiredUnpublishedBlogs() {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - TTL_DAYS)
    const cutoffIso = cutoffDate.toISOString()

    const expired = await listExpiredUnpublishedDrafts(cutoffIso)

    if (expired.length === 0) {
      console.log('[cleanup-unpublished-blogs] No expired unpublished drafts to clean up')
      return { success: true, deletedCount: 0 }
    }

    console.log(`[cleanup-unpublished-blogs] Found ${expired.length} expired unpublished drafts to delete`)

    let deletedCount = 0
    for (const doc of expired) {
      try {
        await hardDeleteBlog(doc._id, doc.coverImageId)
        deletedCount += 1
        console.log(`[cleanup-unpublished-blogs] Deleted "${doc.title}" (${doc._id})`)
      } catch (error) {
        console.error(`[cleanup-unpublished-blogs] Failed to delete ${doc._id}:`, error)
      }
    }

    return { success: true, deletedCount }
  } catch (error) {
    console.error('[cleanup-unpublished-blogs] Error:', error)
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
