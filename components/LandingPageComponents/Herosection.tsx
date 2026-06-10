import type React from "react"
import Link from "next/link"
import Button from "../Ui/Button"
import { ArrowRight, BarChart3, Sparkles } from "lucide-react"

type HeroProps = {
  title?: string
  subtitle?: string
  ctaLabel?: string
  ctaHref?: string
  analysisLabel?: string
  analysisHref?: string
  secondaryLabel?: string
  onSecondaryClick?: () => void
}

const HeroSection: React.FC<HeroProps> = ({
  title = "The 100% Free AI Resume Builder for Professionals",
  subtitle = "Build professional, ATS-optimized resumes in minutes. Let AI craft compelling bullet points while you focus on landing the job—all at absolutely no cost.",
  ctaLabel = "Start Building Free",
  ctaHref = "/builder",
  analysisLabel = "Analyze My Resume",
  analysisHref = "/analysis",
  secondaryLabel = "See templates",
}) => {
  const [left, right] = title.split("—").map((s) => s.trim())

  return (
    <header className="w-full py-16 md:py-24 relative overflow-hidden" role="banner" aria-label="Landing hero">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-100 dark:bg-teal-900/20 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-100 dark:bg-cyan-900/20 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 mb-6 anim-fade-in-soft">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="text-xs font-medium text-teal-700 dark:text-teal-300">AI-powered resume builder</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-slate-900 dark:text-white tracking-tight">
          {right ? (
            <>
              <span className="block">{left}</span>
              <span className="block text-teal-600 dark:text-teal-400 mt-1">— {right}</span>
            </>
          ) : (
            title
          )}
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href={ctaHref}>
            <Button variant="primary" size="medium" className="group px-8">
              {ctaLabel}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          <Link href={analysisHref}>
            <Button variant="secondary" size="medium" className="group px-8">
              <BarChart3 className="w-4 h-4" />
              {analysisLabel}
            </Button>
          </Link>

          <Link href={'#templates'}>
            <Button variant="secondary" size="medium" className="px-8">
            {secondaryLabel}
            </Button>
          </Link>
        </div>

        {/* Trust indicators */}
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
          ✓ 100% Free forever · ✓ Powered by advanced AI · ✓ Unlimited PDF exports
        </p>

        {/* Stats */}
        {/* <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">10K+</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Resumes created</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">95%</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">ATS pass rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">4.9/5</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">User rating</p>
            </div>
          </div>
        </div> */}
      </div>
    </header>
  )
}

export default HeroSection
