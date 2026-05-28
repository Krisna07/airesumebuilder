type RequestGuardResult = {
  allowed: boolean
  status?: number
  message?: string
}

export function createRequestGuard(cooldownMs = 5000) {
  const pendingRequests = new Map<string, number>()
  const completedRequests = new Map<string, number>()

  const prune = () => {
    const now = Date.now()

    for (const [key, expiresAt] of pendingRequests) {
      if (expiresAt <= now) {
        pendingRequests.delete(key)
      }
    }

    for (const [key, expiresAt] of completedRequests) {
      if (expiresAt <= now) {
        completedRequests.delete(key)
      }
    }
  }

  return {
    tryAcquire(key: string): RequestGuardResult {
      prune()

      const now = Date.now()
      const pendingUntil = pendingRequests.get(key)
      if (pendingUntil && pendingUntil > now) {
        return {
          allowed: false,
          status: 409,
          message: 'A matching request is already running. Please wait a moment and try again.',
        }
      }

      const completedUntil = completedRequests.get(key)
      if (completedUntil && completedUntil > now) {
        return {
          allowed: false,
          status: 409,
          message: 'That request was just processed. Please wait a moment before trying again.',
        }
      }

      pendingRequests.set(key, now + cooldownMs)
      return { allowed: true }
    },
    release(key: string) {
      pendingRequests.delete(key)
      completedRequests.set(key, Date.now() + cooldownMs)
    },
  }
}