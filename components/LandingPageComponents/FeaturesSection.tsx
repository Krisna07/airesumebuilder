import { Sparkles, FileCheck, Zap, Target, Download, Shield } from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "Free AI-Powered Writing",
    description: "Let our free AI generate compelling bullet points and professional summaries tailored to your target job.",
  },
  {
    icon: FileCheck,
    title: "ATS-Optimized",
    description: "Our templates are designed to pass Applicant Tracking Systems with flying colors.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Create a polished, professional resume in under 10 minutes with our intuitive builder.",
  },
  {
    icon: Target,
    title: "Job Matching",
    description: "Analyze job descriptions and get personalized suggestions to tailor your resume.",
  },
  {
    icon: Download,
    title: "Unlimited Free Downloads",
    description: "Unlike other builders, export your resume as PDF or plain text as many times as you want without hitting paywalls.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data is encrypted and never shared. Delete your account anytime.",
  },
]

const FeaturesSection = () => {
  return (
    <section className="w-full py-16 md:py-24 ">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Premium AI features, absolutely free
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Everything you need to build the perfect, ATS-friendly resume without spending a dime.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300"
            >

              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>

              </div>
              <p className="text-slate-600 dark:text-slate-300 text-left text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
