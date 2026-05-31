import type { Metadata } from 'next'
import DashboardPage from './BuilderDashboardPage'

export const metadata: Metadata = {
  title: 'AI Resume Builder Dashboard | Build ATS-Ready Resumes',
  description: 'Access your AI resume builder dashboard to create, tailor, and download ATS-friendly resumes for every job application quickly.',
  alternates: {
    canonical: 'https://airesumecraft.xyz/builder',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      'max-snippet': 0,
      'max-image-preview': 'none',
      'max-video-preview': 0,
    },
  },
}

export default function BuilderPage() {
  return <DashboardPage />
}
