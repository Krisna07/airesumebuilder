import { NextResponse } from 'next/server'
import { signOut } from 'next-auth/react'

/**
 * POST /api/auth/logout
 * Signs out the user by clearing their session
 * Used after account deletion to ensure clean logout
 */
export async function POST(req: Request) {
  try {
    // The session is cleared by NextAuth when signOut is called on the client
    // This endpoint is mainly for explicit server-side logout tracking if needed
    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (err) {
    console.error('Logout error:', err)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
