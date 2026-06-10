import { Metadata } from 'next'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'AI Resume Builder Plans | Access Options',
  description: 'Access options for AI Resume Craft. Start free and unlock more AI-powered resume features when available.',
  alternates: {
    canonical: 'https://airesumecraft.xyz/pricing',
  },
  openGraph: {
    title: 'Plans | AI Resume Craft',
    description: 'Start free. Upgrade for unlimited AI resume generation, cover letters, and analysis.',
    url: 'https://airesumecraft.xyz/pricing',
    type: 'website',
  },
  robots: {
    index: false,
    follow: true,
  },
}

export default function PricingPage() {
  return <PricingClient />
}
