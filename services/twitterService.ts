import { prisma } from '@/lib/prisma'

const TWITTER_TOKEN_KEY = 'default'
const TWEET_MAX_CHARS = 280
const TCO_URL_LENGTH = 23

interface RefreshTokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in?: number
  scope?: string
}

const REQUIRED_SCOPES = ['tweet.write', 'media.write'] as const

interface MediaUploadResponse {
  id?: string
  media_key?: string
  [key: string]: unknown
}

interface CreatePostResponse {
  data?: { id: string; text: string }
  [key: string]: unknown
}

export type TwitterPostResult =
  | { ok: true; tweetId: string }
  | { ok: false; error: string }

// ─────────────────────────────────────────────────────────────────────────────
// OAuth 2.0 token rotation
// ─────────────────────────────────────────────────────────────────────────────

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET must be set')
  }
  return { clientId, clientSecret }
}

async function refreshAuthToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<RefreshTokenResponse> {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_type: 'confidential',
    }).toString(),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`X token refresh failed: ${response.status} ${JSON.stringify(data)}`)
  }
  return data as RefreshTokenResponse
}

async function getAccessToken(): Promise<string> {
  const record = await prisma.refreshToken.findUnique({ where: { key: TWITTER_TOKEN_KEY } })
  if (!record) {
    throw new Error('Twitter not connected. Visit /api/admin/twitter/connect to authorize.')
  }

  const { clientId, clientSecret } = getClientCredentials()
  const tokenData = await refreshAuthToken(clientId, clientSecret, record.refreshToken)

  // Log and validate scopes — 403s on media upload are caused by missing media.write here.
  if (tokenData.scope) {
    const granted = tokenData.scope.split(' ')
    console.log('[twitter] Token scopes granted:', granted.join(', '))
    const missing = REQUIRED_SCOPES.filter(s => !granted.includes(s))
    if (missing.length > 0) {
      console.error(`[twitter] Token missing required scopes: ${missing.join(', ')}`)
      console.error('[twitter] Fix: set app permissions to "Read and Write" in developer.twitter.com, then re-run /api/admin/twitter/connect')
      throw new Error(
        `Twitter token lacks required scopes: ${missing.join(', ')}. ` +
        `Re-authorize via /api/admin/twitter/connect after setting app permissions to "Read and Write".`
      )
    }
  } else {
    console.warn('[twitter] Token refresh did not return scope field — cannot verify media.write. If media upload fails with 403, re-run /api/admin/twitter/connect')
  }

  if (tokenData.refresh_token) {
    await prisma.refreshToken.update({
      where: { key: TWITTER_TOKEN_KEY },
      data: { refreshToken: tokenData.refresh_token },
    })
  }

  return tokenData.access_token
}

// ─────────────────────────────────────────────────────────────────────────────
// Media upload
// Tries three approaches in order:
//   1. POST /2/media/upload  — v2 JSON + base64 (OAuth 2.0)
//   2. POST upload.twitter.com/1.1/media/upload — multipart form binary (OAuth 2.0)
//   3. POST upload.twitter.com/1.1/media/upload — form-encoded base64 (OAuth 2.0)
// Requires: OAuth 2.0 user token with media.write scope
// ─────────────────────────────────────────────────────────────────────────────

function getMediaCategory(mimeType: string): string {
  if (mimeType === 'image/gif') return 'tweet_gif'
  return 'tweet_image'
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
}

async function uploadMedia(accessToken: string, imageBuffer: Buffer, mimeType: string): Promise<string> {
  if (imageBuffer.byteLength > 5 * 1024 * 1024) {
    throw new Error('Image exceeds 5 MB limit')
  }

  const category = getMediaCategory(mimeType)
  const authHeader = `Bearer ${accessToken}`

  // ── Attempt 1: v2 JSON + base64 ──────────────────────────────────────────
  console.log('[twitter] Attempting v2 media upload (JSON+base64)…')
  const v2Res = await fetch('https://api.x.com/2/media/upload', {
    method: 'POST',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ media: imageBuffer.toString('base64'), media_category: category }),
  })
  const v2Data = await v2Res.json() as MediaUploadResponse
  if (v2Res.ok) {
    const id = v2Data.id
    if (!id) throw new Error('v2 media upload: response missing media id')
    console.log('[twitter] v2 upload succeeded, media_id:', id)
    return id
  }
  console.warn(`[twitter] v2 upload failed ${v2Res.status}:`, JSON.stringify(v2Data))

  // ── Attempt 2: v1.1 multipart binary ─────────────────────────────────────
  console.log('[twitter] Attempting v1.1 media upload (multipart binary)…')
  const formBinary = new FormData()
  formBinary.append('media', new Blob([toArrayBuffer(imageBuffer)], { type: mimeType }), 'image.png')
  formBinary.append('media_category', category)

  const v1BinRes = await fetch('https://upload.twitter.com/1.1/media/upload', {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: formBinary,
  })
  const v1BinData = await v1BinRes.json() as { media_id_string?: string; id?: string; [k: string]: unknown }
  if (v1BinRes.ok) {
    const id = v1BinData.media_id_string ?? v1BinData.id
    if (!id) throw new Error('v1.1 binary upload: response missing media_id_string')
    console.log('[twitter] v1.1 binary upload succeeded, media_id:', id)
    return id as string
  }
  console.warn(`[twitter] v1.1 binary upload failed ${v1BinRes.status}:`, JSON.stringify(v1BinData))

  // ── Attempt 3: v1.1 form-encoded base64 ──────────────────────────────────
  console.log('[twitter] Attempting v1.1 media upload (form-encoded base64)…')
  const v1B64Res = await fetch('https://upload.twitter.com/1.1/media/upload', {
    method: 'POST',
    headers: { Authorization: authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ media_data: imageBuffer.toString('base64'), media_category: category }).toString(),
  })
  const v1B64Data = await v1B64Res.json() as { media_id_string?: string; id?: string; [k: string]: unknown }
  if (v1B64Res.ok) {
    const id = v1B64Data.media_id_string ?? v1B64Data.id
    if (!id) throw new Error('v1.1 base64 upload: response missing media_id_string')
    console.log('[twitter] v1.1 base64 upload succeeded, media_id:', id)
    return id as string
  }
  console.warn(`[twitter] v1.1 base64 upload failed ${v1B64Res.status}:`, JSON.stringify(v1B64Data))

  throw new Error(
    `All media upload attempts failed. Last error: ${v1B64Res.status} ${JSON.stringify(v1B64Data)}. ` +
    `Ensure app permissions are "Read and Write" and token has media.write scope. Re-authorize via /api/admin/twitter/connect.`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tweet creation — POST /2/tweets
// Requires: OAuth 2.0 user token with tweet.write + media.write + users.read
// Docs: https://docs.x.com/x-api/posts/create-post
// ─────────────────────────────────────────────────────────────────────────────

async function createTweet(
  accessToken: string,
  text: string,
  mediaIds: string[] = []
): Promise<CreatePostResponse> {
  const payload: { text: string; media?: { media_ids: string[] } } = { text }
  if (mediaIds.length > 0) payload.media = { media_ids: mediaIds }

  const response = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json()) as CreatePostResponse
  if (!response.ok) {
    throw new Error(`X post creation failed: ${response.status} ${JSON.stringify(data)}`)
  }
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function composeTweetText(title: string, excerpt: string, url: string): string {
  const sep = '\n\n'
  const available = TWEET_MAX_CHARS - TCO_URL_LENGTH - sep.length * 2

  const titleCapped = title.length > 140 ? title.slice(0, 139) + '…' : title
  const excerptBudget = available - titleCapped.length
  const excerptPart =
    excerptBudget > 20
      ? excerpt.length > excerptBudget
        ? excerpt.slice(0, excerptBudget - 1) + '…'
        : excerpt
      : ''

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
    const accessToken = await getAccessToken()

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
    const blogUrl = `${baseUrl}/blogs/${params.slug}`
    const text = composeTweetText(params.title, params.excerpt, blogUrl)

    let mediaId: string | undefined
    if (params.imageBuffer && params.imageMimeType && params.imageMimeType !== 'image/svg+xml') {
      try {
        mediaId = await uploadMedia(accessToken, params.imageBuffer, params.imageMimeType)
        console.log(`[twitter] Media uploaded: ${mediaId}`)
      } catch (mediaErr) {
        console.warn('[twitter] Media upload failed — posting without image:', mediaErr instanceof Error ? mediaErr.message : mediaErr)
      }
    }

    const result = await createTweet(accessToken, text, mediaId ? [mediaId] : [])
    const tweetId = result.data?.id ?? ''

    console.log(`[twitter] Posted tweet ${tweetId} for "${params.title}"${mediaId ? ' with image' : ' (text only)'}`)
    return { ok: true, tweetId }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('[twitter] Failed to post tweet:', error)
    return { ok: false, error }
  }
}

export async function seedRefreshToken(refreshToken: string): Promise<void> {
  await prisma.refreshToken.upsert({
    where: { key: TWITTER_TOKEN_KEY },
    update: { refreshToken },
    create: { key: TWITTER_TOKEN_KEY, refreshToken },
  })
}
