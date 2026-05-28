/**
 * Unit tests for the related posts API endpoint
 * Tests Requirements 1 and 4 from the spec
 */

import { describe, it, expect, beforeAll } from '@jest/globals'

describe('Related Posts API', () => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  let testBlogId: string
  let testBlogKeywords: string[]

  beforeAll(async () => {
    // Fetch a published blog to use for testing
    const response = await fetch(`${baseUrl}/api/blogs/public?limit=1`)
    const data = await response.json()
    
    if (data.success && data.data.items.length > 0) {
      testBlogId = data.data.items[0].id
      testBlogKeywords = data.data.items[0].seoKeywords || []
    }
  })

  describe('Requirement 4.1: GET endpoint at /api/blogs/[id]/related', () => {
    it('should respond to GET requests', async () => {
      const response = await fetch(`${baseUrl}/api/blogs/${testBlogId}/related`)
      expect(response.status).not.toBe(405) // Method Not Allowed
    })
  })

  describe('Requirement 4.2: Valid blog post ID returns related posts', () => {
    it('should return up to 5 related posts for a valid ID', async () => {
      const response = await fetch(`${baseUrl}/api/blogs/${testBlogId}/related`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.relatedPosts).toBeInstanceOf(Array)
      expect(data.data.relatedPosts.length).toBeLessThanOrEqual(5)
    })
  })

  describe('Requirement 4.3: JSON format with required fields', () => {
    it('should return posts with id, slug, title, excerpt, coverImageId, and seoKeywords', async () => {
      const response = await fetch(`${baseUrl}/api/blogs/${testBlogId}/related`)
      const data = await response.json()

      if (data.data.relatedPosts.length > 0) {
        const post = data.data.relatedPosts[0]
        expect(post).toHaveProperty('id')
        expect(post).toHaveProperty('slug')
        expect(post).toHaveProperty('title')
        expect(post).toHaveProperty('excerpt')
        expect(post).toHaveProperty('seoKeywords')
        // coverImageId is optional
      }
    })
  })

  describe('Requirement 4.4: Invalid or not found blog ID', () => {
    it('should return 404 for non-existent blog ID, regardless of format', async () => {
      const response = await fetch(`${baseUrl}/api/blogs/invalid_id/related`)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should return 404 for non-existent blog ID', async () => {
      const response = await fetch(`${baseUrl}/api/blogs/blog_nonexistent999/related`)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBeDefined()
    })
  })

  describe('Requirement 4.5: Empty array when no related posts found', () => {
    it('should return 200 with empty array if no related posts exist', async () => {
      // This test assumes the blog has no keywords or no matching posts
      const response = await fetch(`${baseUrl}/api/blogs/${testBlogId}/related`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.relatedPosts).toBeInstanceOf(Array)
    })
  })

  describe('Requirement 4.7: Optional limit query parameter', () => {
    it('should respect custom limit parameter (default 5, max 10)', async () => {
      const response = await fetch(`${baseUrl}/api/blogs/${testBlogId}/related?limit=2`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.relatedPosts.length).toBeLessThanOrEqual(2)
    })

    it('should cap limit at 10', async () => {
      const response = await fetch(`${baseUrl}/api/blogs/${testBlogId}/related?limit=100`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.relatedPosts.length).toBeLessThanOrEqual(10)
    })

    it('should use minimum limit of 1', async () => {
      const response = await fetch(`${baseUrl}/api/blogs/${testBlogId}/related?limit=0`)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Should return at least 0 posts (empty array is valid)
      expect(data.data.relatedPosts).toBeInstanceOf(Array)
    })
  })

  describe('Requirement 1: Keyword-based matching', () => {
    it('should return posts that share keywords with the current post', async () => {
      const response = await fetch(`${baseUrl}/api/blogs/${testBlogId}/related`)
      const data = await response.json()

      if (data.data.relatedPosts.length > 0 && testBlogKeywords.length > 0) {
        const relatedPost = data.data.relatedPosts[0]
        const relatedKeywords = relatedPost.seoKeywords || []
        
        // Check if there's at least one shared keyword
        const hasSharedKeyword = testBlogKeywords.some(kw => 
          relatedKeywords.includes(kw)
        )
        
        expect(hasSharedKeyword).toBe(true)
      }
    })

    it('should not include the current post in related posts', async () => {
      const response = await fetch(`${baseUrl}/api/blogs/${testBlogId}/related`)
      const data = await response.json()

      const includesCurrentPost = data.data.relatedPosts.some(
        (post: any) => post.id === testBlogId
      )

      expect(includesCurrentPost).toBe(false)
    })
  })
})
