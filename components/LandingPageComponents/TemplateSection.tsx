"use client"
import dynamic from "next/dynamic"

const TemplateSlider = dynamic(() => import("./TemplateSlider"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 sm:h-[360px] md:h-[420px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60" />
  ),
})

const TemplatesSection = () => {

  return (
    <section className="w-full py-16 md:py-24" id="templates">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            ATS-Optimized Resume Templates for Every Industry
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Browse a curated set of ATS-friendly and visually-balanced templates — pick a layout, preview it, and apply it instantly to your resume. Each template is optimized for readability and recruiter scanning.
          </p>
        </div>
        <TemplateSlider />
      </div>
    </section>
  )
}

export default TemplatesSection
