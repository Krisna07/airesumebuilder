'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import EditorToolbar from './EditorToolbar';
import BlogPreCheckModal from './BlogPreCheckModal';
import type { BlogSection, BlogStatus } from '@/types/blog';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function htmlToSections(html: string): BlogSection[] {
  if (typeof document === 'undefined') return [];
  const container = document.createElement('div');
  container.innerHTML = html;
  const sections: BlogSection[] = [];
  let idx = 0;
  const id = () => `sec_${Date.now()}_${idx++}`;

  for (const node of Array.from(container.childNodes)) {
    const el = node as HTMLElement;
    if (!el.tagName) continue;
    const tag = el.tagName.toLowerCase();
    if (['h1', 'h2', 'h3', 'h4'].includes(tag)) {
      const level = Math.max(2, Math.min(4, parseInt(tag[1], 10)));
      sections.push({ id: id(), type: 'heading', level: level as 2 | 3 | 4, content: el.textContent || '' });
    } else if (tag === 'p') {
      const text = el.textContent?.trim();
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
  const abortRef = useRef<AbortController | null>(null);

  const [preCheckOpen, setPreCheckOpen] = useState(false);
  const [autoToast, setAutoToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);
  const [quickPublishing, setQuickPublishing] = useState(false);

  const inlineImageRef = useRef<HTMLInputElement | null>(null);

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
        const reader = new FileReader();
        reader.onload = (e) => {
          editor?.chain().focus().setImage({ src: e.target?.result as string }).run();
        };
        reader.readAsDataURL(file);
        event.preventDefault();
        return true;
      },
    },
  });

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
    setStreamPreview('');
    setStreamState('streaming');
    setImageStreaming(true);

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
            }
            if (payload.coverImage) {
              setCoverImageId(payload.coverImage.id);
              setCoverImageUrl(payload.coverImage.url || `/api/blog-images/${payload.coverImage.id}`);
              setImageStreaming(false);
            }
            if (payload.done) {
              // Load full streamed HTML into TipTap
              editor?.commands.setContent(streamBuffer.current, false);
              setStreamState('done');
              return;
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      // Fallback if stream ended without explicit done event
      editor?.commands.setContent(streamBuffer.current, false);
      setStreamState('done');
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setStreamState('idle');
      setAutoToast({ type: 'error', text: err instanceof Error ? err.message : 'Stream failed.' });
      setTimeout(() => setAutoToast(null), 5000);
    }
  }, [title, streamState, editor]);

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
        ? `⚙️ Automation skipped — ${d.reason || 'already ran recently'}`
        : `✅ Blog automation created: "${d?.title || 'new post'}"`;
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
    const payload = {
      title,
      excerpt,
      author,
      sections,
      status,
      ...(coverImageId ? { coverImageId } : {}),
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
          ? `✅ ${editId ? 'Updated' : 'Published'}! /${json.data?.slug || ''}`
          : `✅ Draft ${editId ? 'updated' : 'saved'}.`,
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
      text: `✨ Improved! SEO keywords: ${data.seoKeywords.join(', ') || 'none'}`,
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
  async function handlePreview() {
    if (!title.trim() || title.trim().length < 3) {
      setAutoToast({ type: 'error', text: 'Title must be at least 3 characters to preview.' });
      setTimeout(() => setAutoToast(null), 4000);
      return;
    }
    
    // Open preview window synchronously to avoid popup blockers
    const previewWindow = window.open('about:blank', '_blank')
    if (!previewWindow) {
      setAutoToast({ type: 'error', text: 'Popup blocked! Please allow popups to preview.' })
      return
    }

    setQuickPublishing(true);
    try {
      const slug = await handleConfirmPublish('draft');
      if (slug) {
        previewWindow.location.href = `/blogs/${slug}`;
      } else {
        previewWindow.close();
      }
    } catch {
      previewWindow.close();
    } finally {
      setQuickPublishing(false);
    }
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
            ? <><span className="inline-block w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> Loading blog…</>
            : <>✏️ Editing existing blog post — changes will update the existing entry.</>
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
          {streamState === 'streaming' ? '■ Stop AI' : '✨ Generate'}
        </button>

        {streamState === 'streaming' && (
          <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-medium ml-2">
            <span className="inline-block w-3.5 h-3.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Writing…
          </div>
        )}
        {imageStreaming && (
          <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-medium ml-2">
            <span className="inline-block w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            Cover…
          </div>
        )}

        {/* Run Automation */}
        <button
          type="button"
          onClick={handleRunAutomation}
          disabled={autoRunning || streamState === 'streaming'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors ml-auto md:ml-0"
        >
          {autoRunning ? (
            <span className="inline-block w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : '⚙️'}
          <span className="hidden md:inline">Run Automation</span>
        </button>

        {/* Insert image */}
        <button
          type="button"
          onClick={() => inlineImageRef.current?.click()}
          disabled={streamState === 'streaming'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          📷 <span className="hidden md:inline">Image</span>
        </button>
        <input
          ref={inlineImageRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              editor?.chain().focus().setImage({ src: ev.target?.result as string, alt: file.name }).run();
            };
            reader.readAsDataURL(file);
            e.currentTarget.value = '';
          }}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Preview */}
        <button
          type="button"
          onClick={handlePreview}
          disabled={quickPublishing || autoRunning}
          className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          👁️ Preview
        </button>

        {/* Publish */}
        <button
          type="button"
          onClick={() => handleQuickPublish('published')}
          disabled={quickPublishing || autoRunning}
          className="px-4 py-1.5 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          {quickPublishing ? '…' : '🚀 Publish'}
        </button>

        {/* Submit for Review */}
        <button
          type="button"
          onClick={() => setPreCheckOpen(true)}
          className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors whitespace-nowrap"
        >
          ✨ AI Review
        </button>
      </div>

      {/* ── AI Live Preview ── */}
      {streamState === 'streaming' && streamPreview && (
        <div className="border-x border-slate-200 dark:border-slate-700 bg-teal-50/40 dark:bg-teal-900/10 px-4 py-4">
          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mb-2 uppercase tracking-wide flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            AI is drafting...
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

        {/* Cover image preview */}
        {coverImageUrl && (
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageUrl}
              alt="Cover"
              className="w-32 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Cover image</p>
              <button
                type="button"
                onClick={() => { setCoverImageId(null); setCoverImageUrl(null); }}
                className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
              >
                ✕ Remove
              </button>
            </div>
          </div>
        )}
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
    </div>
  );
}
