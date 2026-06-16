import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { permanentDeleteExpiredAccounts } from '@/lib/permanentAccountDeletion'

/**
 * Admin endpoint to permanently delete expired accounts
 * 
 * POST /api/admin/permanent-delete
 * 
 * Requires admin authentication
 */
export async function POST(_req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  })

  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const result = await permanentDeleteExpiredAccounts()

    if (result.success) {
      return NextResponse.json({
        success: true,
        deletedCount: result.deletedCount,
        deletedEmails: result.deletedEmails,
      })
    } else {
      return NextResponse.json(
        { error: 'Deletion failed', details: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Permanent deletion error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'