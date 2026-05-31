import { NextResponse } from 'next/server'
import { runHourlyBlogAutomation } from '@/services/blogAutomationService'

export const runtime = 'nodejs'
// Must match vercel.json maxDuration
export const maxDuration = 300

export type BlogCronJobOptions = {
  dryRun?: boolean
  title?: string
}

export type BlogCronJobResult = {
  success: boolean
  state?: string
  title?: string
  slug?: string
  blogId?: string
  traceId?: string
  durationMs?: number
  reason?: string
  error?: string
}

function toBoolean(value: string | undefined | null) {
  if (!value) return false
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

/**
 * Authorization strategy (checked in order):
 * 1. Vercel cron invocations send `x-vercel-cron: 1` — always trust these.
 * 2. Bearer token in Authorization header matches BLOG_CRON_SECRET or CRON_SECRET.
 * 3. x-cron-secret header matches the same secrets.
 * 4. If NO secret is configured at all, allow the request (open — only do this in dev).
 */
function isAuthorized(req: Request): boolean {
  // Vercel's own cron runner always sets this header
  if (req.headers.get('x-vercel-cron') === '1') {
    return true
  }

  const secret = process.env.BLOG_CRON_SECRET || process.env.CRON_SECRET

  // No secret configured — allow (useful for local testing, warn in logs)
  if (!secret) {
    console.warn('[cron/blog] No BLOG_CRON_SECRET set — allowing unauthenticated request')
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
    console.error('[cron/blog] Unauthorized invocation')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Check kill-switch — default to ENABLED so a missing var doesn't silently skip
  const enabled = process.env.BLOG_CRON_ENABLED !== undefined
    ? toBoolean(process.env.BLOG_CRON_ENABLED)
    : true // default ON when not set

  if (!enabled) {
    console.log('[cron/blog] Skipped — BLOG_CRON_ENABLED=false')
    return NextResponse.json({ success: true, state: 'skipped', reason: 'BLOG_CRON_ENABLED=false' })
  }

  const url = new URL(req.url)
  const result = await runBlogCronJob({
    dryRun: url.searchParams.has('dryRun') ? toBoolean(url.searchParams.get('dryRun')) : undefined,
    title: url.searchParams.get('title') || undefined,
  })

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error || 'Unexpected cron error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: result }, { status: 200 })
}

export async function runBlogCronJob(options?: BlogCronJobOptions): Promise<BlogCronJobResult> {
  const dryRun = options?.dryRun !== undefined
    ? options.dryRun
    : toBoolean(process.env.BLOG_CRON_DRYRUN || process.env.DRY_RUN || 'false')
  const title = options?.title

  console.log(`[cron/blog] Starting — dryRun=${dryRun}, title=${title ?? 'auto'}`)

  try {
    const result = await runHourlyBlogAutomation({ dryRun, title })

    console.log(`[cron/blog] Done — state=${result.state}, title="${result.title}", duration=${result.durationMs}ms`)
    return {
      success: true,
      state: result.state,
      title: result.title,
      slug: result.slug,
      blogId: result.blogId,
      traceId: result.traceId,
      durationMs: result.durationMs,
      reason: result.reason,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected cron error'
    console.error('[cron/blog] Failed:', message, error)
    return {
      success: false,
      error: message,
    }
  }
}

export async function GET(req: Request) {
  return handleCron(req)
}

export async function POST(req: Request) {
  return handleCron(req)
}
