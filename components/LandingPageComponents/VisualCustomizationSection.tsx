import { Palette, Image as ImageIcon, Smartphone } from "lucide-react"
import Link from "next/link"

/**
 * Visual Customization Section Component
 * 
 * Highlights design and customization features
 * SEO-optimized content focusing on visual appeal and professional presentation
 */
export default function VisualCustomizationSection() {
  const features = [
{
      icon: Palette,
      title: "Stand Out with Striking Visuals",
      description: "Ensure your resume reflects your personality while looking professional. Try out different color palettes, fonts, and incorporate visual elements that add a new dimension to your professional image.",
    },
    {
      icon: ImageIcon,
      title: "Make a Lasting Impression",
      description: "Add your photo to your resume and make sure you look the part for your dream role. Customize your professional image without any design experience needed.",
    },
    {
      icon: Smartphone,
      title: "Design Seamlessly",
      description: "Polish your resume to perfection without the hassle of jumping between multiple apps. Build your professional story on your desktop or mobile device — all within one platform.",
    }, 
    {
      icon: Palette,
      title: "Express Your Unique Style",
      description: "Choose from a curated selection of professionally designed templates and tailor every detail to match your personal brand. Stand out from the crowd with a resume that's truly yours.",
    },
   
  ]

  return (
    <section className="w-full py-16 md:py-24 ">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Show Off Your Strengths in Style
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Create a resume that not only showcases your skills but also reflects your unique professional identity
          </p>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
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
                    {feature.title}
                  </h3>
               </div>
                <p className="text-left text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Create Your Resume Now
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
