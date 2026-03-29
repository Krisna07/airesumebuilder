import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { runHourlyBlogAutomation } from '@/services/blogAutomationService'

function toBoolean(value: string | null) {
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
    const title = body?.title || undefined

    const envDryRun = toBoolean(process.env.DRYRUN || process.env.DRY_RUN || process.env.BLOG_CRON_DRYRUN || 'false')
    const dryRun = typeof body?.dryRun === 'boolean' ? body.dryRun : envDryRun

    const result = await runHourlyBlogAutomation({ title, dryRun })

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('Trigger blog automation failed', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unexpected error' }, { status: 500 })
  }
}
