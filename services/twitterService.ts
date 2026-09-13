import { TwitterApi } from 'twitter-api-v2'

const TWEET_MAX_CHARS = 280
const TCO_URL_LENGTH = 23

export type TwitterPostResult =
  | { ok: true; tweetId: string }
  | { ok: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// OAuth 1.0a client — static Access Token/Secret generated once for this
// account in the X Developer Portal. No consent screen, no rotating refresh
// tokens, no scope grants: the app's permission level ("Read and Write") is
// baked into the token at generation time.
// ─────────────────────────────────────────────────────────────────────────────

function getClient(): TwitterApi {
  const appKey = process.env.TWITTER_CONSUMER_KEY
  const appSecret = process.env.TWITTER_CONSUMER_SECRET
  const accessToken = process.env.TWITTER_ACCESS_TOKEN
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    throw new Error(
      'Twitter OAuth 1.0a credentials missing. Set TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, ' +
      'TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_TOKEN_SECRET.'
    )
  }

  return new TwitterApi({ appKey, appSecret, accessToken, accessSecret })
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Clickbait-style openers/metaphors that have been observed getting real
// posts flagged by X's spam filter (generic 403, "not permitted"). AI-written
// excerpts drift back toward this pattern even when the prompt says not to,
// so this is a hard code-level backstop rather than relying on the prompt alone.
const CLICKBAIT_PATTERN = /^(discover|unlock|uncover|master)\b|transform\w* .+ into\b/i

function composeTweetText(title: string, excerpt: string, url: string): string {
  const sep = '\n\n'
  const available = TWEET_MAX_CHARS - TCO_URL_LENGTH - sep.length * 2
  const safeExcerpt = CLICKBAIT_PATTERN.test(excerpt.trim()) ? '' : excerpt

  const titleCapped = title.length > 140 ? title.slice(0, 139) + '…' : title
  const excerptBudget = available - titleCapped.length
  let excerptPart =
    excerptBudget > 20 && safeExcerpt
      ? safeExcerpt.length > excerptBudget
        ? safeExcerpt.slice(0, excerptBudget - 1) + '…'
        : safeExcerpt
      : ''

  // Safety net: the budget above assumes X's t.co shortener discounts the URL
  // to TCO_URL_LENGTH chars, which only applies to real public domains (not
  // e.g. localhost during local testing). Re-check against the URL's actual
  // raw length and shrink the excerpt further if that assumption doesn't hold,
  // so the tweet is never rejected for exceeding 280 chars either way.
  const rawLength = (extra: string) => `${titleCapped}${sep}${extra}${sep}${url}`.length
  if (excerptPart && rawLength(excerptPart) > TWEET_MAX_CHARS) {
    const overBy = rawLength(excerptPart) - TWEET_MAX_CHARS
    const shrunk = excerptPart.slice(0, Math.max(0, excerptPart.length - overBy - 1))
    excerptPart = shrunk ? shrunk.replace(/…$/, '') + '…' : ''
  }

  return excerptPart
    ? `${titleCapped}${sep}${excerptPart}${sep}${url}`
    : `${titleCapped}${sep}${url}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export async function postBlogTweet(params: {
  title: string
  excerpt: string
  slug: string
  imageBuffer?: Buffer
  imageMimeType?: string
}): Promise<TwitterPostResult> {
  try {
    const client = getClient()

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
    const blogUrl = `${baseUrl}/blogs/${params.slug}`
    const text = composeTweetText(params.title, params.excerpt, blogUrl)

    let mediaId: string | undefined
    if (params.imageBuffer && params.imageMimeType && params.imageMimeType !== 'image/svg+xml') {
      try {
        mediaId = await client.v1.uploadMedia(params.imageBuffer, {
          mimeType: params.imageMimeType,
        })
        console.log(`[twitter] Media uploaded: ${mediaId}`)
      } catch (mediaErr) {
        console.warn('[twitter] Media upload failed — posting without image:', mediaErr instanceof Error ? mediaErr.message : mediaErr)
      }
    }

    const result = await client.v2.tweet(text, mediaId ? { media: { media_ids: [mediaId] } } : undefined)
    const tweetId = result.data?.id ?? ''

    console.log(`[twitter] Posted tweet ${tweetId} for "${params.title}"${mediaId ? ' with image' : ' (text only)'}`)
    return { ok: true, tweetId }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    const apiError = err as { code?: number; data?: unknown }
    console.error('[twitter] Failed to post tweet:', error, apiError.data ? JSON.stringify(apiError.data) : '(no data field)')
    return { ok: false, error }
  }
}
