import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
// import { ensureUserExists } from '@/lib/user-utils'

export async function POST() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Ensure user exists in our database
        // const dbUser = await ensureUserExists(user)

        return NextResponse.json({
            success: true,
            // user: dbUser
        })
    } catch (error) {
        console.error('Error ensuring user:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
