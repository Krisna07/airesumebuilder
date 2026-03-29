export const metadata = {
  title: 'Privacy Policy - AI Resume Craft',
  description: 'Privacy policy for AI Resume Craft',
}

export default function PrivacyPage() {
  return (
    <section className="py-16 px-6 sm:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Privacy & Terms</h1>

        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">Last updated: March 29, 2026</p>

        <div className="mt-6 space-y-8 text-slate-700 dark:text-slate-200">
          <section>
            <h2 className="text-2xl font-semibold">Privacy Overview</h2>
            <p className="mt-2">We respect your privacy. This section explains what information we collect, why we collect it, and how you can manage or delete your data.</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">What we collect</h3>
            <p className="mt-2">We collect account information (email, display name), resume content you provide, and optional analytics to improve the product. We do not sell personal data.</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">How we use data</h3>
            <p className="mt-2">Your resume content is used to power AI features and to generate downloadable resumes. We store content securely and only use third-party AI services when you invoke AI features.</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Data deletion & portability</h3>
            <p className="mt-2">You can delete your account and all associated data in account settings. For portability requests, contact us at the address below.</p>
          </section>

          <section>
            <h3 className="text-xl font-semibold">Security</h3>
            <p className="mt-2">We take technical and organizational measures to protect your data. However, no internet service is completely secure — use strong passwords and enable two-factor authentication where available.</p>
          </section>

          <hr className="border-slate-200 dark:border-slate-800" />

          <section>
            <h2 className="text-2xl font-semibold">Terms of Service</h2>
            <p className="mt-2">By using AI Resume Craft you agree to these terms. If you don't agree, please do not use the service.</p>

            <h3 className="mt-4 text-lg font-semibold">Accounts</h3>
            <p className="mt-2">You are responsible for your account security and any activity that occurs under your account.</p>

            <h3 className="mt-4 text-lg font-semibold">Paid plans and billing</h3>
            <p className="mt-2">Subscriptions are billed monthly and can be canceled at any time. See our <a href="/pricing" className="text-indigo-600 hover:underline">Pricing</a> page for details.</p>

            <h3 className="mt-4 text-lg font-semibold">Acceptable use</h3>
            <p className="mt-2">Don't use the service for unlawful activity, harassment, or to submit other people's private data without consent.</p>

            <h3 className="mt-4 text-lg font-semibold">Liability</h3>
            <p className="mt-2">We provide the service "as is" and are not liable for indirect or consequential damages. Use AI features responsibly and verify outputs before sharing.</p>

            <h3 className="mt-4 text-lg font-semibold">Contact</h3>
            <p className="mt-2">Questions about these terms or privacy can be directed to our <a href="/contact" className="text-indigo-600 hover:underline">Contact</a> page.</p>
          </section>
        </div>
      </div>
    </section>
  )
}
