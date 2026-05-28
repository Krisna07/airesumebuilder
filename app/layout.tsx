import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './global.css';
import Providers from '@/components/Providers';
import { ToastContainer } from 'react-toastify';
import ConditionalLayout from '@/components/ConditionalLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://airesumecraft.xyz'),
  title: {
    default: 'AireResumeBuilder - Free AI Resume Builder | AI Resume Craft',
    template: '%s | AireResumeBuilder',
  },
  description: 'AireResumeBuilder helps you build, tailor, and optimize your resume for free with AI. Create ATS-friendly resumes and land interviews faster.',
  keywords: [
    'AireResumeBuilder',
    'aire resume builder',
    'AI resume builder',
    'free resume builder',
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
    name: 'AI Resume Craft',
    url: 'https://airesumecraft.xyz',
    logo: 'https://airesumecraft.xyz/icon.svg',
    description: 'Free AI-powered resume builder to help you create professional resumes and land your dream job',
    sameAs: [
      // Add your social media profiles here
      'https://x.com/airesumecraft',
      // 'https://linkedin.com/company/airesumecraft',
      // 'https://facebook.com/airesumecraft',
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

  return (
    <html lang='en' data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />

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
        <svg style={{ display: 'none' }} aria-hidden>
          <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="1" seed="5" result="turbulence" />
            <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
            <feDisplacementMap in="SourceGraphic" in2="softMap" scale="50" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <ToastContainer />
        <Providers>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}