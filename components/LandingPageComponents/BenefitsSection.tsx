import { Clock, Target, Shield, Zap, TrendingUp, Users } from "lucide-react"

const benefits = [
  {
    icon: Clock,
    title: "Save Hours of Work",
    description: "Create a professional resume in minutes, not hours. Our AI does the heavy lifting so you can focus on what matters.",
    stat: "10x faster",
  },
  {
    icon: Target,
    title: "ATS-Optimized",
    description: "Every resume is designed to pass Applicant Tracking Systems. Get past the bots and into human hands.",
    stat: "95% pass rate",
  },
  {
    icon: Zap,
    title: "AI-Powered Matching",
    description: "Match your resume to job descriptions automatically. Get personalized suggestions to improve your fit score.",
    stat: "Smart matching",
  },
  {
    icon: TrendingUp,
    title: "Higher Success Rate",
    description: "Users report 3x more interview callbacks when using our optimized resumes compared to traditional formats.",
    stat: "3x more interviews",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data is encrypted and never shared. Delete your account and all data anytime with one click.",
    stat: "100% secure",
  },
  {
    icon: Users,
    title: "Trusted by Thousands",
    description: "Join thousands of job seekers who have landed their dream jobs using our AI-powered resume builder.",
    stat: "10K+ users",
  },
]

const BenefitsSection = () => {
  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Why choose Airesumecraft?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Everything you need to create a standout resume that gets you noticed by employers.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div
                key={index}
                className="group p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 transform hover:-translate-y-1"
                style={{
                  animation: `fade-in-soft 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg">
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Stat Badge */}
                <div className="inline-block px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 mb-3">
                  <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{benefit.stat}</span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{benefit.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default BenefitsSection
