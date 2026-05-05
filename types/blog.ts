export type BlogStatus = 'draft' | 'published' | 'archived'

export type BlogSectionType = 'heading' | 'paragraph' | 'quote' | 'list' | 'image'

export interface BaseSection {
  id: string
  type: BlogSectionType
}

export interface HeadingSection extends BaseSection {
  type: 'heading'
  level: 2 | 3 | 4
  content: string
}

export interface ParagraphSection extends BaseSection {
  type: 'paragraph'
  content: string
}

export interface QuoteSection extends BaseSection {
  type: 'quote'
  content: string
  citation?: string
}

export interface ListSection extends BaseSection {
  type: 'list'
  items: string[]
}

export interface ImageSection extends BaseSection {
  type: 'image'
  imageId: string
  alt?: string
  caption?: string
}

export type BlogSection =
  | HeadingSection
  | ParagraphSection
  | QuoteSection
  | ListSection
  | ImageSection

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  author: string
  authorImageUrl?: string
  authorImageId?: string
  coverImageId?: string
  sections: BlogSection[]
  status: BlogStatus
  createdBy: string
  createdByEmail: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface BlogListItem {
  id: string
  slug: string
  title: string
  excerpt: string
  author: string
  coverImageId?: string
  authorImageUrl?: string
  authorImageId?: string
  createdAt: string
  publishedAt?: string
}

export interface BlogImageMeta {
  id: string
  mimeType: string
  size: number
  createdAt: string
  createdBy: string
  url?: string
}

export interface BlogActor {
  userId: string
  email: string
}

export interface CreateBlogInput {
  title: string
  excerpt: string
  author: string
  authorImageUrl?: string
  authorImageId?: string
  slug?: string
  coverImageId?: string
  sections: BlogSection[]
  status?: BlogStatus
}

export interface UpdateBlogInput {
  title?: string
  excerpt?: string
  author?: string
  authorImageUrl?: string
  authorImageId?: string
  slug?: string
  coverImageId?: string | null
  sections?: BlogSection[]
  status?: BlogStatus
}

export interface BlogPaginationInput {
  limit?: number
  offset?: number
}
