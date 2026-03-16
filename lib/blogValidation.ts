import { z } from 'zod'

const sectionId = z.string().min(1)

const headingSectionSchema = z.object({
  id: sectionId,
  type: z.literal('heading'),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  content: z.string().trim().min(1),
})

const paragraphSectionSchema = z.object({
  id: sectionId,
  type: z.literal('paragraph'),
  content: z.string().trim().min(1),
})

const quoteSectionSchema = z.object({
  id: sectionId,
  type: z.literal('quote'),
  content: z.string().trim().min(1),
  citation: z.string().trim().optional(),
})

const listSectionSchema = z.object({
  id: sectionId,
  type: z.literal('list'),
  items: z.array(z.string().trim().min(1)).min(1),
})

const imageSectionSchema = z.object({
  id: sectionId,
  type: z.literal('image'),
  imageId: z.string().trim().min(1),
  alt: z.string().trim().optional(),
  caption: z.string().trim().optional(),
})

export const blogSectionSchema = z.discriminatedUnion('type', [
  headingSectionSchema,
  paragraphSectionSchema,
  quoteSectionSchema,
  listSectionSchema,
  imageSectionSchema,
])

export const createBlogSchema = z.object({
  title: z.string().trim().min(3).max(180),
  excerpt: z.string().trim().min(10),
  author: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(240).optional(),
  coverImageId: z.string().trim().min(1).max(120).optional(),
  sections: z.array(blogSectionSchema).min(1),
  status: z.union([z.literal('draft'), z.literal('published'), z.literal('archived')]).optional(),
}).superRefine((value, ctx) => {
  const paragraphCount = value.sections.filter((section) => section.type === 'paragraph').length
  const hasSectionImage = value.sections.some((section) => section.type === 'image' && section.imageId.trim().length > 0)
  const hasAnyImage = Boolean(value.coverImageId) || hasSectionImage

  if (!hasAnyImage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one image is required (cover image or image section).',
      path: ['coverImageId'],
    })
  }

  if (paragraphCount < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least two paragraph sections are required.',
      path: ['sections'],
    })
  }
})

export const updateBlogSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  excerpt: z.string().trim().min(10).optional(),
  author: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(2).max(240).optional(),
  coverImageId: z.string().trim().min(1).max(120).optional(),
  sections: z.array(blogSectionSchema).min(1).optional(),
  status: z.union([z.literal('draft'), z.literal('published'), z.literal('archived')]).optional(),
})

export const imageUploadSchema = z.object({
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  size: z.number().int().positive(),
})
