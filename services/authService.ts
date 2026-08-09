import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export function isAdminEmail(email?: string | null) {
  if (!email) return false
  const raw = [process.env.ADMIN_EMAILS || '', process.env.ADMIN_EMAIL || '']
    .filter(Boolean)
    .join(',')
  const list = raw
    .split(',')
    .map(v => v.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

async function getDbAdminByUserIdentity(params: { userId?: string; email: string }) {
  const { userId, email } = params
  const dbUser = await prisma.user.findFirst({
    where: userId ? { id: userId } : { email },
  })

  if (!dbUser?.id) {
    return null
  }

  try {
    const rows = await prisma.$queryRaw<Array<{ isAdmin: boolean | null }>>`
      SELECT "isAdmin"
      FROM "User"
      WHERE id = ${dbUser.id}
      LIMIT 1
    `

    return {
      id: dbUser.id,
      isAdmin: Boolean(rows[0]?.isAdmin),
    }
  } catch {
    return {
      id: dbUser.id,
      isAdmin: false,
    }
  }
}

export async function requireAdminOrRedirectHome() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  const userId = session?.user?.id

  if (!email) {
    redirect('/')
  }

  const dbUser = await getDbAdminByUserIdentity({ userId, email })

  if (!dbUser?.isAdmin) {
    redirect('/')
  }

  return {
    userId: dbUser.id,
    email,
  }
}

export async function requireAdminOrForbidden() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  const userId = session?.user?.id

  if (!email) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }),
    }
  }

  const dbUser = await getDbAdminByUserIdentity({ userId, email })

  if (!dbUser?.isAdmin) {
    return {
      ok: false as const,
      response: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }),
    }
  }

  return {
    ok: true as const,
    session: {
      userId: dbUser.id,
      email,
    },
  }
}
