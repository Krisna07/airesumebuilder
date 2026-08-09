import { TwitterApi, EUploadMimeType } from 'twitter-api-v2'
import { prisma } from '@/lib/prisma'

const TWITTER_TOKEN_KEY = 'twitter'
const TWEET_MAX_CHARS = 280
const TCO_URL_LENGTH = 23 // X always wraps URLs to 23 chars

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.TWITTER_CLIENT_ID
  const clientSecret = process.env.TWITTER_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET must be set')
  }
  return { clientId, clientSecret }
}

async function refreshAndGetAccessToken(): Promise<string> {
  const record = await prisma.refreshToken.findUnique({ where: { key: TWITTER_TOKEN_KEY } })
  if (!record) {
    throw new Error('Twitter not connected. Visit /api/admin/twitter/connect to authorise.')
  }

  const { clientId, clientSecret } = getClientCredentials()
  const client = new TwitterApi({ clientId, clientSecret })

  const { accessToken, refreshToken: rotatedRefreshToken } = await client.refreshOAuth2Token(record.refreshToken)

  if (rotatedRefreshToken) {
    await prisma.refreshToken.update({
      where: { key: TWITTER_TOKEN_KEY },
      data: { refreshToken: rotatedRefreshToken },
    })
  }

  return accessToken
}

function composeTweetText(title: string, excerpt: string, url: string): string {
  const sep = '\n\n'
  // URL always occupies TCO_URL_LENGTH regardless of actual length
  const urlSlot = TCO_URL_LENGTH
  const sepSlot = sep.length * 2 // two separators: after title, after excerpt
  const available = TWEET_MAX_CHARS - urlSlot - sepSlot

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

function toUploadMimeType(mimeType: string): EUploadMimeType {
  const map: Record<string, EUploadMimeType> = {
    'image/jpeg': EUploadMimeType.Jpeg,
    'image/jpg': EUploadMimeType.Jpeg,
    'image/png': EUploadMimeType.Png,
    'image/gif': EUploadMimeType.Gif,
    'image/webp': EUploadMimeType.Webp,
  }
  return map[mimeType.toLowerCase()] ?? EUploadMimeType.Jpeg
}

export type TwitterPostResult =
  | { ok: true; tweetId: string }
  | { ok: false; error: string }

export async function postBlogTweet(params: {
  title: string
  excerpt: string
  slug: string
  imageBuffer?: Buffer
  imageMimeType?: string
}): Promise<TwitterPostResult> {
  try {
    const accessToken = await refreshAndGetAccessToken()
    const client = new TwitterApi(accessToken)

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
    const blogUrl = `${baseUrl}/blogs/${params.slug}`
    const text = composeTweetText(params.title, params.excerpt, blogUrl)

    let mediaId: string | undefined
    if (params.imageBuffer && params.imageMimeType && params.imageMimeType !== 'image/svg+xml') {
      try {
        mediaId = await client.v1.uploadMedia(params.imageBuffer, {
          mimeType: toUploadMimeType(params.imageMimeType),
        })
      } catch (mediaErr) {
        const msg = mediaErr instanceof Error ? mediaErr.message : String(mediaErr)
        console.warn('[twitter] Media upload failed — posting without image:', msg)
      }
    }

    const tweet = await client.v2.tweet({
      text,
      ...(mediaId ? { media: { media_ids: [mediaId] } } : {}),
    })

    console.log(`[twitter] Posted tweet ${tweet.data.id} for blog "${params.title}"`)
    return { ok: true, tweetId: tweet.data.id }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('[twitter] Failed to post tweet:', error)
    return { ok: false, error }
  }
}

export function getOAuthClient() {
  const { clientId, clientSecret } = getClientCredentials()
  return new TwitterApi({ clientId, clientSecret })
}
