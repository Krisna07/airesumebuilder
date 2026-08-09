import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/services/authService'

export async function GET(req: Request) {
  const session = await getServerSession()
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const plan = searchParams.get('plan') as 'FREE' | 'SUPPORTER' | 'ULTIMATE' | null

  const subs = await prisma.subscription.findMany({
    where: plan ? { plan } : undefined,
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(subs)
}

export async function PATCH(req: Request) {
  const session = await getServerSession()
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, email, plan } = body as { userId?: string; email?: string; plan?: 'FREE' | 'SUPPORTER' | 'ULTIMATE' }
  if (!plan || (!userId && !email)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : email
      ? await prisma.user.findUnique({ where: { email } })
      : null

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const updated = await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, plan },
    update: { plan },
  })

  return NextResponse.json(updated)
}
