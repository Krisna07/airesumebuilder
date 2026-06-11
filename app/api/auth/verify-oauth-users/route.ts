import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    // Security: This should only run once or from authorized context
    // In production, you'd want to add proper authentication
    const authHeader = req.headers.get('authorization')
    const expectedToken = process.env.MIGRATION_TOKEN

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mark all OAuth users (Google, GitHub) as verified
    // They've already proven email ownership through the OAuth provider
    const result = await prisma.user.updateMany({
      where: {
        provider: {
          in: ['google', 'github']
        },
        isVerified: {
          not: true
        }
      },
      data: {
        isVerified: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} OAuth users as verified`,
      count: result.count
    })
  } catch (error) {
    console.error('Error verifying OAuth users:', error)
    return NextResponse.json(
      { error: 'Failed to verify OAuth users' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get stats on unverified OAuth users
    const stats = await prisma.user.groupBy({
      by: ['provider'],
      where: {
        provider: {
          in: ['google', 'github']
        }
      },
      _count: {
        id: true
      }
    })

    const unverifiedStats = await prisma.user.groupBy({
      by: ['provider'],
      where: {
        provider: {
          in: ['google', 'github']
        },
        isVerified: {
          not: true
        }
      },
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      totalOAuthUsers: stats,
      unverifiedOAuthUsers: unverifiedStats,
      message: 'To mark OAuth users as verified, POST to this endpoint with Authorization header'
    })
  } catch (error) {
    console.error('Error fetching OAuth user stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
