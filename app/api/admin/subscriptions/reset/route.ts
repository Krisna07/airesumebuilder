import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/services/authService'
import { resetCountsData } from '@/lib/subscriptionConfig'

export async function POST() {
  const session = await getServerSession()
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const resetData = resetCountsData()

  const result = await prisma.subscription.updateMany({
    data: resetData,
  })

  return NextResponse.json({ ok: true, updated: result.count })
}
