import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the AI Resume Craft terms of service. Understand your rights and responsibilities when using our free AI resume builder.',
  alternates: {
    canonical: 'https://airesumecraft.xyz/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsPage() {
  return (
    <section className="py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Last updated: March 29, 2026</p>

        <div className="space-y-8 text-slate-700 dark:text-slate-200">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using AI Resume Craft you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Accounts</h2>
            <p>You are responsible for maintaining the security of your account and for all activity that occurs under it. Notify us immediately of any unauthorized use.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Paid Plans & Billing</h2>
            <p>Subscriptions are billed monthly and can be canceled at any time. Cancellation takes effect at the end of the current billing period. See our <Link href="/pricing" className="text-teal-600 hover:underline">Pricing</Link> page for current plan details.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Acceptable Use</h2>
            <p>You agree not to use the service for unlawful activity, harassment, or to submit other people's private data without their consent. We reserve the right to suspend accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Intellectual Property</h2>
            <p>The content you create using AI Resume Craft belongs to you. The platform, templates, and underlying technology remain the property of AI Resume Craft.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. AI-Generated Content</h2>
            <p>AI features generate suggestions based on the information you provide. You are responsible for reviewing and verifying all AI-generated content before using it in job applications or other professional contexts.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Limitation of Liability</h2>
            <p>We provide the service "as is" without warranties of any kind. AI Resume Craft is not liable for indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">8. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
            <p>Questions about these terms can be directed to our <Link href="/contact" className="text-teal-600 hover:underline">Contact</Link> page.</p>
          </section>
        </div>
      </div>
    </section>
  )
}
