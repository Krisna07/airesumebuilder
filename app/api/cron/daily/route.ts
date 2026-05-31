import { NextResponse } from 'next/server'
import { runSubscriptionResetJob } from '@/app/api/cron/subscription-reset/route'
import { runBlogCronJob } from '@/app/api/cron/blog/route'
import { EmailService } from '@/utils/sendEmail'

export const runtime = 'nodejs'
export const maxDuration = 300

async function sendSuccessNotification(params: {
  durationMs: number
  subscriptionResetCount: number
  blogState?: string
  blogTitle?: string
  blogSlug?: string
}) {
  const recipient = process.env.CRON_NOTIFY_EMAIL || process.env.ADMIN_EMAIL
  if (!recipient) {
    console.warn('[cron/daily] CRON_NOTIFY_EMAIL or ADMIN_EMAIL not set - skipping success email')
    return { sent: false, reason: 'Recipient not configured' }
  }

  const subject = '[AIResumeCraft] Daily cron succeeded'
  const plain = [
    'Daily cron completed successfully.',
    `Duration: ${params.durationMs}ms`,
    `Subscriptions reset: ${params.subscriptionResetCount}`,
    `Blog state: ${params.blogState ?? 'n/a'}`,
    `Blog title: ${params.blogTitle ?? 'n/a'}`,
    `Blog slug: ${params.blogSlug ?? 'n/a'}`,
    `Timestamp: ${new Date().toISOString()}`,
  ].join('\n')

  const html = `
    <h2>Daily cron completed successfully</h2>
    <p><strong>Duration:</strong> ${params.durationMs}ms</p>
    <p><strong>Subscriptions reset:</strong> ${params.subscriptionResetCount}</p>
    <p><strong>Blog state:</strong> ${params.blogState ?? 'n/a'}</p>
    <p><strong>Blog title:</strong> ${params.blogTitle ?? 'n/a'}</p>
    <p><strong>Blog slug:</strong> ${params.blogSlug ?? 'n/a'}</p>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
  `

  await EmailService.sendEmail(recipient, subject, plain, html)
  console.log(`[cron/daily] Success email sent to ${recipient}`)
  return { sent: true }
}

/**
 * Authorization strategy (checked in order):
 * 1. Vercel cron invocations send `x-vercel-cron: 1`.
 * 2. Bearer token matches CRON_SECRET.
 * 3. x-cron-secret matches CRON_SECRET.
 * 4. If no secret is configured, allow request (dev only).
 */
function isAuthorized(req: Request): boolean {
  if (req.headers.get('x-vercel-cron') === '1') {
    return true
  }

  const secret = process.env.CRON_SECRET

  if (!secret) {
    console.warn('[cron/daily] No CRON_SECRET set - allowing unauthenticated request')
    return true
  }

  const authHeader = req.headers.get('authorization') || ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  const headerSecret = req.headers.get('x-cron-secret') || ''

  return bearer === secret || headerSecret === secret
}

async function handleCron(req: Request) {
  if (!isAuthorized(req)) {
    console.error('[cron/daily] Unauthorized invocation')
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  console.log('[cron/daily] Starting daily orchestrator (subscription-reset + blog)')

  const subscription = await runSubscriptionResetJob()
  const blog = await runBlogCronJob()

  const allSucceeded = subscription.success && blog.success
  const durationMs = Date.now() - startedAt
  let notification: { sent: boolean; reason?: string } = { sent: false }

  if (allSucceeded) {
    console.log(`[cron/daily] Done - duration=${durationMs}ms`)
    try {
      notification = await sendSuccessNotification({
        durationMs,
        subscriptionResetCount: subscription.resetCount,
        blogState: blog.state,
        blogTitle: blog.title,
        blogSlug: blog.slug,
      })
    } catch (emailError) {
      const message = emailError instanceof Error ? emailError.message : 'Unknown email error'
      console.error('[cron/daily] Success email failed:', message)
      notification = { sent: false, reason: message }
    }
  } else {
    console.error(`[cron/daily] Completed with failures - duration=${durationMs}ms`)
  }

  return NextResponse.json(
    {
      success: allSucceeded,
      durationMs,
      jobs: {
        subscription,
        blog,
      },
      notification,
    },
    { status: allSucceeded ? 200 : 500 }
  )
}

export async function GET(req: Request) {
  return handleCron(req)
}

export async function POST(req: Request) {
  return handleCron(req)
}
