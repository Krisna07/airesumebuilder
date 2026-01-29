
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }
const isProduction = process.env.ENVIRONMENT === 'production'

const connectionString = isProduction
  ? process.env.DATABASE_URL
  : (process.env.NEON_DATABASE_DATABASE_URL || process.env.DATABASE_URL)

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma