import { z } from 'zod'

// ─── Section schemas (z.union avoids Zod v4 discriminatedUnion propValues bug) ─

const headingSectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('heading'),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  content: z.string().min(1),
})

const paragraphSectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('paragraph'),
  content: z.string().min(1),
})

const quoteSectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('quote'),
  content: z.string().min(1),
  citation: z.string().optional(),
})

const listSectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('list'),
  items: z.array(z.string().min(1)).min(1),
})

const imageSectionSchema = z.object({
  id: z.string().min(1),
  type: z.literal('image'),
  imageId: z.string().min(1),
  alt: z.string().optional(),
  caption: z.string().optional(),
})

// Use z.union instead of z.discriminatedUnion to avoid Zod v4 _zod.propValues crash
export const blogSectionSchema = z.union([
  headingSectionSchema,
  paragraphSectionSchema,
  quoteSectionSchema,
  listSectionSchema,
  imageSectionSchema,
])

// ─── Word Count Validation ───────────────────────────────────────────────────

export function calculateWordCount(sections: BlogSection[]): number {
  let totalWords = 0

  for (const section of sections) {
    if (section.type === 'paragraph' && typeof section.content === 'string') {
      totalWords += section.content.trim().split(/\s+/).length
    }
  }

  return totalWords
}

export function validateWordCount(sections: BlogSection[], status: BlogStatus): { valid: boolean; error?: string } {
  const minimumWordCount = parseInt(process.env.BLOG_MIN_WORD_COUNT || '1500')

  // Only validate published posts
  if (status === 'published') {
    const wordCount = calculateWordCount(sections)
    if (wordCount < minimumWordCount) {
      return {
        valid: false,
        error: `Word count validation failed: ${wordCount} words (minimum: ${minimumWordCount}). Add more content or save as draft.`
      }
    }
  }

  return { valid: true }
}

// ─── Validation Schemas ──────────────────────────────────────────────────────

export const createBlogSchema = z.object({
  title: z.string().min(3).max(180),
  excerpt: z.string().min(10),
  author: z.string().min(2).max(120),
  authorImageId: z.string().min(1).optional(),
  authorImageUrl: z.string().min(1).optional(),
  slug: z.string().min(2).max(240).optional(),
  // coverImageId is optional — editor-written posts may not have a cover image
  coverImageId: z.string().min(1).max(120).optional(),
  seoKeywords: z.array(z.string()).optional(),
  sections: z.array(blogSectionSchema).min(1),
  status: z.enum(['draft', 'published', 'archived']).optional(),
})

export const updateBlogSchema = z.object({
  title: z.string().min(3).max(180).optional(),
  excerpt: z.string().min(10).optional(),
  author: z.string().min(2).max(120).optional(),
  authorImageId: z.string().min(1).optional(),
  authorImageUrl: z.string().min(1).optional(),
  slug: z.string().min(2).max(240).optional(),
  // null means explicit remove during edit mode
  coverImageId: z.string().min(1).max(120).nullable().optional(),
  seoKeywords: z.array(z.string()).optional(),
  sections: z.array(blogSectionSchema).min(1).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
})

export const imageUploadSchema = z.object({
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  size: z.number().int().positive(),
})
