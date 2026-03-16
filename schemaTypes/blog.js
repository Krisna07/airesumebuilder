import {defineField, defineType} from 'sanity'

const newSectionId = () => `sec_${Math.random().toString(36).slice(2, 10)}`

const headingSection = defineType({
  name: 'blogHeadingSection',
  title: 'Heading Section',
  type: 'object',
  fields: [
    defineField({name: 'id', title: 'Id', type: 'string', initialValue: newSectionId, validation: (Rule) => Rule.required()}),
    defineField({name: 'type', title: 'Type', type: 'string', initialValue: 'heading', hidden: true, readOnly: true}),
    defineField({
      name: 'level',
      title: 'Heading Level',
      type: 'number',
      initialValue: 2,
      options: {list: [{title: 'H2', value: 2}, {title: 'H3', value: 3}, {title: 'H4', value: 4}]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'content', title: 'Content', type: 'string', validation: (Rule) => Rule.required().min(1)}),
  ],
  preview: {
    select: {title: 'content'},
    prepare: ({title}) => ({title: title || 'Heading'}),
  },
})

const paragraphSection = defineType({
  name: 'blogParagraphSection',
  title: 'Paragraph Section',
  type: 'object',
  fields: [
    defineField({name: 'id', title: 'Id', type: 'string', initialValue: newSectionId, validation: (Rule) => Rule.required()}),
    defineField({name: 'type', title: 'Type', type: 'string', initialValue: 'paragraph', hidden: true, readOnly: true}),
    defineField({name: 'content', title: 'Content', type: 'text', rows: 5, validation: (Rule) => Rule.required().min(1)}),
  ],
  preview: {
    select: {title: 'content'},
    prepare: ({title}) => ({title: title ? `${title.slice(0, 80)}` : 'Paragraph'}),
  },
})

const quoteSection = defineType({
  name: 'blogQuoteSection',
  title: 'Quote Section',
  type: 'object',
  fields: [
    defineField({name: 'id', title: 'Id', type: 'string', initialValue: newSectionId, validation: (Rule) => Rule.required()}),
    defineField({name: 'type', title: 'Type', type: 'string', initialValue: 'quote', hidden: true, readOnly: true}),
    defineField({name: 'content', title: 'Quote', type: 'text', rows: 4, validation: (Rule) => Rule.required().min(1)}),
    defineField({name: 'citation', title: 'Citation', type: 'string'}),
  ],
  preview: {
    select: {title: 'citation', subtitle: 'content'},
    prepare: ({title, subtitle}) => ({title: title || 'Quote', subtitle: subtitle || ''}),
  },
})

const listSection = defineType({
  name: 'blogListSection',
  title: 'List Section',
  type: 'object',
  fields: [
    defineField({name: 'id', title: 'Id', type: 'string', initialValue: newSectionId, validation: (Rule) => Rule.required()}),
    defineField({name: 'type', title: 'Type', type: 'string', initialValue: 'list', hidden: true, readOnly: true}),
    defineField({name: 'items', title: 'Items', type: 'array', of: [{type: 'string'}], validation: (Rule) => Rule.required().min(1)}),
  ],
  preview: {
    select: {items: 'items'},
    prepare: ({items}) => ({title: `List (${Array.isArray(items) ? items.length : 0})`}),
  },
})

const imageSection = defineType({
  name: 'blogImageSection',
  title: 'Image Section',
  type: 'object',
  fields: [
    defineField({name: 'id', title: 'Id', type: 'string', initialValue: newSectionId, validation: (Rule) => Rule.required()}),
    defineField({name: 'type', title: 'Type', type: 'string', initialValue: 'image', hidden: true, readOnly: true}),
    defineField({
      name: 'imageId',
      title: 'Image Asset Id',
      type: 'string',
      description: 'Sanity image asset id (ex: image-abc123-1200x630-png).',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({name: 'alt', title: 'Alt Text', type: 'string'}),
    defineField({name: 'caption', title: 'Caption', type: 'string'}),
  ],
  preview: {
    select: {title: 'caption', subtitle: 'imageId'},
    prepare: ({title, subtitle}) => ({title: title || 'Image', subtitle: subtitle || ''}),
  },
})

export const blogSchema = defineType({
  name: 'blog',
  title: 'Blog',
  type: 'document',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required().min(3).max(180)}),
    defineField({name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3, validation: (Rule) => Rule.required().min(10)}),
    defineField({name: 'author', title: 'Author', type: 'string', validation: (Rule) => Rule.required().min(2).max(120)}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title', maxLength: 240}, validation: (Rule) => Rule.required()}),
    defineField({
      name: 'coverImageId',
      title: 'Cover Image Asset Id',
      type: 'string',
      description: 'Sanity image asset id used by the app image endpoint.',
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        {type: 'blogHeadingSection'},
        {type: 'blogParagraphSection'},
        {type: 'blogQuoteSection'},
        {type: 'blogListSection'},
        {type: 'blogImageSection'},
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'draft',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Published', value: 'published'},
          {title: 'Archived', value: 'archived'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'createdBy', title: 'Created By User Id', type: 'string'}),
    defineField({name: 'createdByEmail', title: 'Created By Email', type: 'string'}),
    defineField({name: 'createdAt', title: 'Created At', type: 'datetime'}),
    defineField({name: 'updatedAt', title: 'Updated At', type: 'datetime'}),
    defineField({name: 'publishedAt', title: 'Published At', type: 'datetime'}),
  ],
  validation: (Rule) =>
    Rule.custom((doc) => {
      if (!doc) return true

      const sections = Array.isArray(doc.sections) ? doc.sections : []
      const paragraphCount = sections.filter((section) => section?.type === 'paragraph' && section?.content?.trim()).length
      const hasSectionImage = sections.some((section) => section?.type === 'image' && section?.imageId?.trim())
      const hasCoverImage = Boolean(doc.coverImageId?.trim())

      if (!hasSectionImage && !hasCoverImage) {
        return 'At least one image is required (cover image or image section).'
      }

      if (paragraphCount < 2) {
        return 'At least two paragraph sections are required.'
      }

      return true
    }),
  preview: {
    select: {title: 'title', subtitle: 'author', status: 'status'},
    prepare: ({title, subtitle, status}) => ({
      title: title || 'Untitled blog',
      subtitle: `${subtitle || 'No author'} • ${status || 'draft'}`,
    }),
  },
})

export const blogSectionSchemas = [
  headingSection,
  paragraphSection,
  quoteSection,
  listSection,
  imageSection,
]
