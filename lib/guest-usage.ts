import crypto from 'crypto'
import { cookies } from 'next/headers'
import { shouldResetDaily } from './subscription'

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