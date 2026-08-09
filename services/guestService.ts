import crypto from 'crypto'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { shouldResetDaily } from '@/lib/subscriptionConfig'

export type GuestUsageKey = 'download' | 'regen' | 'analysis'

interface GuestUsageState {
  downloadCount: number
  regenCount: number
  analysisCount: number
  lastResetDate: string
}

export interface GuestUsageSnapshot {
  plan: 'GUEST'
  download: { used: number; limit: number; remaining: number }
  regen: { used: number; limit: number; remaining: number }
  analysis: { used: number; limit: number; remaining: number }
  lastResetDate: string
}

const GUEST_USAGE_COOKIE = 'guest_usage'
const GUEST_USAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

const GUEST_QUOTAS: Record<GuestUsageKey, number> = {
  download: 5,
  regen: 5,
  analysis: 1,
}

class GuestQuotaError extends Error {
  status = 403

  constructor(message = 'Guest quota exceeded') {
    super(message)
    this.name = 'GuestQuotaError'
  }
}

function getGuestUsageSecret() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV !== 'production') return 'guest-usage-dev-secret'
  throw new Error('NEXTAUTH_SECRET is required for guest usage cookies')
}

function getDefaultGuestUsageState(now = new Date()): GuestUsageState {
  return {
    downloadCount: 0,
    regenCount: 0,
    analysisCount: 0,
    lastResetDate: now.toISOString(),
  }
}

function signPayload(payload: string) {
  return crypto.createHmac('sha256', getGuestUsageSecret()).update(payload).digest('base64url')
}

function serializeState(state: GuestUsageState) {
  const payload = Buffer.from(JSON.stringify(state), 'utf8').toString('base64url')
  return `${payload}.${signPayload(payload)}`
}

function parseState(rawValue?: string | null): GuestUsageState | null {
  if (!rawValue) return null

  const [payload, signature] = rawValue.split('.')
  if (!payload || !signature) return null
  if (signPayload(payload) !== signature) return null

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<GuestUsageState>
    return {
      downloadCount: Math.max(0, Number(parsed.downloadCount ?? 0)),
      regenCount: Math.max(0, Number(parsed.regenCount ?? 0)),
      analysisCount: Math.max(0, Number(parsed.analysisCount ?? 0)),
      lastResetDate: typeof parsed.lastResetDate === 'string' ? parsed.lastResetDate : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

function normalizeState(state: GuestUsageState, now = new Date()) {
  const lastReset = new Date(state.lastResetDate)
  if (Number.isNaN(lastReset.getTime()) || shouldResetDaily(lastReset, now)) {
    return getDefaultGuestUsageState(now)
  }
  return state
}

async function persistState(state: GuestUsageState) {
  const cookieStore = await cookies()
  cookieStore.set(GUEST_USAGE_COOKIE, serializeState(state), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: GUEST_USAGE_COOKIE_MAX_AGE,
  })
}

function ensureWithinQuota(state: GuestUsageState, key: GuestUsageKey, amount: number) {
  const current =
    key === 'download'
      ? state.downloadCount
      : key === 'regen'
        ? state.regenCount
        : state.analysisCount
  const quota = GUEST_QUOTAS[key]

  if (current + amount > quota) {
    throw new GuestQuotaError(
      key === 'download'
        ? 'Guest daily download limit reached. Sign in to continue or try again tomorrow.'
        : key === 'regen'
          ? 'Guest daily regeneration limit reached. Sign in to continue or try again tomorrow.'
          : 'Guest analysis limit reached for this guest account. Sign in to continue.',
    )
  }
}

function buildUsageEntry(key: GuestUsageKey, state: GuestUsageState) {
  const used =
    key === 'download'
      ? state.downloadCount
      : key === 'regen'
        ? state.regenCount
        : state.analysisCount
  const limit = GUEST_QUOTAS[key]
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
  }
}

export async function getGuestUsageState() {
  const cookieStore = await cookies()
  const parsed = parseState(cookieStore.get(GUEST_USAGE_COOKIE)?.value)
  const normalized = normalizeState(parsed ?? getDefaultGuestUsageState())
  await persistState(normalized)
  return normalized
}

export async function assertGuestQuota(key: GuestUsageKey, amount = 1) {
  const state = await getGuestUsageState()
  ensureWithinQuota(state, key, amount)
  return state
}

export async function consumeGuestUsage(key: GuestUsageKey, amount = 1) {
  const state = await getGuestUsageState()
  ensureWithinQuota(state, key, amount)

  const updatedState: GuestUsageState = {
    ...state,
    downloadCount: key === 'download' ? state.downloadCount + amount : state.downloadCount,
    regenCount: key === 'regen' ? state.regenCount + amount : state.regenCount,
    analysisCount: key === 'analysis' ? state.analysisCount + amount : state.analysisCount,
  }

  await persistState(updatedState)
  return updatedState
}

export async function getGuestUsageSnapshot(): Promise<GuestUsageSnapshot> {
  const state = await getGuestUsageState()
  return {
    plan: 'GUEST',
    download: buildUsageEntry('download', state),
    regen: buildUsageEntry('regen', state),
    analysis: buildUsageEntry('analysis', state),
    lastResetDate: state.lastResetDate,
  }
}

export function mapGuestUsageError(err: unknown) {
  if (err instanceof GuestQuotaError) {
    return { status: err.status, message: err.message }
  }
  return { status: 500, message: 'Unexpected error' }
}

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

  const envOrigins = [process.env.NEXTAUTH_URL, process.env.NEXT_PUBLIC_APP_URL]
  for (const raw of envOrigins) {
    if (!raw) continue
    try {
      origins.add(new URL(raw).origin)
    } catch {
    }
  }

  if (process.env.VERCEL_URL) {
    try {
      origins.add(new URL(`https://${process.env.VERCEL_URL}`).origin)
      origins.add(new URL(`https://www.${process.env.VERCEL_URL}`).origin)
    } catch {
    }
  }

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

  if (allowedOrigins.has(normalizedOrigin)) {
    return { ok: true as const }
  }

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
