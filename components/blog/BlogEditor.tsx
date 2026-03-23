'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { nanoid } from 'nanoid'
import type { BlogSection, BlogStatus } from '@/types/blog'
import BlogSectionRenderer from '@/components/blog/BlogSectionRenderer'
import { useAuth } from '@/context/authContext'
import { ImageIcon, Loader } from 'lucide-react'
import { useToast } from '@/context/PopupContext'

type SaveState = 'idle' | 'saving' | 'success' | 'error'

interface AiBlogPreview {
  title: string
  excerpt: string
  slug?: string
  sections: BlogSection[]
  status: BlogStatus
  author: string
  coverImageId: string
  coverImageUrl?: string
}

interface EditorStats {
  paragraphCount: number
  imageCount: number
}

function gatherText(node: JSONContent | undefined): string {
  if (!node) return ''

  if (typeof node.text === 'string') {
    return node.text
  }

  if (!Array.isArray(node.content)) {
    return ''
  }

  return node.content.map((child) => gatherText(child)).join('')
}

function getImageIdFromSrc(src: string): string {
  const match = src.match(/\/api\/blog-images\/([^/?#]+)/)
  return match?.[1] ?? src
}

function getEditorStats(doc: JSONContent): EditorStats {
  const nodes = doc.content ?? []
  let paragraphCount = 0
  let imageCount = 0

  for (const node of nodes) {
    if (node.type === 'paragraph' && gatherText(node).trim().length > 0) {
      paragraphCount += 1
    }

    if (node.type === 'image') {
      imageCount += 1
    }
  }

  return { paragraphCount, imageCount }
}

function editorDocToSections(doc: JSONContent): BlogSection[] {
  const sections: BlogSection[] = []
  const nodes = doc.content ?? []

  for (const node of nodes) {
    if (node.type === 'heading') {
      const levelValue = Number(node.attrs?.level)
      const level: 2 | 3 | 4 = levelValue === 3 || levelValue === 4 ? levelValue : 2
      const content = gatherText(node).trim()

      if (content.length > 0) {
        sections.push({ id: `sec_${nanoid(8)}`, type: 'heading', level, content })
      }

      continue
    }

    if (node.type === 'paragraph') {
      const content = gatherText(node).trim()

      if (content.length > 0) {
        sections.push({ id: `sec_${nanoid(8)}`, type: 'paragraph', content })
      }

      continue
    }

    if (node.type === 'blockquote') {
      const content = gatherText(node).trim()

      if (content.length > 0) {
        sections.push({ id: `sec_${nanoid(8)}`, type: 'quote', content })
      }

      continue
    }

    if (node.type === 'bulletList' || node.type === 'orderedList') {
      const items = (node.content ?? [])
        .map((listItem) => gatherText(listItem).trim())
        .filter((item) => item.length > 0)

      if (items.length > 0) {
        sections.push({ id: `sec_${nanoid(8)}`, type: 'list', items })
      }

      continue
    }

    if (node.type === 'image') {
      const src = String(node.attrs?.src ?? '').trim()
      if (!src) continue

      sections.push({
        id: `sec_${nanoid(8)}`,
        type: 'image',
        imageId: getImageIdFromSrc(src),
        alt: String(node.attrs?.alt ?? '').trim() || undefined,
        caption: '',
      })
    }
  }

  return sections
}

export default function BlogEditor() {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState<BlogStatus>('published')
  const [coverImageId, setCoverImageId] = useState('')
  const [editorStats, setEditorStats] = useState<EditorStats>({ paragraphCount: 0, imageCount: 0 })
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [message, setMessage] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [draggingInlineImage, setDraggingInlineImage] = useState(false)
  const [aiMode, setAiMode] = useState(false)
  const [aiTitle, setAiTitle] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiPreview, setAiPreview] = useState<AiBlogPreview | null>(null)
  const [aiPublishState, setAiPublishState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [aiMessage, setAiMessage] = useState('')
  const inlineImagePickerRef = useRef<HTMLInputElement | null>(null)
  const { user } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    showToast(message)
  }, [message])

  const uploadImage = useCallback(async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/blog-images', {
      method: 'POST',
      body: formData,
    })

    const payload = await response.json()
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || 'Image upload failed')
    }

    return payload.data.imageId as string
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Image,
    ],
    content: {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-slate dark:prose-invert max-w-none min-h-[280px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 focus:outline-none',
      },
    },
    onUpdate({ editor }) {
      setEditorStats(getEditorStats(editor.getJSON()))
    },
  })

  const insertInlineImage = useCallback(
    async (file: File) => {
      if (!editor) return

      if (!file.type.startsWith('image/')) {
        setMessage('Only image files can be inserted.')
        return
      }

      try {
        setUploadingImage(true)
        setMessage('Uploading image...')
        const imageId = await uploadImage(file)

        editor
          .chain()
          .focus()
          .setImage({
            src: `/api/blog-images/${imageId}`,
            alt: file.name,
            title: imageId,
          })
          .run()

        setEditorStats(getEditorStats(editor.getJSON()))
        setMessage('Image inserted into article.')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Image upload failed')
      } finally {
        setUploadingImage(false)
      }
    },
    [editor, uploadImage]
  )

  const insertInlineImages = useCallback(
    async (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))

      if (!imageFiles.length) {
        setMessage('Drop or choose at least one image file.')
        return
      }

      for (const file of imageFiles) {
        // Keep uploads sequential so insertion order matches user order.
        // eslint-disable-next-line no-await-in-loop
        await insertInlineImage(file)
      }
    },
    [insertInlineImage]
  )

  const validation = useMemo(() => {
    const trimmedTitle = title.trim()
    const trimmedAuthor = author.trim()
    const trimmedExcerpt = excerpt.trim()
    const imageCount = editorStats.imageCount + (coverImageId ? 1 : 0)

    return {
      paragraphCount: editorStats.paragraphCount,
      imageCount,
      canSave:
        trimmedTitle.length >= 3 &&
        trimmedAuthor.length >= 2 &&
        trimmedExcerpt.length >= 10 &&
        editorStats.paragraphCount >= 2 &&
        imageCount >= 1,
    }
  }, [title, author, excerpt, editorStats, coverImageId])

  const handleCoverImageChange = async (file: File) => {
    try {
      setUploadingImage(true)
      setMessage('Uploading cover image')
      const imageId = await uploadImage(file)
      setCoverImageId(imageId)
      setMessage('Cover image uploaded.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cover upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  const submit = async () => {
    if (!validation.canSave) {
      setMessage('Author, one image, and at least two paragraph blocks are required.')
      return
    }

    try {
      if (!editor) {
        setMessage('Editor is still loading. Please try again.')
        return
      }

      setSaveState('saving')
      setMessage('Saving blog...')

      const sections = editorDocToSections(editor.getJSON())

      const response = await fetch('/api/createBlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          excerpt,
          slug: slug || undefined,
          status,
          coverImageId: coverImageId || undefined,
          sections,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to save blog')
      }

      setSaveState('success')
      setMessage('Blog published successfully. Redirecting...')

      const blogSlug = payload.data.slug
      window.location.href = `/blogs/${blogSlug}`
    } catch (error) {
      setSaveState('error')
      setMessage(error instanceof Error ? error.message : 'Failed to save blog')
    }
  }

  const generateWithAI = async () => {
    const trimmedTitle = aiTitle.trim()
    if (!trimmedTitle || trimmedTitle.length < 3) {
      setAiMessage('Enter a title of at least 3 characters.')
      return
    }

    try {
      setAiGenerating(true)
      setAiPreview(null)
      setAiMessage('Generating blog content and cover image…')
      setAiPublishState('idle')

      const response = await fetch('/api/ai/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'AI generation failed')
      }

      setAiPreview(payload.data as AiBlogPreview)
      setAiMessage('')
    } catch (error) {
      setAiPublishState('error')
      setAiMessage(error instanceof Error ? error.message : 'AI generation failed')
    } finally {
      setAiGenerating(false)
    }
  }

  const publishAiBlog = async () => {
    if (!aiPreview) return

    try {
      setAiPublishState('saving')
      setAiMessage('Publishing blog…')

      const response = await fetch('/api/createBlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: aiPreview.title,
          author: aiPreview.author,
          excerpt: aiPreview.excerpt,
          slug: aiPreview.slug,
          status: aiPreview.status,
          coverImageId: aiPreview.coverImageId,
          sections: aiPreview.sections,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to publish blog')
      }

      setAiPublishState('success')
      setAiMessage('Blog published successfully. Redirecting…')
      window.location.href = `/blogs/${payload.data.slug}`
    } catch (error) {
      setAiPublishState('error')
      setAiMessage(error instanceof Error ? error.message : 'Failed to publish blog')
    }
  }

  return (
    <section className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-5">

      <header className="space-y-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Write a blog</h1>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI mode</span>
            <button
              type="button"
              role="switch"
              aria-checked={aiMode}
              onClick={() => {
                setAiMode((prev) => !prev)
                setAiPreview(null)
                setAiMessage('')
                setAiPublishState('idle')
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${aiMode ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${aiMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </label>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {aiMode
            ? 'Enter a title and let AI write the full blog and generate a cover image.'
            : 'Write a blog with airesumecraft blog writter'}
        </p>
      </header>

      {aiMode && (
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={aiTitle}
                onChange={(event) => setAiTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !aiGenerating && aiTitle.trim().length >= 3) {
                    void generateWithAI()
                  }
                }}
                placeholder="Enter a blog title to generate…"
                disabled={aiGenerating || aiPublishState === 'saving' || aiPublishState === 'success'}
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => void generateWithAI()}
                disabled={
                  aiGenerating ||
                  aiTitle.trim().length < 3 ||
                  aiPublishState === 'saving' ||
                  aiPublishState === 'success'
                }
                className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium disabled:opacity-50 whitespace-nowrap"
              >
                {aiGenerating ? 'Generating…' : 'Generate with AI'}
              </button>
            </div>
            {aiMessage && !aiPreview ? (
              <p
                className={`text-sm ${aiPublishState === 'error'
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-slate-600 dark:text-slate-400'
                  }`}
              >
                {aiMessage}
              </p>
            ) : null}
          </div>

          {aiGenerating ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-10 flex flex-col items-center gap-3">
              <span className="h-8 w-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Writing blog content and generating cover image…
              </p>
            </div>
          ) : null}

          {aiPreview && !aiGenerating ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {aiPreview.coverImageUrl ? (
                <img
                  src={aiPreview.coverImageUrl}
                  alt={aiPreview.title}
                  className="w-full h-48 sm:h-64 object-cover"
                />
              ) : null}
              <div className="p-5 space-y-5">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {aiPreview.title}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">{aiPreview.excerpt}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">by {aiPreview.author}</p>
                </div>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  {aiPreview.sections.map((section) => (
                    <BlogSectionRenderer key={section.id} section={section} />
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-3">
                  <select
                    value={aiPreview.status}
                    onChange={(event) =>
                      setAiPreview({ ...aiPreview, status: event.target.value as BlogStatus })
                    }
                    disabled={aiPublishState === 'saving' || aiPublishState === 'success'}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void publishAiBlog()}
                    disabled={aiPublishState === 'saving' || aiPublishState === 'success'}
                    className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium disabled:opacity-50"
                  >
                    {aiPublishState === 'saving'
                      ? 'Publishing…'
                      : aiPublishState === 'success'
                        ? 'Published!'
                        : 'Publish blog'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAiPreview(null)
                      setAiMessage('')
                      setAiPublishState('idle')
                    }}
                    disabled={aiPublishState === 'saving' || aiPublishState === 'success'}
                    className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                  {aiMessage ? (
                    <p
                      className={`text-sm ${aiPublishState === 'error'
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-slate-600 dark:text-slate-400'
                        }`}
                    >
                      {aiMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {!aiMode && (
        <>
          <div className="grid gap-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Blog title"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
            />
            <label className='flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group  p-2 gap-2'>
              {/* {user?.image && <img src={user?.image} className='w-8 h-8 rounded-full bg-gray-200 p-1' />} */}
              <input
                value={author}
                onChange={(event) => setAuthor(event.target.value)}
                required
                placeholder={user?.name ? user.name : 'Author Name'}
                className="w-full outline-none"
              />
            </label>
            <textarea
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="Short excerpt"
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
            />
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="Custom slug (optional)"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
            />

            <div className="w-full flex flex-wrap items-center gap-3">
              <label className="w-full text-sm text-slate-700 dark:text-slate-300">
                Cover image
                <div className='relative w-full h-[200px] overflow-hidden group bg-gray-300/25 grid place-items-center' >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        void handleCoverImageChange(file)
                      }
                    }}
                    className="block mt-1 text-sm opacity-0 absolute"
                  />
                  {uploadingImage && message === 'Uploading cover image' ?
                    <div className='grid gap-2 absolute place-items-center z-40'>
                      <Loader className='animate-spin ' />
                      <span className='font-semibold capitalize'>{message.toLocaleLowerCase() === 'cover image uploaded' ? 'Updating Cover Image' : 'Uploading cover Image'}</span>
                    </div> :
                    <ImageIcon className={`${coverImageId && !uploadingImage ? 'opacity-0 group-hover:opacity-100' : ''} absolute z-20`} size={80} />}
                  {coverImageId ? (
                    <img src={`/api/blog-images/${coverImageId}`} className={`relative object-cover rounded-md group-hover:opacity-50 ${uploadingImage && message === 'Uploading cover image' ? 'opacity-50' : ''} z-10`} />
                  ) : null}

                </div>
              </label>

            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`px-4 py-1 rounded text-xs ${editor?.isActive('bold') ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
                }`}
            >
              Bold
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`px-4 py-1 rounded text-xs ${editor?.isActive('italic') ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
                }`}
            >
              Italic
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-4 py-1 rounded text-xs ${editor?.isActive('heading', { level: 2 }) ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
                }`}
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`px-4 py-1 rounded text-xs ${editor?.isActive('heading', { level: 3 }) ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
                }`}
            >
              H3
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`px-4 py-1 rounded text-xs ${editor?.isActive('bulletList') ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
                }`}
            >
              Bullet List
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={`px-4 py-1 rounded text-xs ${editor?.isActive('blockquote') ? 'bg-teal-600 text-white' : 'bg-slate-200 dark:bg-slate-700'
                }`}
            >
              Quote
            </button>
            <button
              type="button"
              onClick={() => inlineImagePickerRef.current?.click()}
              className="px-4 py-1 rounded bg-texs-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 text-sm"
            >
              Insert Image
            </button>
            <input
              ref={inlineImagePickerRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = event.target.files
                if (files?.length) {
                  void insertInlineImages(files)
                }
                event.currentTarget.value = ''
              }}
            />
          </div>

          <div
            onDragEnter={(event) => {
              event.preventDefault()
              setDraggingInlineImage(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setDraggingInlineImage(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              setDraggingInlineImage(false)
            }}
            onDrop={(event) => {
              event.preventDefault()
              setDraggingInlineImage(false)

              const files = event.dataTransfer.files
              if (!files?.length) {
                setMessage('No files detected in drop action.')
                return
              }

              void insertInlineImages(files)
            }}
            onPaste={(event) => {
              const files = event.clipboardData?.files
              if (!files?.length) {
                return
              }

              const hasImage = Array.from(files).some((file) => file.type.startsWith('image/'))
              if (!hasImage) {
                return
              }

              event.preventDefault()
              void insertInlineImages(files)
            }}
            className={`rounded-xl transition-colors ${draggingInlineImage
              ? 'ring-2 ring-teal-400/70 bg-teal-50/40 dark:bg-teal-900/20'
              : 'ring-1 ring-slate-200 dark:ring-slate-700'
              }`}
          >
            <EditorContent editor={editor} />
            <p className="px-3 pb-3 text-xs text-slate-500 dark:text-slate-400">
              Drag and drop images into the editor, use the Insert Image button, or paste screenshots.
            </p>
          </div>
          <div>
            <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              paragraphs: {validation.paragraphCount}/2
            </span>
            <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              images: {validation.imageCount}/1
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 pb-4">
            <div className="relative ">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as BlogStatus)}
                className=" w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer "
              >
                <option value="published" className="bg-white text-gray-800">
                  Published
                </option>
                <option value="draft" className="bg-white text-gray-800">
                  Draft
                </option>
              </select>

              {/* Custom dropdown icon */}
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={!validation.canSave || saveState === 'saving' || uploadingImage}
              className="px-4 py-2 rounded-lg bg-teal-600 text-white disabled:opacity-50"
            >
              {saveState === 'saving' ? 'Saving...' : 'Publish blog'}
            </button>

            {message ? <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p> : null}
          </div>
        </>
      )}
    </section>
  )
}
