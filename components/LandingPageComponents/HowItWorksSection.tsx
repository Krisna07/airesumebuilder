"use client"
import { Upload, FileText, Wand2, Eye, Download, ArrowRight } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Upload or Create",
    description: "Start by uploading your existing resume PDF or create a new one from scratch. Our AI will extract and organize your information automatically.",
    icon: Upload,
    color: "from-blue-500 to-cyan-500",
  },
  {
    number: "02",
    title: "Fill in Your Details",
    description: "Complete your profile with work experience, education, skills, and custom sections. Our intuitive form guides you through each step.",
    icon: FileText,
    color: "from-purple-500 to-pink-500",
  },
  {
    number: "03",
    title: "AI Optimization",
    description: "Our AI analyzes your resume against job descriptions, suggests improvements, and optimizes content for ATS systems to maximize your chances.",
    icon: Wand2,
    color: "from-teal-500 to-emerald-500",
  },
  {
    number: "04",
    title: "Preview & Refine",
    description: "See your resume in real-time across multiple professional templates. Make adjustments and see instant previews before finalizing.",
    icon: Eye,
    color: "from-orange-500 to-red-500",
  },
  {
    number: "05",
    title: "Download & Apply",
    description: "Export your polished resume as a PDF ready for applications. Get matched with jobs and track your application success rate.",
    icon: Download,
    color: "from-green-500 to-teal-500",
  },
]

const HowItWorksSection = () => {
  return (
    <section className="w-full py-16 md:py-24 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            How it works
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Create a professional, ATS-optimized resume in just 5 simple steps. No design skills required.
          </p>
        </div>

        {/* Steps */}
        <div className="relative space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <div
                key={index}
                className="relative flex flex-col md:flex-row items-start gap-6 p-6 md:p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 anim-fade-in-soft"
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Step Number & Icon */}
                <div className="shrink-0 relative z-10">
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{step.number}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-slate-700 dark:text-slate-300">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{step.description}</p>
                </div>

                {/* Animated connecting line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute left-10 top-24 w-0.5 h-12 bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    {/* Animated flowing line - flows continuously through all steps */}
                    <div
                      className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-teal-500 to-teal-600"
                      style={{
                        animation: `flow-line 10s ease-in-out infinite`,
                        animationDelay: `${index * 2}s`,
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <a
            href="/builder"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
