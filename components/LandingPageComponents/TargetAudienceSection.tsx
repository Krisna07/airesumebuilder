import { Briefcase, GraduationCap, Users2 } from "lucide-react"

/**
 * Target Audience Section Component
 * 
 * Highlights different user personas and use cases
 * SEO-optimized content targeting jobseekers, graduates, and HR professionals
 */
export default function TargetAudienceSection() {
  const audiences = [
    {
      icon: Briefcase,
      title: "For Job Seekers",
      description: "Win over recruiters and employers with a personalized resume for every job application. Tailor your resume to match job descriptions and stand out in a crowded job market.",
      benefits: [
        "ATS-optimized resumes",
        "Keyword matching",
        "Multiple versions for different roles",
        "Professional templates"
      ]
    },
    {
      icon: GraduationCap,
      title: "For University Grads",
      description: "Elevate the quality of your resume to ensure you stand out in a pool of entry-level applicants. Highlight your education, internships, and projects effectively.",
      benefits: [
        "Entry-level focused templates",
        "Skills highlighting",
        "Project showcasing",
        "Internship formatting"
      ]
    },
    {
      icon: Users2,
      title: "For HR Professionals",
      description: "Develop various resume templates to speed up the process of finding the ideal candidates for different roles. Streamline your recruitment workflow.",
      benefits: [
        "Template creation",
        "Candidate evaluation",
        "Standardized formats",
        "Quick screening"
      ]
    }
  ]

  return (
    <section className="w-full py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            The AI Resume Builder for Everyone
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Whether you're starting your career, advancing to the next level, or hiring top talent, our AI resume builder adapts to your needs
          </p>
        </div>

        {/* Audience Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {audiences.slice(0, 2).map((audience, index) => {
            const Icon = audience.icon
            return (
              <div
                key={index}
                className="w-full group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {audience.title}
                  </h3>
                </div>
                <div className="min-[500px]:flex gap-2 ">
                  <p className="min-[500px]:w-1/2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4 text-left">
                    {audience.description}
                  </p>

                  {/* Benefits List */}
                  <ul className="w-fit space-y-2">
                    {audience.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <svg className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
          <div className="md:col-span-2 md:flex md:justify-center">
            {(() => {
              const audience = audiences[2]
              const Icon = audience.icon
              return (
                <div className="w-full lg:w-1/2 group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      {audience.title}
                    </h3>
                  </div>
                  <div className="min-[500px]:flex gap-2 ">
                    <p className="min-[500px]:w-1/2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4 text-left">
                      {audience.description}
                    </p>

                    {/* Benefits List */}
                    <ul className="w-fit space-y-2">
                      {audience.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <svg className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })()}
          </div>
        {/* <AppleStyleCarousel/> */}

        </div>
      </div>
    </section>
  )
}
