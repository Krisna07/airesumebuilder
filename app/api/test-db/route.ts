import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export async function GET() {
    try {
        const prisma = new PrismaClient()

        // Test connection by running a simple query
        await prisma.$connect()
        await prisma.$disconnect()

        return NextResponse.json({
            success: true,
            message: 'Database connection successful'
        })
    } catch (error) {
        console.error('Database connection error:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
