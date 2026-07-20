import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { runHourlyBlogAutomation } from '@/services/blogAutomationService'

export const runtime = 'nodejs'
export const maxDuration = 300

function toBoolean(value: string | undefined | null) {
  if (!value) return false
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !session.user.isAdmin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : undefined
    const dryRun = typeof body?.dryRun === 'boolean'
      ? body.dryRun
      : toBoolean(process.env.BLOG_CRON_DRYRUN || process.env.DRY_RUN || 'false')

    console.log(`[trigger-blog] Admin triggered — dryRun=${dryRun}, title=${title ?? 'auto'}`)

    const result = await runHourlyBlogAutomation({ title, dryRun })

    console.log(`[trigger-blog] Done — state=${result.state}, title="${result.title}", duration=${result.durationMs}ms`)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.reason || 'Blog automation failed',
          data: result,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[trigger-blog] Failed:', message, err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
