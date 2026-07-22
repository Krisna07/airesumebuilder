import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

function getJwtSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
}

function cleanId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function cleanEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toLowerCase()
  return trimmed.length ? trimmed : null
}

export async function resolveUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const token = await getToken({ req, secret: getJwtSecret() })
  const candidateIds = [cleanId(token?.id), cleanId(token?.sub)].filter((value): value is string => Boolean(value))
  const email = cleanEmail(token?.email)

  for (const candidateId of candidateIds) {
    try {
      const user = await prisma.user.findUnique({ where: { id: candidateId }, select: { id: true } })
      if (user?.id) {
        return user.id
      }
    } catch (err) {
      console.error('resolveUserIdFromRequest failed while validating token id candidate:', err)
    }
  }

  if (!email) return null

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    return user?.id ?? null
  } catch (err) {
    console.error('resolveUserIdFromRequest failed while resolving email candidate:', err)
    return null
  }
}
