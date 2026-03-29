import { NextResponse } from 'next/server'
import { runHourlyBlogAutomation } from '@/services/blogAutomationService'

export const runtime = 'nodejs'

function toBoolean(value: string | null) {
  if (!value) return false
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function isCronEnabled() {
  return toBoolean(process.env.BLOG_CRON_ENABLED || 'false')
}

function isAuthorized(req: Request) {
  const expectedSecret = process.env.BLOG_CRON_SECRET || process.env.CRON_SECRET
  if (!expectedSecret) {
    return false
  }

  const header = req.headers.get('authorization')
  const bearer = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
  const headerSecret = req.headers.get('x-cron-secret') || ''

  return bearer === expectedSecret || headerSecret === expectedSecret
}

async function handleCron(req: Request) {
  if (!isCronEnabled()) {
    return NextResponse.json({ success: true, state: 'skipped', reason: 'BLOG_CRON_ENABLED is false' })
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized cron invocation' }, { status: 401 })
  }

  try {
    const url = new URL(req.url)
    // Prefer explicit query param when provided; otherwise fall back to env var.
    const envDryRun = toBoolean(process.env.DRYRUN || process.env.DRY_RUN || process.env.BLOG_CRON_DRYRUN || 'false')
    const dryRun = url.searchParams.has('dryRun') ? toBoolean(url.searchParams.get('dryRun')) : envDryRun
    const title = url.searchParams.get('title') || undefined

    const result = await runHourlyBlogAutomation({
      dryRun,
      title,
    })

    return NextResponse.json({ success: true, data: result }, { status: 200 })
  } catch (error) {
    console.error('Cron blog automation failed', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected cron error',
      },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  return handleCron(req)
}

export async function POST(req: Request) {
  return handleCron(req)
}
