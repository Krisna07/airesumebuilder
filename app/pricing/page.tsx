import { Metadata } from 'next'
import PricingClient from './PricingClient'

export const metadata: Metadata = {
  title: 'AI Resume Builder Pricing | Free and Pro Plan Options',
  description: 'Simple, transparent pricing for AI Resume Craft. Start free and upgrade when you need more AI-powered resume features. No hidden fees.',
  alternates: {
    canonical: 'https://airesumecraft.xyz/pricing',
  },
  openGraph: {
    title: 'Pricing | AI Resume Craft',
    description: 'Start free. Upgrade for unlimited AI resume generation, cover letters, and analysis.',
    url: 'https://airesumecraft.xyz/pricing',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PricingPage() {
  return <PricingClient />
}
