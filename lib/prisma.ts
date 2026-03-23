import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as { prisma: PrismaClient }
// const isProduction = process.env.ENVIRONMENT === 'production'

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_DATABASE_URL })
// Cast to `any` here to avoid type conflicts caused by duplicate @types/pg
// in different dependency trees (Prisma adapter vs project). The runtime
// object is compatible; this silences the TypeScript incompatibility.
const adapter = new PrismaPg(pool as unknown as any)

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma