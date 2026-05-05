"use client"

import React from 'react'

export default function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'font-bold text-teal-600' : ''}
        title="Bold (Ctrl+B)"
      >
        <b>B</b>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'italic text-teal-600' : ''}
        title="Italic (Ctrl+I)"
      >
        <i>I</i>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'font-bold text-lg text-teal-600' : ''}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'font-bold text-base text-teal-600' : ''}
        title="Heading 3"
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'text-teal-600' : ''}
        title="Bullet List"
      >
        • List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'text-teal-600' : ''}
        title="Numbered List"
      >
        1. List
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'text-teal-600' : ''}
        title="Blockquote"
      >
        ❝
      </button>
      <button type="button" onClick={() => editor.chain().focus().undo().run()} title="Undo">
        ↺
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} title="Redo">
        ↻
      </button>

      <button
        type="button"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertContent({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Section Title' }] })
            .run()
        }
        title="Add Section (Heading)"
        className="text-blue-600 font-semibold"
      >
        + Section
      </button>

      <button
        type="button"
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'orderedList',
              content: [
                { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Step description' }] }] },
              ],
            })
            .run()
        }
        title="Add Step (Numbered List Item)"
        className="text-green-600 font-semibold"
      >
        + Step
      </button>
    </div>
  )
}
