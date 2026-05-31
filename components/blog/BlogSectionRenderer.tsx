import type { BlogSection } from '@/types/blog'

interface BlogSectionRendererProps {
  section: BlogSection
}

function normalizeFaqItem(item: string): string {
  const trimmedItem = item.trim()

  // Handle compact FAQ content like: Q:Question?A:Answer
  const compactFaqMatch = trimmedItem.match(
    /^(?:<strong>)?\s*Q:\s*(.*?)(?:<\/strong>)?\s*(?:<br\s*\/?>|\s+)?\s*A:\s*([\s\S]*)$/i
  )

  if (compactFaqMatch) {
    const question = compactFaqMatch[1].trim()
    const answer = compactFaqMatch[2].trim()
    return `<strong>Q: ${question}</strong><br />A: ${answer}`
  }

  // Fallback cleanup for partially formatted FAQ strings.
  return trimmedItem
    .replace(/<strong>\s*Q:\s*/i, '<strong>Q: ')
    .replace(/<\/strong>\s*(?:<br\s*\/?>)?\s*A:\s*/i, '</strong><br />A: ')
}

export default function BlogSectionRenderer({ section }: BlogSectionRendererProps) {
  if (section.type === 'heading') {
    const Tag = `h${section.level}` as 'h2' | 'h3' | 'h4'
    return <Tag className="font-semibold text-slate-900 dark:text-slate-100 mt-8 mb-3">{section.content}</Tag>
  }

  if (section.type === 'paragraph') {
    return (
      <div
        className="text-slate-700 dark:text-slate-300 leading-7 mb-4"
        dangerouslySetInnerHTML={{ __html: section.content }}
      />
    )
  }

  if (section.type === 'quote') {
    return (
      <blockquote className="border-l-4 border-teal-500/70 pl-4 italic text-slate-700 dark:text-slate-300 my-5">
        <p className="whitespace-pre-wrap">{section.content}</p>
        {section.citation ? (
          <footer className="mt-2 not-italic text-sm text-slate-500 dark:text-slate-400">{section.citation}</footer>
        ) : null}
      </blockquote>
    )
  }

  if (section.type === 'list') {
    // Detect if this is an FAQ list
    const isFaqList = section.items.some(item =>
      /^\s*(?:<strong>\s*)?Q:/i.test(item.trim()) ||
      item.includes('<strong>Q:')
    )

    if (isFaqList) {
      return (
        <ul className="list-none ml-0 mb-6 space-y-6 text-slate-700 dark:text-slate-300">
          {section.items.map((item, idx) => (
            <li
              key={`${section.id}-item-${idx}`}
              className="pl-4 border-l-2 border-teal-500/30 py-2"
              dangerouslySetInnerHTML={{ __html: normalizeFaqItem(item) }}
            />
          ))}
        </ul>
      )
    }

    // Standard list rendering (existing code)
    return (
      <ul className="list-disc ml-6 mb-4 space-y-2 text-slate-700 dark:text-slate-300">
        {section.items.map((item, idx) => (
          <li key={`${section.id}-item-${idx}`} dangerouslySetInnerHTML={{ __html: item }} />
        ))}
      </ul>
    )
  }

  return (
    <figure className="my-6">
      <img
        src={`/api/blog-images/${section.imageId}`}
        alt={section.alt || 'Blog image'}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700"
      />
      {section.caption ? (
        <figcaption className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">{section.caption}</figcaption>
      ) : null}
    </figure>
  )
}
