/**
 * Permanent Account Deletion Utility
 * 
 * This script permanently deletes user accounts that have passed the 15-day grace period
 * after soft deletion. It should be run as a scheduled task (cron job) or manually.
 * 
 * Usage:
 * - As script: npx ts-node lib/permanentAccountDeletion.ts
 * - As API: POST /api/admin/permanent-delete (requires admin auth)
 * - Programmatically: import { permanentDeleteExpiredAccounts } from '@/lib/permanentAccountDeletion'
 */

import { prisma } from '@/lib/prisma'

const GRACE_PERIOD_DAYS = 15

/**
 * Permanently deletes all user accounts that have passed the grace period
 * after soft deletion.
 * 
 * @returns Object with count of deleted accounts and their emails
 */
export async function permanentDeleteExpiredAccounts(): Promise<{
  success: boolean
  deletedCount: number
  deletedEmails: string[]
  error?: string
}> {
  try {
    const expirationThreshold = new Date()
    expirationThreshold.setDate(expirationThreshold.getDate() - GRACE_PERIOD_DAYS)

    // Find users where deletedAt is set and older than grace period
    // Note: Prisma doesn't support complex date arithmetic in queries well,
    // so we fetch users with deletedAt before the threshold
    const expiredUsers = await prisma.user.findMany({
      where: {
        deletedAt: {
          lt: expirationThreshold,
        },
      },
      select: {
        id: true,
        email: true,
      },
    })

    if (expiredUsers.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        deletedEmails: [],
      }
    }

    const userIds = expiredUsers.map((user) => user.id)
    const deletedEmails = expiredUsers.map((user) => user.email)

    // Delete related records first (cascade should handle this, but being explicit)
    // Note: Prisma cascade delete should handle this, but we delete explicitly
    // to ensure related data is removed
    
    // Delete verification records
    await prisma.verification.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    // Delete subscriptions
    await prisma.subscription.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    // Delete usage histories
    await prisma.usageHistory.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    // Delete resumes (which will cascade to analysis results)
    await prisma.resume.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    // Delete job descriptions (which will cascade to analysis results)
    await prisma.jobDescription.deleteMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    // Finally, delete the users themselves
    await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    })

    return {
      success: true,
      deletedCount: expiredUsers.length,
      deletedEmails,
    }
  } catch (error) {
    console.error('Error during permanent account deletion:', error)
    return {
      success: false,
      deletedCount: 0,
      deletedEmails: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Gets count of accounts pending permanent deletion
 * (soft-deleted accounts that have passed the grace period)
 */
export async function getPendingPermanentDeletionCount(): Promise<number> {
  const expirationThreshold = new Date()
  expirationThreshold.setDate(expirationThreshold.getDate() - GRACE_PERIOD_DAYS)

  return prisma.user.count({
    where: {
      deletedAt: {
        lt: expirationThreshold,
      },
    },
  })
}

/**
 * Gets accounts that will be permanently deleted in the next X days
 * Useful for preview/upcoming deletions
 */
export async function getUpcomingDeletions(daysAhead: number = 7): Promise<{
  users: Array<{
    id: string
    email: string
    name: string | null
    deletedAt: Date
    permanentDeletionDate: Date
  }>
  count: number
}> {
  const futureThreshold = new Date()
  futureThreshold.setDate(futureThreshold.getDate() + daysAhead)

  const expirationStart = new Date()
  expirationStart.setDate(expirationStart.getDate() - GRACE_PERIOD_DAYS)

  const users = await prisma.user.findMany({
    where: {
      deletedAt: {
        gte: expirationStart,
        lt: futureThreshold,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      deletedAt: true,
    },
    orderBy: {
      deletedAt: 'asc',
    },
  })

  return {
    users: users.map((user) => {
      const deletionDate = new Date(user.deletedAt!)
      const permanentDate = new Date(deletionDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000)
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        deletedAt: user.deletedAt!,
        permanentDeletionDate: permanentDate,
      }
    }),
    count: users.length,
  }
}

// Allow running as standalone script
if (require.main === module) {
  (async () => {
    console.log('Starting permanent account deletion...')
    console.log(`Grace period: ${GRACE_PERIOD_DAYS} days`)

    const result = await permanentDeleteExpiredAccounts()

    if (result.success) {
      console.log(`Successfully deleted ${result.deletedCount} expired accounts`)
      if (result.deletedEmails.length > 0) {
        console.log('Deleted accounts:', result.deletedEmails.join(', '))
      }
    } else {
      console.error('Error during deletion:', result.error)
      process.exit(1)
    }

    await prisma.$disconnect()
    process.exit(0)
  })()
}