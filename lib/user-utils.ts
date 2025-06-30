import { PrismaClient } from '@prisma/client'
import type { User } from '@supabase/supabase-js'

const prisma = new PrismaClient()

export async function ensureUserExists(supabaseUser: User) {
    try {
        // Check if user already exists in our database
        let user = await prisma.user.findUnique({
            where: { email: supabaseUser.email! }
        })

        // If user doesn't exist, create them
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: supabaseUser.id,
                    email: supabaseUser.email!,
                }
            })
        }

        return user
    } catch (error) {
        console.error('Error ensuring user exists:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}
