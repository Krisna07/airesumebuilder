import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // NextAuth clients expect JSON here; return an empty object when unauthenticated.
    if (!session) {
      return NextResponse.json({}, { status: 200 })
    }

    return NextResponse.json(session, { status: 200 })
  } catch (error) {
    console.error('Session endpoint error:', error)
    return NextResponse.json({}, { status: 200 })
  }
}

export const dynamic = 'force-dynamic'
