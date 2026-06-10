import FeaturesSection from '@/components/LandingPageComponents/FeaturesSection';
import HeroSection from '@/components/LandingPageComponents/Herosection';
import BenefitsSection from '@/components/LandingPageComponents/BenefitsSection';
import VisualCustomizationSection from '@/components/LandingPageComponents/VisualCustomizationSection';
import TargetAudienceSection from '@/components/LandingPageComponents/TargetAudienceSection';
import BlogResourcesSection from '@/components/LandingPageComponents/BlogResourcesSection';
import { Metadata } from 'next'
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Templates from '@/components/Templates/templates';

const HowItWorks = dynamic(() => import('@/components/LandingPageComponents/HowItWorks'), {
  loading: () => <section aria-hidden className="w-full min-h-[560px]" />,
});

const TemplatesSection = dynamic(() => import('@/components/LandingPageComponents/TemplateSection'), {
  loading: () => <section aria-hidden className="w-full min-h-[640px]" />,
});

const FAQSection = dynamic(() => import('@/components/LandingPageComponents/FAQSection'), {
  loading: () => <section aria-hidden className="w-full min-h-[520px]" />,
});

export const metadata: Metadata = {
  title: {
    absolute: 'Free AI Resume Builder & ATS Resume Editor | AI Resume Craft',
  },
  description: 'Create, edit, and export unlimited ATS-friendly resumes for free. AI Resume Craft includes markdown support, live previews, and recruiter-ready templates.',
  keywords: [
    'ai resume builder',
    'free resume maker',
    'ats resume template',
    'cv builder online',
    'airesumebuilder',
    'AireResumeBuilder',
    'aire resume builder',
    'free resume builder',
    'resume maker',
    'CV builder',
    'ATS-friendly resume',
    'professional resume builder',
    'resume templates',
    'online resume builder',
    'resume creator',
    'job application tools',
  ],
  alternates: {
    canonical: 'https://airesumecraft.xyz',
  },
  openGraph: {
    title: 'Free AI Resume Builder & ATS Resume Editor | AI Resume Craft',
    description: 'Create ATS-friendly resumes online for free with markdown support, live previews, and professional resume templates.',
    url: 'https://airesumecraft.xyz',
    siteName: 'AI Resume Craft',
    type: 'website',
    images: [
      {
        url: 'https://airesumecraft.xyz/icon.svg',
        width: 1200,
        height: 630,
        alt: 'AI Resume Craft - Free AI Resume Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI Resume Builder & ATS Resume Editor | AI Resume Craft',
    description: 'Create ATS-friendly resumes online for free with markdown support and live previews.',
    images: ['https://airesumecraft.xyz/icon.svg'],
  },
}

const page = () => {
  // Product structured data
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Resume Craft',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    description: 'Free AI-powered resume builder that helps you create professional, ATS-friendly resumes in minutes',
    url: 'https://airesumecraft.xyz',
  }

  // FAQ structured data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is AI Resume Craft really free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! AI Resume Craft is completely free to use. You can create, edit, and download professional resumes without any cost or credit card required.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are the resumes ATS-friendly?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all our resume templates are designed to be ATS (Applicant Tracking System) friendly, ensuring your resume gets past automated screening systems.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the AI resume builder work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our AI analyzes your experience and the job description to generate tailored resume content, optimize keywords, and suggest improvements to help you stand out.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I download my resume in different formats?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, you can download your resume in PDF format, which is the most widely accepted format by employers and ATS systems.',
        },
      },
    ],
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className='w-full text-center flex flex-col items-center justify-center gap-8 min-h-[60vh] px-4 box-border'>
        <HeroSection />
        <BenefitsSection />
        <HowItWorks />
        <FeaturesSection />
        <VisualCustomizationSection />
        <TemplatesSection />
        <TargetAudienceSection />
        <BlogResourcesSection />
        <FAQSection />

        <section className='w-full max-w-6xl mx-auto px-4'>
          <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 p-6 sm:p-8 text-left'>
            <h2 className='text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white'>Analyze Your Resume Against ATS Standards</h2>
            <p className='mt-3 text-slate-600 dark:text-slate-300 max-w-3xl'>
              Upload your existing PDF and get an AI ATS breakdown instantly, even without login. Review keyword gaps, strengths, and optimization guidance before you apply.
            </p>
            <div className='mt-5'>
              <Link
                href='/analysis'
                className='inline-flex items-center rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm font-medium transition-colors'
              >
                Start ATS Analysis
              </Link>
            </div>
          </div>
        </section>

        <section className='w-full max-w-6xl mx-auto px-4 pb-20 text-left'>
          <div className='rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 p-6 sm:p-8'>
            <h2 className='text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white'>
              Browse ATS-optimized resume templates
            </h2>
            <p className='mt-3 text-slate-600 dark:text-slate-300'>
              Explore public template pages to compare resume styles, identify recruiter-friendly formats, and choose the best layout for your role.
            </p>
            <ul className='mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
              {Templates.map((template) => (
                <li key={template.id}>
                  <Link
                    href={`/templates/${template.id}`}
                    className='inline-flex w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-300 transition-colors'
                  >
                    {template.name} template
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
};

export default page;
