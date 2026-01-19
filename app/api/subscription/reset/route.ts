import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { resetCountsData } from '@/lib/subscription'

export async function POST() {
  const session = await getServerSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const updated = await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, plan: 'FREE', ...resetCountsData() },
    update: resetCountsData(),
  })

  return NextResponse.json(updated)
}
