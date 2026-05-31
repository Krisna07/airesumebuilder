import FeaturesSection from '@/components/LandingPageComponents/FeaturesSection';
import HeroSection from '@/components/LandingPageComponents/Herosection';
import BenefitsSection from '@/components/LandingPageComponents/BenefitsSection';
import VisualCustomizationSection from '@/components/LandingPageComponents/VisualCustomizationSection';
import TargetAudienceSection from '@/components/LandingPageComponents/TargetAudienceSection';
import BlogResourcesSection from '@/components/LandingPageComponents/BlogResourcesSection';
import { Metadata } from 'next'
import dynamic from 'next/dynamic';
import Link from 'next/link';

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
    absolute: 'Free AI Resume Builder for ATS-Friendly Resumes Online',
  },
  description: 'Use our AI resume builder to create ATS-friendly resumes in minutes, tailor every section to each job, and download polished PDFs for free.',
  keywords: [
    'AireResumeBuilder',
    'aire resume builder',
    'free resume builder',
    'AI resume builder',
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
    title: 'Free AI Resume Builder | Craft Your Resume in Minutes',
    description: 'Build, tailor, and optimize your resume for free with our AI-powered resume builder. Get past ATS systems and land your dream job faster.',
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
    title: 'Free AI Resume Builder | Craft Your Resume in Minutes',
    description: 'Build, tailor, and optimize your resume for free with our AI-powered resume builder.',
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

      <div className='w-full text-center  flex flex-col items-center justify-center gap-8  min-h-[60vh] px-4 box-border'>
        <HeroSection />
        <BenefitsSection />
        <HowItWorks />
        <FeaturesSection />
        <VisualCustomizationSection />
        <TemplatesSection />
        <TargetAudienceSection />
        <BlogResourcesSection />
        <FAQSection />
      </div>
    </>
  );
};

export default page;
