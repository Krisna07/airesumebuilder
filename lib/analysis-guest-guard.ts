import { NextRequest, NextResponse } from 'next/server'

type GuestLimitResult = {
  allowed: boolean
  status?: number
  message?: string
}

type GuestUsageEntry = {
  count: number
  lastAt: number
}

const ANALYSIS_WINDOW_MS = 1000 * 60 * 60 * 24 * 30
const MAX_GUEST_ANALYSIS_PER_WINDOW = 1

const globalStore = globalThis as typeof globalThis & {
  __guestAnalysisByIp?: Map<string, GuestUsageEntry>
  __guestAnalysisByDevice?: Map<string, GuestUsageEntry>
}

const guestAnalysisByIp = globalStore.__guestAnalysisByIp ?? new Map<string, GuestUsageEntry>()
const guestAnalysisByDevice = globalStore.__guestAnalysisByDevice ?? new Map<string, GuestUsageEntry>()

globalStore.__guestAnalysisByIp = guestAnalysisByIp
globalStore.__guestAnalysisByDevice = guestAnalysisByDevice

function pruneExpired(map: Map<string, GuestUsageEntry>) {
  const now = Date.now()
  for (const [key, entry] of map.entries()) {
    if (now - entry.lastAt > ANALYSIS_WINDOW_MS) {
      map.delete(key)
    }
  }
}

function nextBlockedMessage() {
  return 'Guest analysis is limited to one run per device/IP. Sign in to run additional analyses.'
}

function sanitizeDeviceId(value: string | null) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, 200)
}

function incrementUsage(map: Map<string, GuestUsageEntry>, key: string) {
  const existing = map.get(key)
  const next: GuestUsageEntry = {
    count: (existing?.count || 0) + 1,
    lastAt: Date.now(),
  }
  map.set(key, next)
}

function isExceeded(map: Map<string, GuestUsageEntry>, key: string) {
  const existing = map.get(key)
  if (!existing) return false
  return existing.count >= MAX_GUEST_ANALYSIS_PER_WINDOW && Date.now() - existing.lastAt <= ANALYSIS_WINDOW_MS
}

export function getClientIp(req: NextRequest) {
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.split(',')[0].trim()

  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.split(',')[0].trim()

  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()

  return 'unknown'
}

function getAllowedOrigins() {
  const origins = new Set<string>()

  // Add explicitly configured origins
  const envOrigins = [process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_APP_URL]
  for (const raw of envOrigins) {
    if (!raw) continue
    try {
      origins.add(new URL(raw).origin)
    } catch {
      // Ignore malformed values.
    }
  }

  // Add Vercel URL if available (production on Vercel)
  if (process.env.VERCEL_URL) {
    try {
      origins.add(new URL(`https://${process.env.VERCEL_URL}`).origin)
      // Also add www version
      origins.add(new URL(`https://www.${process.env.VERCEL_URL}`).origin)
    } catch {
      // Ignore malformed values.
    }
  }

  // Always allow localhost in non-production
  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000')
    origins.add('http://127.0.0.1:3000')
    origins.add('http://localhost:3001')
    origins.add('http://127.0.0.1:3001')
  }

  return origins
}

export function verifyOrigin(req: NextRequest) {
  const origin = req.headers.get('origin')
  const allowedOrigins = getAllowedOrigins()

  if (!origin) {
    // Allow missing origin header in development
    if (process.env.NODE_ENV !== 'production') {
      return { ok: true as const }
    }
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Origin header missing' }, { status: 403 }),
    }
  }

  let normalizedOrigin = origin
  try {
    normalizedOrigin = new URL(origin).origin
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Invalid origin header' }, { status: 403 }),
    }
  }

  // Check if origin is allowed
  if (allowedOrigins.has(normalizedOrigin)) {
    return { ok: true as const }
  }

  // Log for debugging in development
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[analysis-guest-guard] Origin '${normalizedOrigin}' not in allowed list:`,
      Array.from(allowedOrigins)
    )
  }

  return {
    ok: false as const,
    response: NextResponse.json(
      { 
        error: 'Origin is not allowed for this API',
        details: process.env.NODE_ENV !== 'production' ? {
          origin: normalizedOrigin,
          allowedOrigins: Array.from(allowedOrigins),
        } : undefined
      }, 
      { status: 403 }
    ),
  }
}

export function enforceGuestAnalysisLimit(req: NextRequest): GuestLimitResult {
  pruneExpired(guestAnalysisByIp)
  pruneExpired(guestAnalysisByDevice)

  const ip = getClientIp(req)
  const deviceId = sanitizeDeviceId(req.headers.get('x-guest-device-id'))

  if (ip !== 'unknown' && isExceeded(guestAnalysisByIp, ip)) {
    return {
      allowed: false,
      status: 429,
      message: nextBlockedMessage(),
    }
  }

  if (deviceId && isExceeded(guestAnalysisByDevice, deviceId)) {
    return {
      allowed: false,
      status: 429,
      message: nextBlockedMessage(),
    }
  }

  if (ip !== 'unknown') incrementUsage(guestAnalysisByIp, ip)
  if (deviceId) incrementUsage(guestAnalysisByDevice, deviceId)

  return { allowed: true }
}
