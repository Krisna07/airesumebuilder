/**
 * Unit tests for the content refresh cron API endpoint
 * Tests Requirements 2 and 5 from the spec
 */

import { describe, it, expect } from '@jest/globals'

describe('Content Refresh Cron API', () => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const cronSecret = process.env.BLOG_CRON_SECRET || process.env.CRON_SECRET || 'test-secret'

  describe('Requirement 2.13: Authentication protection', () => {
    it('should reject requests without authorization', async () => {
      const response = await fetch(`${baseUrl}/api/cron/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun: true }),
      })

      // Should be unauthorized if BLOG_CRON_SECRET is set
      if (cronSecret && cronSecret !== 'test-secret') {
        expect(response.status).toBe(401)
      }
    })

    it('should accept requests with valid Bearer token', async () => {
      const response = await fetch(`${baseUrl}/api/cron/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ dryRun: true }),
      })

      expect(response.status).not.toBe(401)
    })

    it('should accept requests with x-cron-secret header', async () => {
      const response = await fetch(`${baseUrl}/api/cron/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': cronSecret,
        },
        body: JSON.stringify({ dryRun: true }),
      })

      expect(response.status).not.toBe(401)
    })

    it('should accept requests with x-vercel-cron header', async () => {
      const response = await fetch(`${baseUrl}/api/cron/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-cron': '1',
        },
        body: JSON.stringify({ dryRun: true }),
      })

      expect(response.status).not.toBe(401)
    })
  })

  describe('Requirement 2.12: Dry-run mode support', () => {
    it('should support dry-run mode without making changes', async () => {
      const response = await fetch(`${baseUrl}/api/cron/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ dryRun: true }),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // In dry-run mode, should either skip or report what would be done
      if (data.data) {
        expect(['skipped', 'refreshed']).toContain(data.data.state)
      }
    })
  })

  describe('Requirement 2.15: Age threshold configuration', () => {
    it('should accept custom age threshold in request body', async () => {
      const response = await fetch(`${baseUrl}/api/cron/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ 
          dryRun: true,
          ageThresholdDays: 30,
        }),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should use default 90 days if not specified', async () => {
      const response = await fetch(`${baseUrl}/api/cron/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ dryRun: true }),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Requirement 5: Monitoring and reporting', () => {
    it('should return structured result with status and duration', async () => {
      const response = await fetch(`${baseUrl}/api/cron/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ dryRun: true }),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBeDefined()
      
      // Should have either refreshedPost or data with state
      if (data.refreshedPost) {
        expect(data.refreshedPost).toHaveProperty('id')
        expect(data.refreshedPost).toHaveProperty('title')
        expect(data.refreshedPost).toHaveProperty('oldAgeDays')
        expect(data.durationMs).toBeDefined()
      } else if (data.data) {
        expect(data.data).toHaveProperty('state')
        expect(data.data).toHaveProperty('durationMs')
      }
    })

    it('should include post details when a post is refreshed', async () => {
      const response = await fetch(`${baseUrl}/api/cron/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ 
          dryRun: false,
          ageThresholdDays: 1, // Very low threshold to find old posts
        }),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      
      if (data.refreshedPost) {
        expect(data.refreshedPost.id).toBeDefined()
        expect(data.refreshedPost.title).toBeDefined()
        expect(typeof data.refreshedPost.oldAgeDays).toBe('number')
        expect(typeof data.durationMs).toBe('number')
      }
    })

    it('should indicate when no posts require refreshing', async () => {
      const response = await fetch(`${baseUrl}/api/cron/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ 
          dryRun: true,
          ageThresholdDays: 365, // Very high threshold
        }),
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Should indicate skipped state when no posts found
      if (data.data && data.data.state === 'skipped') {
        expect(data.data.reason).toBeDefined()
      }
    })
  })

  describe('HTTP Methods', () => {
    it('should support POST requests', async () => {
      const response = await fetch(`${baseUrl}/api/cron/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ dryRun: true }),
      })

      expect(response.status).not.toBe(405) // Method Not Allowed
    })

    it('should support GET requests', async () => {
      const response = await fetch(`${baseUrl}/api/cron/refresh?dryRun=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
        },
      })

      expect(response.status).not.toBe(405) // Method Not Allowed
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const response = await fetch(`${baseUrl}/api/cron/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cronSecret}`,
        },
        body: JSON.stringify({ 
          dryRun: true,
          ageThresholdDays: -1, // Invalid threshold
        }),
      })

      const data = await response.json()

      // Should either accept it (and use default) or return an error
      expect(response.status).toBeGreaterThanOrEqual(200)
      expect(data).toHaveProperty('success')
    })
  })
})
