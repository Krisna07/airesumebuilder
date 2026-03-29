const HowItWorks = () => {
  return (
    <section className="w-full py-12 md:py-20 bg-white dark:bg-slate-900/60">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">How it works</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">Create a tailored resume in three simple steps — no design skills required.</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-xl font-semibold text-teal-600">1. Add your experience</div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Paste your resume or import a job description — we extract the key facts for you.</p>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-xl font-semibold text-teal-600">2. Tailor with AI</div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use AI to rewrite bullets, highlight impact, and match the language of the job posting.</p>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-xl font-semibold text-teal-600">3. Export & apply</div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Choose a professional template and download a PDF or share a public link for applications.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
