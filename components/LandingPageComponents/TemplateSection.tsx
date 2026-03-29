"use client"
import TemplateSlider from "./TemplateSlider"

const TemplatesSection = () => {

  return (
    <section className="w-full py-16 md:py-24" id="templates">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Professional templates for every industry
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
