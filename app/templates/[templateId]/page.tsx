import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import Templates from '@/components/Templates/templates'

type RouteParams = {
  params: Promise<{
    templateId: string
  }>
}

const templateUseCases: Record<string, string[]> = {
  default: [
    'Software engineer resume format with ATS-safe headings',
    'General tech applications needing clear chronology',
    'Candidates who need dense detail on one page',
  ],
  classic: [
    'Academic and research-focused applications',
    'Formal corporate roles with long experience history',
    'Conservative industries preferring traditional formatting',
  ],
  modern: [
    'Product, UX, and startup-focused applications',
    'Applicants balancing readability with modern design',
    'Portfolios that emphasize headline impact',
  ],
  executive: [
    'Director and senior leadership resumes',
    'Strategy and operations roles',
    'Applicants needing an authoritative professional tone',
  ],
  signal: [
    'Marketing and growth-focused resumes',
    'Sales candidates needing impact-oriented bullets',
    'Applicants optimizing for attention and scannability',
  ],
  minimal: [
    'Developer resumes prioritizing speed of review',
    'International applications requiring simple structure',
    'Candidates applying to ATS-heavy pipelines',
  ],
  template01: [
    'Two-column profile-driven resumes',
    'Candidates with strong skills and certifications',
    'Balanced layouts for consulting and tech roles',
  ],
  template02: [
    'Creative and product design applications',
    'Applicants with project-heavy experience',
    'Resumes requiring whitespace and visual clarity',
  ],
  atlas: [
    'Technical specialists with deep skill stacks',
    'Applicants with detailed project timelines',
    'Candidates needing structured two-column hierarchy',
  ],
  horizon: [
    'Premium-feel applications for modern teams',
    'Applicants wanting stronger top-section branding',
    'Role types where visual polish supports credibility',
  ],
}

export async function generateStaticParams() {
  return Templates.map((template) => ({
    templateId: template.id,
  }))
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { templateId } = await params
  const template = Templates.find((item) => item.id === templateId)

  if (!template) {
    return {
      title: 'Template Not Found | AI Resume Craft',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return {
    title: `${template.name} Resume Template | Free ATS Format`,
    description: `${template.name} is a free ATS-friendly resume template from AI Resume Craft. Review structure, ideal use cases, and start editing instantly.`,
    keywords: [
      `${template.name.toLowerCase()} resume template`,
      'free ats resume format',
      'ai resume builder template',
      'resume template for tech professionals',
    ],
    alternates: {
      canonical: `https://airesumecraft.xyz/templates/${template.id}`,
    },
    openGraph: {
      title: `${template.name} Resume Template | Free ATS Format`,
      description: `${template.name} template page with structure guidance and role-specific tips for ATS-friendly applications.`,
      url: `https://airesumecraft.xyz/templates/${template.id}`,
      type: 'article',
      images: [
        {
          url: 'https://airesumecraft.xyz/steps/step2.png',
          width: 1200,
          height: 630,
          alt: `${template.name} resume template guide`,
        },
      ],
    },
  }
}

export default async function TemplateDetailPage({ params }: RouteParams) {
  const { templateId } = await params
  const template = Templates.find((item) => item.id === templateId)

  if (!template) {
    notFound()
  }

  const useCases = templateUseCases[template.id] ?? [
    'ATS-friendly applications requiring readable hierarchy',
    'Job seekers targeting technology roles',
    'Candidates needing quick customization and export',
  ]

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Resume Craft',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
    featureList: [
      'ATS-friendly template selection',
      'AI-assisted resume writing',
      'Markdown-supported editing',
      'Unlimited free PDF exports',
    ],
    description: `${template.name} template page with practical formatting guidance for ATS-friendly resume creation.`,
    url: `https://airesumecraft.xyz/templates/${template.id}`,
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-600 dark:text-slate-300">
        <Link href="/templates" className="hover:text-teal-700 dark:hover:text-teal-300">
          Templates
        </Link>
        <span className="px-2">/</span>
        <span className="font-medium text-slate-800 dark:text-slate-100">{template.name}</span>
      </nav>

      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {template.name} resume template
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
          {template.description} This format is optimized for ATS readability and recruiter scanning,
          with a clear section order and consistent heading structure.
        </p>
      </header>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
        <Image
          src="/steps/step2.png"
          alt={`${template.name} template in AI Resume Craft editor interface`}
          width={1536}
          height={1024}
          className="h-auto w-full object-cover"
        />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white/80 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Best use cases for {template.name}
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
          {useCases.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white/80 p-6 dark:border-slate-700 dark:bg-slate-900/60">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          ATS formatting checklist
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
          <li>Use explicit section titles such as Experience, Skills, Education, and Projects.</li>
          <li>Keep bullet points action-led and add role-specific keywords from job descriptions.</li>
          <li>Avoid decorative tables and icons in content-heavy sections to improve parser accuracy.</li>
          <li>Export as PDF only after validating spacing and section order in preview mode.</li>
        </ol>
      </section>

      <section className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/builder"
          className="inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500"
        >
          Start with this template
        </Link>
        <Link
          href="/templates"
          className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-teal-500 hover:text-teal-700 dark:border-slate-600 dark:text-slate-200 dark:hover:border-teal-400 dark:hover:text-teal-300"
        >
          Compare all templates
        </Link>
      </section>
    </main>
  )
}
