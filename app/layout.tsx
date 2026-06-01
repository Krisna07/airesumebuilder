import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './global.css';
import Providers from '@/components/Providers';
import { ToastContainer } from 'react-toastify';
import ConditionalLayout from '@/components/ConditionalLayout';
import TelemetryBootstrap from '@/components/TelemetryBootstrap';

const inter = Inter({ subsets: ['latin'] });
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL('https://airesumecraft.xyz'),
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon.ico'],
    apple: ['/favicon.ico'],
  },
  title: {
    default: 'AI Resume Craft | Free AI Resume Builder',
    template: '%s | AI Resume Craft',
  },
  description: 'Use our AI resume builder to create ATS-friendly resumes in minutes, tailor sections for each job, and download polished PDFs for free.',
  keywords: [
    'ai resume builder',
    'free resume maker',
    'ats resume template',
    'cv builder online',
    'airesumebuilder',
    'AireResumeBuilder',
    'aire resume builder',
    'AI resume builder',
    'free resume builder',
    'free cv maker',
    'job ready cv',
    'resume maker',
    'CV builder',
    'ATS resume',
    'professional resume',
    'resume templates',
    'cover letter builder',
    'job application',
    'career tools',
  ],
  authors: [{ name: 'AI Resume Craft', url: 'https://airesumecraft.xyz' }],
  creator: 'AI Resume Craft',
  publisher: 'AI Resume Craft',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://airesumecraft.xyz',
    siteName: 'AI Resume Craft',
    title: 'Free AI Resume Builder | Craft Your Resume in Minutes',
    description: 'Build, tailor, and optimize your resume for free with our AI-powered resume builder. Get past ATS systems and land your dream job faster.',
    images: [
      {
        url: '/icon.svg',
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
    images: ['/icon.svg'],
    creator: '@airesumecraft',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  ...(googleSiteVerification
    ? {
      verification: {
        google: googleSiteVerification,
      },
    }
    : {}),

};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Organization structured data
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://airesumecraft.xyz/#organization',
    name: 'AI Resume Craft',
    url: 'https://airesumecraft.xyz',
    logo: 'https://airesumecraft.xyz/icon.svg',
    description: 'Free AI-powered resume builder to help you create professional resumes and land your dream job',
    sameAs: [
      'https://x.com/airesumecraft',
      'https://www.linkedin.com/company/airesumecraft',
      'https://www.facebook.com/airesumecraft',
      'https://www.instagram.com/airesumecraft',
      'https://www.youtube.com/@airesumecraft',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      url: 'https://airesumecraft.xyz/contact',
    },
  }

  // Website structured data with search action
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://airesumecraft.xyz/#website',
    name: 'AI Resume Craft',
    url: 'https://airesumecraft.xyz',
    description: 'Free AI-powered resume builder',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://airesumecraft.xyz/blogs?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Resume Craft',
    operatingSystem: 'All',
    applicationCategory: 'BusinessApplication',
    browserRequirements: 'Requires HTML5',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
    description:
      'An open, free AI-powered resume builder designed to generate professional, ATS-optimized resumes instantly using markdown inputs.',
    url: 'https://airesumecraft.xyz',
  }

  return (
    <html lang='en' data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />

        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var v = localStorage.getItem('theme');
                  if (v === 'dark' || (!v && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className={`${inter.className} w-full min-h-screen relative text-neutral-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-50 scroll-smooth overflow-x-hidden`}>
        {/* Global SVG filter for glass distortion used by mobile slider */}
        <svg className="hidden" aria-hidden>
          <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="1" seed="5" result="turbulence" />
            <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
            <feDisplacementMap in="SourceGraphic" in2="softMap" scale="50" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <ToastContainer />
        <Suspense fallback={null}>
          <TelemetryBootstrap />
        </Suspense>
        <Providers>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}