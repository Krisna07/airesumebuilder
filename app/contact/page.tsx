import { Metadata } from 'next'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the AI Resume Craft team. Send us feedback, bug reports, or partnership inquiries and we\'ll respond as soon as possible.',
  alternates: {
    canonical: 'https://airesumecraft.xyz/contact',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ContactPage() {
  return (
    <section className="py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Contact</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Have feedback, bug reports, or partnership questions? Send us a message and we&apos;ll respond as soon as we can.
        </p>
        <ContactForm />
      </div>
    </section>
  )
}
