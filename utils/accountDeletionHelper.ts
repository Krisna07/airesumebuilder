/**
 * Helper functions for account deletion and recovery flows
 */

export interface DeletionStatus {
  isDeleted: boolean
  isWithinGracePeriod: boolean
  daysRemaining: number | null
  permanentDeleteDate: Date | null
}

/**
 * Check deletion status of an account
 * @param deletedAt - When user initiated deletion
 * @param permanentDeleteAt - When permanent deletion will occur
 * @returns Deletion status info
 */
export function getAccountDeletionStatus(
  deletedAt: Date | null | undefined,
  permanentDeleteAt: Date | null | undefined
): DeletionStatus {
  const now = new Date()

  if (!deletedAt || !permanentDeleteAt) {
    return {
      isDeleted: false,
      isWithinGracePeriod: false,
      daysRemaining: null,
      permanentDeleteDate: null,
    }
  }

  const isDeleted = true
  const isWithinGracePeriod = permanentDeleteAt > now
  const timeDiff = permanentDeleteAt.getTime() - now.getTime()
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

  return {
    isDeleted,
    isWithinGracePeriod,
    daysRemaining: isWithinGracePeriod ? daysRemaining : 0,
    permanentDeleteDate: permanentDeleteAt,
  }
}

/**
 * Calculate permanent deletion date (15 days from deletion)
 * @param deletedAt - When user initiated deletion
 * @returns Date when permanent deletion will occur
 */
export function calculatePermanentDeleteDate(deletedAt: Date): Date {
  const gracePeriodDays = 15
  const permanentDeleteAt = new Date(deletedAt)
  permanentDeleteAt.setDate(permanentDeleteAt.getDate() + gracePeriodDays)
  return permanentDeleteAt
}

/**
 * Format days remaining for user display
 * @param daysRemaining - Number of days remaining
 * @returns Formatted string for UI
 */
export function formatDaysRemaining(daysRemaining: number | null): string {
  if (daysRemaining === null || daysRemaining === 0) {
    return 'Permanently deleting today'
  }

  if (daysRemaining === 1) {
    return 'Expires today'
  }

  if (daysRemaining < 0) {
    return 'Expired'
  }

  return `${daysRemaining} days remaining`
}

/**
 * Check if account can be restored
 * @param deletionStatus - Account deletion status
 * @returns true if account can still be restored
 */
export function canRestoreAccount(deletionStatus: DeletionStatus): boolean {
  return deletionStatus.isDeleted && deletionStatus.isWithinGracePeriod
}
