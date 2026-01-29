"use client"
import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import Button from "../Ui/Button"
import { ArrowRight, Sparkles, Upload, FileText, Wand2, Eye, Download, CheckCircle2 } from "lucide-react"

type HeroProps = {
  title?: string
  subtitle?: string
  ctaLabel?: string
  ctaHref?: string
  secondaryLabel?: string
  onSecondaryClick?: () => void
}

const workflowSteps = [
  { icon: Upload, label: "Upload or Create", color: "bg-blue-500" },
  { icon: FileText, label: "Fill Details", color: "bg-purple-500" },
  { icon: Wand2, label: "AI Optimizes", color: "bg-teal-500" },
  { icon: Eye, label: "Preview", color: "bg-orange-500" },
  { icon: Download, label: "Download PDF", color: "bg-green-500" },
]

const HeroSection: React.FC<HeroProps> = ({
  title = "Build your resume with AI — fast.",
  subtitle = "Generate tailored, ATS-friendly resumes and cover letters in minutes. Pick a template, refine with AI, and export PDF.",
  ctaLabel = "Start building",
  ctaHref = "/builder",
  secondaryLabel = "See templates",
}) => {
  const [activeStep, setActiveStep] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflowSteps.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const [left, right] = title.split("—").map((s) => s.trim())

  return (
    <header className="w-full py-16 md:py-24 relative overflow-hidden" role="banner" aria-label="Landing hero">
      {/* Animated background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-100 dark:bg-teal-900/20 rounded-full blur-3xl opacity-60 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-100 dark:bg-cyan-900/20 rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-50 dark:bg-teal-900/10 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left anim-fade-in-soft">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
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
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">{subtitle}</p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center lg:items-start gap-4">
              <Link href={ctaHref}>
                <Button variant="primary" size="large" className="group px-8 animate-pulse-glow">
                  {ctaLabel}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <Link href={'#templates'}>
                <Button variant="secondary" size="large" className="px-8">
                  {secondaryLabel}
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Free available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Export to PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>ATS-optimized</span>
              </div>
            </div>
          </div>

          {/* Right: Animated Workflow */}
          <div className="relative anim-fade-in-soft" style={{ animationDelay: "0.2s" }}>
            <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 min-h-[400px]">
              {/* Workflow Steps */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white text-center mb-6">
                  How it works
                </h3>

                {workflowSteps.map((step, index) => {
                  const Icon = step.icon
                  const isActive = activeStep === index
                  const isCompleted = activeStep > index

                  return (
                    <div
                      key={index}
                      className={`relative flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${isActive
                        ? "bg-teal-50 dark:bg-teal-900/30 border-2 border-teal-500 shadow-lg shadow-teal-500/20"
                        : isCompleted
                          ? "bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 opacity-75"
                          : "bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 opacity-50"
                        }`}
                    >
                      {/* Step Number & Icon */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isActive
                          ? `${step.color} text-white shadow-lg`
                          : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                          }`}
                        style={{
                          transform: isActive ? "scale(1.1)" : "scale(1)",
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Icon
                            className="w-6 h-6"
                            style={{
                              animation: isActive ? "bounce 1s ease-in-out infinite" : undefined,
                            }}
                          />
                        )}
                      </div>

                      {/* Step Label */}
                      <div className="flex-1">
                        <p
                          className={`font-medium transition-colors duration-300 ${isActive
                            ? "text-teal-700 dark:text-teal-300"
                            : isCompleted
                              ? "text-slate-600 dark:text-slate-300 line-through"
                              : "text-slate-400 dark:text-slate-500"
                            }`}
                        >
                          {step.label}
                        </p>
                      </div>

                      {/* Connecting Line */}
                      {index < workflowSteps.length - 1 && (
                        <div
                          className={`absolute left-6 top-16 w-0.5 h-8 transition-all duration-500 ${isCompleted ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"
                            }`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Floating Resume Preview Card */}
              <div
                className={`absolute -right-4 -top-4 w-32 h-40 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg shadow-xl transition-opacity duration-1000 rotate-6 ${activeStep >= 3 ? "opacity-100 animate-float" : "opacity-0"
                  }`}
                style={{
                  transform: activeStep >= 3 ? "rotate(6deg)" : "rotate(6deg) scale(0.95)",
                  transformOrigin: "center center",
                }}
              >
                <div className="p-3 h-full flex flex-col text-white">
                  <div className="h-2 w-8 bg-white/30 rounded mb-2" />
                  <div className="h-1 w-full bg-white/20 rounded mb-1" />
                  <div className="h-1 w-3/4 bg-white/20 rounded mb-2" />
                  <div className="flex-1 bg-white/10 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeroSection
