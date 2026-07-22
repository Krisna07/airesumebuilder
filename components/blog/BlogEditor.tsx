'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor as TiptapEditor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import EditorToolbar from './EditorToolbar';
import BlogPreCheckModal from './BlogPreCheckModal';
import BlogPreviewModal from './BlogPreviewModal';
import { Sparkles, Settings, Image as ImageIcon, Eye, Rocket, Pencil, Upload, Loader2, X } from 'lucide-react';
import type { BlogSection, BlogStatus } from '@/types/blog';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function htmlToSections(html: string): BlogSection[] {
  if (typeof document === 'undefined') return [];
  const container = document.createElement('div');
  container.innerHTML = html;
  const sections: BlogSection[] = [];
  let idx = 0;
  const id = () => `sec_${Date.now()}_${idx++}`;
  const imageIdFromSrc = (src?: string | null) => {
    if (!src) return null;
    const m = src.match(/\/api\/blog-images\/([^/?#]+)/i);
    return m?.[1] || null;
  };

  for (const node of Array.from(container.childNodes)) {
    const el = node as HTMLElement;
    if (!el.tagName) continue;
    const tag = el.tagName.toLowerCase();
    if (['h1', 'h2', 'h3', 'h4'].includes(tag)) {
      const level = Math.max(2, Math.min(4, parseInt(tag[1], 10)));
      sections.push({ id: id(), type: 'heading', level: level as 2 | 3 | 4, content: el.textContent || '' });
    } else if (tag === 'img') {
      const imageId = imageIdFromSrc(el.getAttribute('src'));
      if (imageId) {
        sections.push({
          id: id(),
          type: 'image',
          imageId,
          alt: el.getAttribute('alt') || undefined,
        });
      }
    } else if (tag === 'p') {
      const imageNodes = Array.from(el.querySelectorAll('img'));
      const text = el.textContent?.trim();

      // Tiptap often wraps standalone images in <p><img .../></p>
      if (!text && imageNodes.length > 0) {
        imageNodes.forEach((img) => {
          const imageId = imageIdFromSrc(img.getAttribute('src'));
          if (imageId) {
            sections.push({
              id: id(),
              type: 'image',
              imageId,
              alt: img.getAttribute('alt') || undefined,
            });
          }
        });
        continue;
      }

      if (text) sections.push({ id: id(), type: 'paragraph', content: el.innerHTML });
    } else if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(el.querySelectorAll('li')).map(li => li.textContent?.trim() || '').filter(Boolean);
      if (items.length) sections.push({ id: id(), type: 'list', items });
    } else if (tag === 'blockquote') {
      const content = el.querySelector('p')?.textContent?.trim() || el.textContent?.trim() || '';
      if (content) sections.push({ id: id(), type: 'quote', content });
    }
  }
  return sections.length ? sections : [{ id: id(), type: 'paragraph', content: html }];
}

function sectionsToHtml(sections: BlogSection[]): string {
  return sections.map(sec => {
    if (sec.type === 'heading') return `<h${sec.level}>${sec.content}</h${sec.level}>`;
    if (sec.type === 'paragraph') return `<p>${sec.content}</p>`;
    if (sec.type === 'list') return `<ul>${sec.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    if (sec.type === 'quote') return `<blockquote><p>${sec.content}</p>${sec.citation ? `<p>— ${sec.citation}</p>` : ''}</blockquote>`;
    if (sec.type === 'image') return `<p><img src="/api/blog-images/${sec.imageId}" alt="${sec.alt || 'Blog image'}" /></p>`;
    return '';
  }).join('\n');
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BlogEditor() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams?.get('editId') || null;

  // Metadata
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [author, setAuthor] = useState('ResumeCraft Team');
  const [coverImageId, setCoverImageId] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  // UI state
  const [editLoading, setEditLoading] = useState(false);
  const [streamState, setStreamState] = useState<'idle' | 'streaming' | 'done'>('idle');
  const [streamPreview, setStreamPreview] = useState('');   // live HTML accumulator
  const [imageStreaming, setImageStreaming] = useState(false);
  const streamBuffer = useRef('');
  const streamFlushTimer = useRef<number | null>(null);
  const lastStreamApplied = useRef('');
  const abortRef = useRef<AbortController | null>(null);

  const [preCheckOpen, setPreCheckOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [autoToast, setAutoToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const [quickPublishing, setQuickPublishing] = useState(false);
  const [imageGenFailed, setImageGenFailed] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);

  const inlineImageRef = useRef<HTMLInputElement | null>(null);
  const coverImageRef = useRef<HTMLInputElement | null>(null);

  const uploadBlogImage = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/blog-images', { method: 'POST', body: formData });
    const json = await res.json();
    const imageId = json?.data?.imageId || json?.data?.id;
    if (!json.success || !imageId) {
      throw new Error(json.error || 'Image upload failed.');
    }
    return imageId as string;
  }, []);

  const inlineLoadingPlaceholder = useCallback((name: string) => {
    const safe = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="#e2e8f0"/><rect x="40" y="40" width="1120" height="595" rx="16" fill="#cbd5e1"/><text x="600" y="330" text-anchor="middle" font-size="34" font-family="Arial, Helvetica, sans-serif" fill="#475569">Uploading image...</text><text x="600" y="378" text-anchor="middle" font-size="20" font-family="Arial, Helvetica, sans-serif" fill="#64748b">${safe}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }, []);

  const replaceInlinePlaceholder = useCallback((activeEditor: TiptapEditor, token: string, nextSrc: string, alt: string) => {
    let foundPos: number | null = null;
    activeEditor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.alt === token) {
        foundPos = pos;
        return false;
      }
      return true;
    });
    if (foundPos === null) return;
    const tr = activeEditor.state.tr.setNodeMarkup(foundPos, undefined, {
      src: nextSrc,
      alt,
    });
    activeEditor.view.dispatch(tr);
  }, []);

  const removeInlinePlaceholder = useCallback((activeEditor: TiptapEditor, token: string) => {
    let foundPos: number | null = null;
    let nodeSize = 0;
    activeEditor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.alt === token) {
        foundPos = pos;
        nodeSize = node.nodeSize;
        return false;
      }
      return true;
    });
    if (foundPos === null || nodeSize <= 0) return;
    const tr = activeEditor.state.tr.delete(foundPos, foundPos + nodeSize);
    activeEditor.view.dispatch(tr);
  }, []);

  const handleInlineImageUpload = useCallback(async (file: File, activeEditor?: TiptapEditor | null) => {
    if (!activeEditor) return;

    const token = `uploading-inline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeEditor.chain().focus().setImage({
      src: inlineLoadingPlaceholder(file.name),
      alt: token,
    }).run();

    setInlineUploading(true);
    try {
      const imageId = await uploadBlogImage(file);
      replaceInlinePlaceholder(activeEditor, token, `/api/blog-images/${imageId}`, file.name);
      setAutoToast({ type: 'success', text: 'Content image uploaded successfully.' });
      setTimeout(() => setAutoToast(null), 2500);
    } catch (err) {
      removeInlinePlaceholder(activeEditor, token);
      setAutoToast({ type: 'error', text: err instanceof Error ? err.message : 'Image upload failed.' });
      setTimeout(() => setAutoToast(null), 4000);
    } finally {
      setInlineUploading(false);
    }
  }, [inlineLoadingPlaceholder, removeInlinePlaceholder, replaceInlinePlaceholder, uploadBlogImage]);

  // ─── TipTap ────────────────────────────────────────────────────────────────
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({
        placeholder: ({ node }: { node: { type: { name: string } } }) => {
          if (node.type.name === 'heading') return 'Start with your title…';
          return 'Write your story…';
        },
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none min-h-[500px] outline-none focus:outline-none text-slate-900 dark:text-slate-100 px-1',
      },
      handleDrop(_view, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        const file = files[0];
        if (!file.type.startsWith('image/')) return false;

        void handleInlineImageUpload(file, editor);

        event.preventDefault();
        return true;
      },
    },
  });

  const flushStreamIntoEditor = useCallback((force = false) => {
    if (!editor) return;
    const nextHtml = streamBuffer.current;
    if (!force && nextHtml === lastStreamApplied.current) return;
    editor.commands.setContent(nextHtml, false);
    lastStreamApplied.current = nextHtml;
  }, [editor]);

  const queueStreamEditorFlush = useCallback(() => {
    if (streamFlushTimer.current !== null) return;
    streamFlushTimer.current = window.setTimeout(() => {
      streamFlushTimer.current = null;
      flushStreamIntoEditor();
    }, 45);
  }, [flushStreamIntoEditor]);

  // ─── Load existing blog for edit mode ──────────────────────────────────────
  useEffect(() => {
    if (!editId || !editor) return;
    setEditLoading(true);
    fetch(`/api/blogs/${editId}`)
      .then(r => r.json())
      .then((json: { success: boolean; data?: { title?: string; excerpt?: string; author?: string; coverImageId?: string; sections?: BlogSection[] } }) => {
        if (!json.success || !json.data) throw new Error('Blog not found');
        const post = json.data;
        if (post.title) setTitle(post.title);
        if (post.excerpt) setExcerpt(post.excerpt);
        if (post.author) setAuthor(post.author);
        if (post.coverImageId) {
          setCoverImageId(post.coverImageId);
          setCoverImageUrl(`/api/blog-images/${post.coverImageId}`);
        }
        if (post.sections?.length) {
          editor.commands.setContent(sectionsToHtml(post.sections), false);
        }
      })
      .catch(err => {
        setAutoToast({ type: 'error', text: `Failed to load blog: ${err instanceof Error ? err.message : 'Unknown error'}` });
        setTimeout(() => setAutoToast(null), 5000);
      })
      .finally(() => setEditLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, editor]);

  // ─── Stream Generate ────────────────────────────────────────────────────────
  const handleStream = useCallback(async () => {
    if (streamState === 'streaming') {
      abortRef.current?.abort();
      setStreamState('idle');
      return;
    }

    const topic = title.trim();
    if (topic.length < 3) {
      setAutoToast({ type: 'error', text: 'Please enter a title to generate content from.' });
      setTimeout(() => setAutoToast(null), 4000);
      return;
    }

    // Abort any previous stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    streamBuffer.current = '';
    lastStreamApplied.current = '';
    setStreamPreview('');
    setStreamState('streaming');
    setImageStreaming(true);
    editor?.commands.setContent('', false);

    try {
      const res = await fetch(
        `/api/ai/generate-blog?title=${encodeURIComponent(topic)}`,
        { signal: controller.signal }
      );

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error || 'Stream failed');
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = dec.decode(value, { stream: true });
        // Parse SSE lines: "data: {...}\n\n"
        for (const line of raw.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6)) as {
              meta?: { title: string; excerpt: string };
              text?: string;
              coverImage?: { id: string; url?: string };
              done?: boolean;
              error?: string;
            };
            if (payload.error) throw new Error(payload.error);
            if (payload.meta) {
              // Populate title + excerpt from AI-generated meta
              if (payload.meta.title) setTitle(payload.meta.title);
              if (payload.meta.excerpt) setExcerpt(payload.meta.excerpt);
            }
            if (payload.text) {
              streamBuffer.current += payload.text;
              setStreamPreview(streamBuffer.current);
              queueStreamEditorFlush();
            }
            if (payload.coverImage) {
              setCoverImageId(payload.coverImage.id);
              setCoverImageUrl(payload.coverImage.url || `/api/blog-images/${payload.coverImage.id}`);
              setImageStreaming(false);
              setImageGenFailed(false);
            }
            if (payload.done) {
              flushStreamIntoEditor(true);
              setStreamState('done');
              // If no cover image was received by now, mark as failed
              if (!coverImageId) {
                setImageStreaming(false);
                setImageGenFailed(true);
              }
              return;
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      // Fallback if stream ended without explicit done event
      flushStreamIntoEditor(true);
      setStreamState('done');
      if (!coverImageId) {
        setImageStreaming(false);
        setImageGenFailed(true);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setStreamState('idle');
      setImageStreaming(false);
      if (!coverImageId) setImageGenFailed(true);
      setAutoToast({ type: 'error', text: err instanceof Error ? err.message : 'Stream failed.' });
      setTimeout(() => setAutoToast(null), 5000);
    }
  }, [title, streamState, editor, coverImageId, flushStreamIntoEditor, queueStreamEditorFlush]);

  useEffect(() => {
    return () => {
      if (streamFlushTimer.current !== null) {
        window.clearTimeout(streamFlushTimer.current);
      }
    };
  }, []);

  // When streaming completes, clear preview after a beat
  useEffect(() => {
    if (streamState === 'done') {
      const t = setTimeout(() => setStreamPreview(''), 800);
      return () => clearTimeout(t);
    }
  }, [streamState]);

  // ─── Run Blog Automation ───────────────────────────────────────────────────
  async function handleRunAutomation() {
    setAutoRunning(true);
    setAutoToast(null);
    try {
      const res = await fetch('/api/admin/trigger-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Automation failed');

      const d = json.data;
      const text = d?.state === 'skipped'
        ? `Automation skipped — ${d.reason || 'already ran recently'}`
        : `Blog automation created: "${d?.title || 'new post'}"`;
      setAutoToast({ type: 'success', text });
    } catch (err) {
      setAutoToast({ type: 'error', text: err instanceof Error ? err.message : 'Automation failed.' });
    } finally {
      setAutoRunning(false);
      setTimeout(() => setAutoToast(null), 6000);
    }
  }

  // ─── Publish ───────────────────────────────────────────────────────────────
  async function handleConfirmPublish(status: BlogStatus) {
    const html = editor?.getHTML() || '';
    const sections = htmlToSections(html);
    const coverImagePatch = coverImageId
      ? { coverImageId }
      : editId
        ? { coverImageId: null }
        : {};

    const payload = {
      title,
      excerpt,
      author,
      sections,
      status,
      ...coverImagePatch,
    };

    setAutoRunning(true);
    try {
      let res: Response;
      if (editId) {
        // Edit mode: PATCH existing blog
        res = await fetch(`/api/blogs/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create mode: POST new blog
        res = await fetch('/api/blogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Publish failed');

      setAutoToast({
        type: 'success',
        text: status === 'published'
          ? `${editId ? 'Updated' : 'Published'}! /${json.data?.slug || ''}`
          : `Draft ${editId ? 'updated' : 'saved'}.`,
      });
      if (!editId && status === 'draft') {
        // Reset only on new draft create, otherwise redirect handles it
        setTitle('');
        setExcerpt('');
        setAuthor('ResumeCraft Team');
        setCoverImageId(null);
        setCoverImageUrl(null);
        editor?.commands.setContent('');
      }
      setPreCheckOpen(false);

      const slug = json.data?.slug;
      if (status === 'published' && slug) {
        router.push(`/blogs/${slug}`);
      }
      return slug;
    } catch (err) {
      setAutoToast({ type: 'error', text: err instanceof Error ? err.message : 'Publish failed.' });
      return undefined;
    } finally {
      setAutoRunning(false);
      setTimeout(() => setAutoToast(null), 6000);
    }
  }

  // Patch improved content back into editor + meta fields
  function handleImprove(data: { title: string; excerpt: string; sections: BlogSection[]; seoKeywords: string[] }) {
    setTitle(data.title);
    setExcerpt(data.excerpt);
    editor?.commands.setContent(sectionsToHtml(data.sections), false);
    setAutoToast({
      type: 'success',
      text: `Improved! SEO keywords: ${data.seoKeywords.join(', ') || 'none'}`,
    });
    setTimeout(() => setAutoToast(null), 6000);
  }

  // ─── Quick Publish (bypass review) ─────────────────────────────────────────
  async function handleQuickPublish(status: 'published' | 'draft') {
    if (!title.trim() || title.trim().length < 3) {
      setAutoToast({ type: 'error', text: 'Title must be at least 3 characters.' });
      setTimeout(() => setAutoToast(null), 4000);
      return;
    }
    if (!excerpt.trim() || excerpt.trim().length < 10) {
      setAutoToast({ type: 'error', text: 'Excerpt must be at least 10 characters.' });
      setTimeout(() => setAutoToast(null), 4000);
      return;
    }
    setQuickPublishing(true);
    try {
      await handleConfirmPublish(status);
    } finally {
      setQuickPublishing(false);
    }
  }

  // ─── Preview ───────────────────────────────────────────────────────────────
  function handlePreview() {
    if (!title.trim() || title.trim().length < 3) {
      setAutoToast({ type: 'error', text: 'Title must be at least 3 characters to preview.' });
      setTimeout(() => setAutoToast(null), 4000);
      return;
    }
    setPreviewOpen(true);
  }

  // ─── Derived ───────────────────────────────────────────────────────────────
  const editorHtml = editor?.getHTML() || '';
  const editorSections = htmlToSections(editorHtml);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-0">

      {/* ── Edit mode banner ── */}
      {editId && (
        <div className="mb-3 rounded-xl px-4 py-2 text-sm font-medium border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 flex items-center gap-2">
          {editLoading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading blog…</>
            : <><Pencil className="w-3.5 h-3.5" /> Editing existing blog post — changes will update the existing entry.</>
          }
        </div>
      )}

      {/* ── Toast ── */}
      {autoToast && (
        <div className={`mb-3 rounded-xl px-4 py-3 text-sm font-medium border ${
          autoToast.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
            : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
        }`}>
          {autoToast.text}
        </div>
      )}

      {/* ── Top action bar ── */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-t-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
        {/* Generate toggle */}
        <button
          type="button"
          onClick={handleStream}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            streamState === 'streaming'
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'
          }`}
        >
          {streamState === 'streaming'
            ? <><X className="w-3.5 h-3.5" /> Stop AI</>
            : <><Sparkles className="w-3.5 h-3.5" /> Generate</>
          }
        </button>

        {streamState === 'streaming' && (
          <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-medium ml-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Writing in editor…
          </div>
        )}
        <input
          ref={coverImageRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            setCoverUploading(true);
            try {
              const res = await fetch('/api/blog-images', { method: 'POST', body: formData });
              const json = await res.json();
              const imageId = json?.data?.imageId || json?.data?.id;
              if (json.success && imageId) {
                setCoverImageId(imageId);
                setCoverImageUrl(`/api/blog-images/${imageId}`);
                setImageGenFailed(false);
                setAutoToast({ type: 'success', text: 'Cover image uploaded successfully.' });
                setTimeout(() => setAutoToast(null), 2500);
              } else {
                throw new Error(json.error || 'Cover image upload failed.');
              }
            } catch (err) {
              setAutoToast({ type: 'error', text: err instanceof Error ? err.message : 'Cover image upload failed.' });
              setTimeout(() => setAutoToast(null), 4000);
            } finally {
              setCoverUploading(false);
            }
            if (coverImageRef.current) {
              coverImageRef.current.value = '';
            }
          }}
        />

        {/* Insert image */}
        <button
          type="button"
          onClick={() => inlineImageRef.current?.click()}
          disabled={streamState === 'streaming' || inlineUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          {inlineUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />} <span className="hidden md:inline">{inlineUploading ? 'Uploading...' : 'Image'}</span>
        </button>
        <input
          ref={inlineImageRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            await handleInlineImageUpload(file, editor);

            if (inlineImageRef.current) {
              inlineImageRef.current.value = '';
            }
          }}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Run Automation — admin tool to trigger scheduled post generation */}
        <button
          type="button"
          onClick={handleRunAutomation}
          disabled={autoRunning || streamState === 'streaming'}
          title="Run scheduled blog automation (admin)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          {autoRunning
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Settings className="w-3.5 h-3.5" />
          }
          <span className="hidden lg:inline text-xs">Automation</span>
        </button>

        {/* Preview */}
        <button
          type="button"
          onClick={handlePreview}
          disabled={quickPublishing || autoRunning}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>

        {/* Publish */}
        <button
          type="button"
          onClick={() => handleQuickPublish('draft')}
          disabled={quickPublishing || autoRunning}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {quickPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
          Save Draft
        </button>

        {/* Publish */}
        <button
          type="button"
          onClick={() => handleQuickPublish('published')}
          disabled={quickPublishing || autoRunning}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {quickPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
          Publish
        </button>

        {/* Submit for Review */}
        <button
          type="button"
          onClick={() => setPreCheckOpen(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors whitespace-nowrap"
        >
          <Sparkles className="w-3.5 h-3.5" /> AI Review
        </button>
      </div>

      <div className="px-4 py-2 border-x border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Generation on this page never auto-publishes. Review the draft, then publish when ready.
        </p>
      </div>

      {/* ── AI Live Preview ── */}
      {streamState === 'streaming' && streamPreview && (
        <div className="border-x border-slate-200 dark:border-slate-700 bg-teal-50/40 dark:bg-teal-900/10 px-4 py-4">
          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mb-2 uppercase tracking-wide flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            AI typewriter preview...
          </p>
          <div
            className="rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-800/80 px-4 py-3 text-sm prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 opacity-80 pointer-events-none max-h-64 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: streamPreview }}
          />
        </div>
      )}

      {/* ── Metadata ── */}
      <div className="border-x border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-4 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title *"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <input
          type="text"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short excerpt / meta description *"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Author name *"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />

        {/* Cover image row — always visible */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Cover image</p>
          {coverImageUrl ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageUrl}
                alt="Cover"
                className="w-32 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
              />
              <div className="space-y-1">
                {imageStreaming && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> AI generating…
                  </p>
                )}
                {coverUploading && (
                  <p className="text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading cover image…
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => coverImageRef.current?.click()}
                  disabled={coverUploading}
                  className="text-xs text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 disabled:opacity-50 flex items-center gap-1"
                >
                  {coverUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} {coverUploading ? 'Uploading...' : 'Replace'}
                </button>
                <button
                  type="button"
                  onClick={() => { setCoverImageId(null); setCoverImageUrl(null); setImageGenFailed(false); }}
                  disabled={coverUploading}
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-50 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverImageRef.current?.click()}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${imageGenFailed
                ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                : imageStreaming
                  ? 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 cursor-default'
                  : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              disabled={imageStreaming || coverUploading}
            >
              {coverUploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading cover image…</>
              ) : imageStreaming ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> AI generating cover image…</>
              ) : imageGenFailed ? (
                <><Upload className="w-4 h-4" /> Image generation failed — upload manually</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload cover image</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Editor ── */}
      <div className="border-x border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-b-xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <EditorToolbar editor={editor} />
        </div>

        {/* TipTap content */}
        <div className="px-4 py-3">
          <EditorContent editor={editor} />
        </div>

        <p className="px-4 pb-3 text-xs text-slate-400 dark:text-slate-500">
          Drag &amp; drop images directly into the editor.
        </p>
      </div>

      {/* ── Pre-check modal ── */}
      <BlogPreCheckModal
        open={preCheckOpen}
        title={title}
        excerpt={excerpt}
        author={author}
        html={editorHtml}
        sections={editorSections}
        onImprove={handleImprove}
        onConfirm={handleConfirmPublish}
        onClose={() => setPreCheckOpen(false)}
      />

      {/* ── Preview modal ── */}
      <BlogPreviewModal
        open={previewOpen}
        title={title}
        excerpt={excerpt}
        author={author}
        coverImageUrl={coverImageUrl || undefined}
        sections={editorSections}
        onClose={() => setPreviewOpen(false)}
        onConfirm={async (status) => {
          setPreviewOpen(false);
          if (status === 'published' || status === 'draft') {
            await handleQuickPublish(status);
          }
        }}
      />
    </div>
  );
}
