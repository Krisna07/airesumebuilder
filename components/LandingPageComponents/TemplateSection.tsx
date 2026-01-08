"use client"

import { useState } from "react"
import Link from "next/link"
import Button from "../UI/Button"
import { ArrowRight, Check } from "lucide-react"
import dummyResume from './../../app/data/dummyResume.json'
import ResumePreview from "../Templates/ResumePreview"
const templates = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean and corporate, perfect for traditional industries.",
    tags: ["ATS-Friendly", "Corporate"],
    color: "bg-slate-800",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary design with a creative edge.",
    tags: ["Creative", "Stylish"],
    color: "bg-teal-600",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant, lets your content shine.",
    tags: ["Clean", "Simple"],
    color: "bg-slate-600",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Sophisticated layout for senior positions.",
    tags: ["Leadership", "Premium"],
    color: "bg-slate-900",
  },
]

const TemplatesSection = () => {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockResume: any = {
    ...dummyResume
  }
  return (
    <section className="w-full py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
            Professional templates for every industry
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Choose from our collection of ATS-optimized templates designed by HR professionals.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group relative"
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
            >
              {/* Template Preview */}
              <div
                className={`aspect-3/4 rounded-xl ${template.color} p-4 relative overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl`}
              >
                {/* Mock Resume Lines */}
                {/* <div className="space-y-3 animate-pulse">
                  <div className="h-4 w-3/4 bg-white/20 rounded" />
                  <div className="h-2 w-1/2 bg-white/15 rounded" />
                  <div className="mt-6 space-y-2">
                    <div className="h-2 w-full bg-white/10 rounded" />
                    <div className="h-2 w-5/6 bg-white/10 rounded" />
                    <div className="h-2 w-4/6 bg-white/10 rounded" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-2 w-full bg-white/10 rounded" />
                    <div className="h-2 w-3/4 bg-white/10 rounded" />
                  </div>
                </div> */}
                <ResumePreview resumeData={mockResume} template={template.name} />


                {/* Hover Overlay */}
                <div
                  className={`absolute inset-0 bg-teal-600/20 flex items-center justify-center transition-opacity duration-300 ${hoveredTemplate === template.id ? "opacity-100" : "opacity-0"}`}
                >
                  <Link href="/builder">
                    <Button variant="secondary" size="medium" className="bg-white text-teal-700 hover:bg-teal-50">
                      Use Template
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Template Info */}
              <div className="mt-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">{template.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{template.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                    >
                      <Check className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link href="/builder">
            <Button variant="primary" size="large" className="group">
              View all templates
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default TemplatesSection
