import slugify from 'slugify'
import { nanoid } from 'nanoid'
import sanityClient from '@/lib/sanity'
import type {
  BlogActor,
  BlogImageMeta,
  BlogListItem,
  BlogPaginationInput,
  BlogPost,
  CreateBlogInput,
  UpdateBlogInput,
} from '@/types/blog'

interface SanityBlogDoc {
  _id: string
  title: string
  excerpt: string
  slug?: { current?: string }
  coverImageId?: string
  authorImageUrl?: string
  authorImageId?: string
  sections: BlogPost['sections']
  status: BlogPost['status']
  author: string
  createdBy: string
  createdByEmail: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

function normalizeSlug(value: string) {
  return slugify(value, { lower: true, strict: true, trim: true })
}

const sectionTypeMap: Record<string, string> = {
  heading: 'blogHeadingSection',
  paragraph: 'blogParagraphSection',
  quote: 'blogQuoteSection',
  list: 'blogListSection',
  image: 'blogImageSection',
}

function toSanitySections(sections: BlogPost['sections']) {
  return sections.map((section) => ({
    ...section,
    _type: sectionTypeMap[section.type] ?? `blog${section.type.charAt(0).toUpperCase() + section.type.slice(1)}Section`,
    _key: section.id,
  }))
}

async function ensureUniqueSlug(base: string, excludeId?: string) {
  const normalized = normalizeSlug(base)
  let candidate = normalized
  let index = 1

  while (true) {
    const count = await sanityClient.fetch<number>(
      excludeId
        ? 'count(*[_type == "blog" && slug.current == $slug && _id != $excludeId])'
        : 'count(*[_type == "blog" && slug.current == $slug])',
      excludeId ? { slug: candidate, excludeId } : { slug: candidate }
    )

    if (!count) {
      return candidate
    }

    index += 1
    candidate = `${normalized}-${index}`
  }
}

function mapToPost(doc: SanityBlogDoc | null): BlogPost | null {
  if (!doc || !doc.slug?.current) return null

  return {
    id: doc._id,
    slug: doc.slug.current,
    title: doc.title,
    excerpt: doc.excerpt,
    coverImageId: doc.coverImageId,
    authorImageUrl: doc.authorImageUrl,
    authorImageId: doc.authorImageId,
    sections: doc.sections || [],
    status: doc.status,
    author: doc.author,
    createdBy: doc.createdBy,
    createdByEmail: doc.createdByEmail,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    publishedAt: doc.publishedAt,
  }
}

function toListItem(post: BlogPost): BlogListItem {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    coverImageId: post.coverImageId,
    author: post.author,
    createdAt: post.createdAt,
    publishedAt: post.publishedAt,
  }
}

export async function createBlog(input: CreateBlogInput, actor: BlogActor) {
  const now = new Date().toISOString()
  const id = `blog_${nanoid(12)}`
  const slug = await ensureUniqueSlug(input.slug || input.title)

  const post: BlogPost = {
    id,
    slug,
    title: input.title,
    excerpt: input.excerpt,
    coverImageId: input.coverImageId,
    authorImageUrl: input.authorImageUrl,
    authorImageId: input.authorImageId,
    sections: input.sections,
    status: input.status ?? 'published',
    author: input.author,
    createdBy: actor.userId,
    createdByEmail: actor.email,
    createdAt: now,
    updatedAt: now,
    publishedAt: input.status === 'draft' ? undefined : now,
  }

  await sanityClient.create({
    _id: id,
    _type: 'blog',
    title: post.title,
    excerpt: post.excerpt,
    slug: { current: post.slug },
    coverImageId: post.coverImageId,
    authorImageUrl: post.authorImageUrl,
    authorImageId: post.authorImageId,
    sections: toSanitySections(post.sections),
    status: post.status,
    author: post.author,
    createdBy: post.createdBy,
    createdByEmail: post.createdByEmail,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt,
  })

  return post
}

export async function getBlogById(id: string) {
  const doc = await sanityClient.fetch<SanityBlogDoc | null>(
    '*[_type == "blog" && _id == $id][0]{_id,title,excerpt,slug,coverImageId,authorImageUrl,authorImageId,sections,status,author,createdBy,createdByEmail,createdAt,updatedAt,publishedAt}',
    { id }
  )

  return mapToPost(doc)
}

export async function getBlogBySlug(slug: string) {
  const doc = await sanityClient.fetch<SanityBlogDoc | null>(
    '*[_type == "blog" && slug.current == $slug][0]{_id,title,excerpt,slug,coverImageId,authorImageUrl,authorImageId,sections,status,author,createdBy,createdByEmail,createdAt,updatedAt,publishedAt}',
    { slug }
  )

  return mapToPost(doc)
}

export async function listPublishedBlogs({ limit = 20, offset = 0 }: BlogPaginationInput = {}) {
  const safeLimit = Math.min(Math.max(limit, 1), 50)
  const safeOffset = Math.max(offset, 0)
  const end = safeOffset + safeLimit

  const docs = await sanityClient.fetch<SanityBlogDoc[]>(
    '*[_type == "blog" && status == "published"] | order(coalesce(publishedAt, createdAt) desc)[$start...$end]{_id,title,excerpt,slug,coverImageId,authorImageUrl,authorImageId,sections,status,author,createdBy,createdByEmail,createdAt,updatedAt,publishedAt}',
    { start: safeOffset, end }
  )

  const items = docs
    .map((doc) => mapToPost(doc))
    .filter((post): post is BlogPost => Boolean(post))
    .map(toListItem)

  return {
    items,
    offset: safeOffset,
    limit: safeLimit,
  }
}

export async function listRelatedByAuthor(author: string, excludeId?: string, limit = 3) {
  const docs = await sanityClient.fetch<SanityBlogDoc[]>(
    excludeId
      ? '*[_type == "blog" && status == "published" && author == $author && _id != $excludeId] | order(coalesce(publishedAt, createdAt) desc)[$start...$end]{_id,title,excerpt,slug,coverImageId,author,createdAt,publishedAt}'
      : '*[_type == "blog" && status == "published" && author == $author] | order(coalesce(publishedAt, createdAt) desc)[$start...$end]{_id,title,excerpt,slug,coverImageId,author,createdAt,publishedAt}',
    excludeId ? { author, excludeId, start: 0, end: limit } : { author, start: 0, end: limit }
  )

  const items = docs
    .map((doc) => mapToPost(doc))
    .filter((post): post is BlogPost => Boolean(post))
    .map(toListItem)

  return items.slice(0, limit)
}

export async function updateBlog(id: string, input: UpdateBlogInput) {
  const existing = await getBlogById(id)
  if (!existing) return null

  const nextTitle = input.title ?? existing.title
  const nextSlug = input.slug || nextTitle
  const normalizedSlug = await ensureUniqueSlug(nextSlug, existing.id)
  const nextStatus = input.status ?? existing.status
  const hasCoverImageUpdate = Object.prototype.hasOwnProperty.call(input, 'coverImageId')
  const nextCoverImageId = hasCoverImageUpdate
    ? input.coverImageId ?? undefined
    : existing.coverImageId

  const updated: BlogPost = {
    ...existing,
    title: nextTitle,
    excerpt: input.excerpt ?? existing.excerpt,
    slug: normalizedSlug,
    coverImageId: nextCoverImageId,
    authorImageUrl: input.authorImageUrl ?? existing.authorImageUrl,
    authorImageId: input.authorImageId ?? existing.authorImageId,
    sections: input.sections ?? existing.sections,
    author: input.author ?? existing.author,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    publishedAt:
      nextStatus === 'published' ? existing.publishedAt ?? new Date().toISOString() : undefined,
  }

  const patch = sanityClient
    .patch(id)
    .set({
      title: updated.title,
      excerpt: updated.excerpt,
      slug: { current: updated.slug },
      authorImageUrl: updated.authorImageUrl,
      authorImageId: updated.authorImageId,
      sections: toSanitySections(updated.sections),
      status: updated.status,
      author: updated.author,
      updatedAt: updated.updatedAt,
      publishedAt: updated.publishedAt,
    })

  if (hasCoverImageUpdate) {
    if (input.coverImageId) {
      patch.set({ coverImageId: input.coverImageId })
    } else {
      patch.unset(['coverImageId'])
    }
  }

  await patch.commit()

  return updated
}

export async function saveImage(input: {
  bytes: Buffer
  mimeType: string
  actor: BlogActor
  filename?: string
}) {
  const asset = await sanityClient.assets.upload('image', input.bytes, {
    contentType: input.mimeType,
    filename: input.filename || `blog-image-${Date.now()}`,
  })

  const now = new Date().toISOString()

  const meta: BlogImageMeta = {
    id: asset._id,
    mimeType: asset.mimeType,
    size: asset.size,
    createdAt: now,
    createdBy: input.actor.userId,
    url: asset.url,
  }

  return meta
}

export async function getImage(imageId: string) {
  const asset = await sanityClient.fetch<{ _id: string; url: string; mimeType: string } | null>(
    '*[_type == "sanity.imageAsset" && _id == $imageId][0]{_id,url,mimeType}',
    { imageId }
  )

  if (!asset?.url) return null

  const response = await fetch(asset.url)
  if (!response.ok) return null

  const bytes = Buffer.from(await response.arrayBuffer())

  return {
    meta: {
      id: asset._id,
      mimeType: asset.mimeType,
      size: bytes.length,
      createdAt: new Date().toISOString(),
      createdBy: 'sanity-asset',
      url: asset.url,
    } satisfies BlogImageMeta,
    bytes,
  }
}

export async function deleteImage(imageId: string) {
  try {
    // Sanity asset IDs are stored as-is (eg. "image-..."), delete directly
    await sanityClient.delete(imageId)
    return true
  } catch (error) {
    console.error('deleteImage failed', error)
    return false
  }
}

export async function touchBlogAuthSession(_input: {
  userId: string
  email: string
  isAdmin: boolean
  ip?: string
  userAgent?: string
}) {
  // No-op for Sanity-backed CMS.
}

export async function archiveBlog(id: string) {
  const blog = await updateBlog(id, { status: 'archived' })
  return blog
}

export async function seedDemoBlog() {
  const post = await createBlog(
    {
      title: 'Welcome to ResumeCraft Blogs',
      excerpt: 'Product updates and resume-writing deep dives.',
      sections: [
        {
          id: `sec_${nanoid(8)}`,
          type: 'paragraph',
          content: 'This blog area is powered by Sanity CMS with section-based content and image blocks.',
        },
        {
          id: `sec_${nanoid(8)}`,
          type: 'paragraph',
          content: 'You can now manage content and media with a headless workflow.',
        },
      ],
      author: 'ResumeCraft Team',
      status: 'published',
    },
    {
      userId: 'seed-system',
      email: 'seed@system.local',
    }
  )

  return post
}
