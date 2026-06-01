import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Templates from '@/components/Templates/templates'

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

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Free ATS-friendly resume templates
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          Compare clean resume layouts built for recruiters and applicant tracking systems.
          Each template page includes format guidance, best-use roles, and direct links to start
          editing your resume.
        </p>
      </header>

      <section className="mt-10 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
        <Image
          src="/steps/step1.png"
          alt="AI Resume Craft interactive markdown form builder and split-pane real-time PDF generator interface"
          width={1536}
          height={1024}
          priority
          className="h-auto w-full object-cover"
        />
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Templates.map((template) => (
          <article
            key={template.id}
            className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-colors hover:border-teal-500 dark:border-slate-700 dark:bg-slate-900/70"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{template.name}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {template.description}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {template.tags?.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                >
                  {tag}
                </li>
              ))}
            </ul>
            <Link
              href={`/templates/${template.id}`}
              className="mt-4 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-600 dark:text-teal-300 dark:hover:text-teal-200"
            >
              View template details
            </Link>
          </article>
        ))}
      </section>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-white/80 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Why these templates rank for ATS performance
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Every format focuses on hierarchy, consistent heading labels, plain-language section
          names, and spacing that keeps parsing reliable. Use these templates as a starting point,
          then tailor bullet points for each job description to improve interview conversion.
        </p>
      </section>
    </main>
  )
}
