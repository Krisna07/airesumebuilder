import { Zap, Sparkles, Users, Shield } from "lucide-react"

/**
 * Benefits Section Component
 * 
 * Highlights key benefits of using the AI Resume Builder
 * SEO-optimized content focusing on speed, personalization, collaboration, and safety
 */
export default function BenefitsSection() {
  const benefits = [
    {
      icon: Zap,
      title: "Effortless Resume in Seconds",
      description: "Whether you're kickstarting your career or trying to advance in your field, skip the dreaded blank page and craft a customized resume for your job application with AI based on the details you provide — all in a few seconds.",
    },
    {
      icon: Sparkles,
      title: "Fine-Tune with Ease",
      description: "With our AI resume writer, regenerate tailored suggestions until you find one that perfectly highlights your achievements. Want to workshop your resume further? Edit any text and refine your content with AI-powered tools.",
    },
    {
      icon: Users,
      title: "Get Real-Time Feedback",
      description: "See whether your resume gives you a competitive edge in the hiring process. Share your document with friends or colleagues and let them leave comments and insights to ensure you impress recruiters and employers alike.",
    },
    {
      icon: Shield,
      title: "Put Your Best Foot Forward Safely",
      description: "Take the first step to your dream job without encountering any inappropriate content. We've put several layers of safety measures in place so you can craft your resume using our AI resume builder safely and responsibly.",
    }
  ]

  return (
    <section className="w-full py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Land Your Dream Job Fast
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Elevate your job search with a resume that's sure to make an impact. Use our AI resume builder to showcase your relevant skills and experience on paper.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div
                key={index}
                className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3></div>
                <p className="text-slate-600 text-left dark:text-slate-300 text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
