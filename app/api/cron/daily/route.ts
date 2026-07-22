import { NextResponse } from 'next/server'
import { runSubscriptionResetJob } from '@/app/api/cron/subscription-reset/route'
import { runBlogCronJob } from '@/app/api/cron/blog/route'
import { cleanupExpiredDeletedAccounts } from '@/app/api/cron/cleanup-deleted-accounts/route'
import { EmailService } from '@/utils/sendEmail'

export const runtime = 'nodejs'
export const maxDuration = 300

async function sendSuccessNotification(params: {
  durationMs: number
  subscriptionResetCount: number
  deletedAccountsCount: number
  blogState?: string
  blogTitle?: string
  blogSlug?: string
  allSucceeded: boolean
  subscriptionSuccess: boolean
  blogSuccess: boolean
  accountCleanupSuccess: boolean
  subscriptionError?: string
  blogError?: string
  accountCleanupError?: string
}) {
  const recipient = process.env.CRON_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.AUTH_EMAIL
  if (!recipient) {
    console.warn('[cron/daily] CRON_NOTIFY_EMAIL or ADMIN_EMAIL or AUTH_EMAIL not set - skipping notification email')
    return { sent: false, reason: 'Recipient not configured' }
  }

  const subject = params.allSucceeded
    ? '[AIResumeCraft] Daily cron succeeded'
    : '[AIResumeCraft] Daily cron completed with failures'

  const failureLines = params.allSucceeded
    ? []
    : [
      `Subscription job success: ${params.subscriptionSuccess}`,
      `Blog job success: ${params.blogSuccess}`,
      `Account cleanup success: ${params.accountCleanupSuccess}`,
      `Subscription error: ${params.subscriptionError ?? 'n/a'}`,
      `Blog error: ${params.blogError ?? 'n/a'}`,
      `Account cleanup error: ${params.accountCleanupError ?? 'n/a'}`,
    ]

  const plain = [
    params.allSucceeded ? 'Daily cron completed successfully.' : 'Daily cron completed with failures.',
    `Duration: ${params.durationMs}ms`,
    `Subscriptions reset: ${params.subscriptionResetCount}`,
    `Deleted accounts (expired): ${params.deletedAccountsCount}`,
    `Blog state: ${params.blogState ?? 'n/a'}`,
    `Blog title: ${params.blogTitle ?? 'n/a'}`,
    `Blog slug: ${params.blogSlug ?? 'n/a'}`,
    ...failureLines,
    `Timestamp: ${new Date().toISOString()}`,
  ].join('\n')

  const failureHtml = params.allSucceeded
    ? ''
    : `
      <p><strong>Subscription job success:</strong> ${params.subscriptionSuccess}</p>
      <p><strong>Blog job success:</strong> ${params.blogSuccess}</p>
      <p><strong>Account cleanup success:</strong> ${params.accountCleanupSuccess}</p>
      <p><strong>Subscription error:</strong> ${params.subscriptionError ?? 'n/a'}</p>
      <p><strong>Blog error:</strong> ${params.blogError ?? 'n/a'}</p>
      <p><strong>Account cleanup error:</strong> ${params.accountCleanupError ?? 'n/a'}</p>
    `

  const html = `
    <h2>${params.allSucceeded ? 'Daily cron completed successfully' : 'Daily cron completed with failures'}</h2>
    <p><strong>Duration:</strong> ${params.durationMs}ms</p>
    <p><strong>Subscriptions reset:</strong> ${params.subscriptionResetCount}</p>
    <p><strong>Deleted accounts (expired):</strong> ${params.deletedAccountsCount}</p>
    <p><strong>Blog state:</strong> ${params.blogState ?? 'n/a'}</p>
    <p><strong>Blog title:</strong> ${params.blogTitle ?? 'n/a'}</p>
    <p><strong>Blog slug:</strong> ${params.blogSlug ?? 'n/a'}</p>
    ${failureHtml}
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
  `

  await EmailService.sendEmail(recipient, subject, plain, html)
  console.log(`[cron/daily] Notification email sent to ${recipient}`)
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
  console.log('[cron/daily] Starting daily orchestrator (subscription-reset + blog + account-cleanup)')

  const subscription = await runSubscriptionResetJob()
  const blog = await runBlogCronJob()
  const accountCleanup = await cleanupExpiredDeletedAccounts()

  const allSucceeded = subscription.success && blog.success && accountCleanup.success
  const durationMs = Date.now() - startedAt
  let notification: { sent: boolean; reason?: string } = { sent: false }

  if (allSucceeded) {
    console.log(`[cron/daily] Done - duration=${durationMs}ms`)
  } else {
    console.error(`[cron/daily] Completed with failures - duration=${durationMs}ms`)
  }

  try {
    notification = await sendSuccessNotification({
      durationMs,
      subscriptionResetCount: subscription.resetCount,
      deletedAccountsCount: accountCleanup.deletedCount,
      blogState: blog.state,
      blogTitle: blog.title,
      blogSlug: blog.slug,
      allSucceeded,
      subscriptionSuccess: subscription.success,
      blogSuccess: blog.success,
      accountCleanupSuccess: accountCleanup.success,
      subscriptionError: subscription.error,
      blogError: blog.error || blog.reason,
      accountCleanupError: accountCleanup.error,
    })
  } catch (emailError) {
    const message = emailError instanceof Error ? emailError.message : 'Unknown email error'
    console.error('[cron/daily] Notification email failed:', message)
    notification = { sent: false, reason: message }
  }

  return NextResponse.json(
    {
      success: allSucceeded,
      durationMs,
      jobs: {
        subscription,
        blog,
        accountCleanup,
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
