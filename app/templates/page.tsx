import type { Metadata } from 'next'
import { CheckCircle2, ListTree, ScanText, Sparkles, Target } from 'lucide-react'
import Templates from '@/components/Templates/templates'
import TemplateGallery from '@/components/Templates/TemplateGallery'

export const metadata: Metadata = {
  title: 'Free ATS Resume Templates | AI Resume Craft',
  description:
    'Browse free ATS-friendly resume templates for software engineers, product roles, and modern professionals. Compare layouts and choose a template that recruiters can scan quickly.',
  keywords: [
    'free ats resume templates',
    'resume templates for software engineers',
    'ai resume template',
    'online cv templates',
    'ats friendly resume format',
  ],
  alternates: {
    canonical: 'https://airesumecraft.xyz/templates',
  },
  openGraph: {
    title: 'Free ATS Resume Templates | AI Resume Craft',
    description:
      'Explore public, recruiter-ready resume templates and choose a free ATS-friendly layout that fits your experience level and target role.',
    url: 'https://airesumecraft.xyz/templates',
    type: 'website',
    images: [
      {
        url: 'https://airesumecraft.xyz/steps/step1.png',
        width: 1200,
        height: 630,
        alt: 'AI Resume Craft templates index',
      },
    ],
  },
}

export default function TemplatesPage() {
  const listSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Resume Craft template gallery',
    itemListElement: Templates.map((template, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `https://airesumecraft.xyz/templates/${template.id}`,
      name: template.name,
      description: template.description,
    })),
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listSchema) }}
      />

      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-teal-50/60 to-indigo-50/60 px-6 py-12 text-center dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/40 sm:px-12 sm:py-16">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-teal-400/20 blur-3xl" />
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200 dark:bg-slate-800/80 dark:text-teal-300 dark:ring-teal-500/30">
          <Sparkles className="h-3.5 w-3.5" /> {Templates.length} templates · 100% free
        </span>
        <h1 className="relative mx-auto mt-5 max-w-3xl text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
          Free ATS-friendly resume templates
        </h1>
        <p className="relative mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
          Compare clean resume layouts built for recruiters and applicant tracking systems.
          Pick one, fill it in with AI, and export unlimited PDFs.
        </p>
        <ul className="relative mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
          {['Parses cleanly in ATS', 'Switch templates anytime', 'No watermark'].map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-teal-500" /> {item}
            </li>
          ))}
        </ul>
      </header>

      <section className="mt-12" aria-label="Template gallery">
        <TemplateGallery />
      </section>

      <section className="mt-20">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Why these templates rank for ATS performance
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
          Use these templates as a starting point, then tailor bullet points for each job
          description to improve interview conversion.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: ListTree, title: 'Clear hierarchy', text: 'Consistent heading labels and plain-language section names that parsers recognise.' },
            { icon: ScanText, title: 'Reliable parsing', text: 'Real text, standard fonts, and spacing that keeps extraction accurate.' },
            { icon: Target, title: 'Built to tailor', text: 'Swap templates without retyping and rewrite bullets to match each posting.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-900/30">
                <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
