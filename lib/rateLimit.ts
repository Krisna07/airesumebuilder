type RateLimitEntry = { count: number; resetAt: number }

/**
 * Simple in-memory rate limiter (per runtime instance).
 * Good as a first-line defense; for multi-region / multi-instance use Redis/Upstash.
 */
const store = new Map<string, RateLimitEntry>()

export type RateLimitOptions = {
  /** Unique key, e.g. `user:${userId}:ai:analyze` */
  key: string
  windowMs: number
  max: number
}

export function checkRateLimit({ key, windowMs, max }: RateLimitOptions) {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true as const, remaining: max - 1, resetAt: now + windowMs }
  }

  if (entry.count >= max) {
    return { ok: false as const, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  return { ok: true as const, remaining: Math.max(0, max - entry.count), resetAt: entry.resetAt }
}

