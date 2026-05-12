"use client"
import { 
  Sparkles,
  Target, 
  Wand2, 
  Download, 
  Palette, 
  BarChart3, 
  Globe, 
  Zap,
  FileCheck,
  MessageSquare,
  Upload,
  RefreshCw,
  Layout,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import Head from 'next/head'
import ResumePreview from '@/components/Templates/ResumePreview'
import dummyResume from '@/app/data/dummyResume.json'

const FeaturesPage = () => {
  // Structured data for features page
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Resume Craft',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    description: 'Free AI-powered resume builder with unlimited downloads, ATS optimization, and professional templates',
    url: 'https://airesumecraft.xyz/features',
    featureList: [
      'AI-Powered Resume Generation',
      'Unlimited Free PDF Downloads',
      'ATS-Optimized Templates',
      'Keyword Targeting',
      'Resume Scoring System',
      'Cover Letter Generator',
      'Real-time Content Analysis',
      'Multiple Resume Versions',
    ],
  }

  const aiFeatures = [
    {
      icon: Sparkles,
      title: "Full Resume Generation",
      description: "Generate complete, professional resumes from scratch or upload your existing PDF. Our AI analyzes your experience and creates tailored content instantly.",
    },
    {
      icon: Wand2,
      title: "Section-by-Section AI Enhancement",
      description: "Regenerate individual sections like summary, experience, education, or skills. Fine-tune each part of your resume with AI-powered suggestions.",
    },
    {
      icon: Target,
      title: "Job-Specific Tailoring",
      description: "Paste any job description and our AI automatically tailors your resume to match. Get keyword optimization and role-specific content suggestions.",
    },
    {
      icon: BarChart3,
      title: "Resume-to-Job Matching Score",
      description: "Get a 0-100 matching percentage showing how well your resume aligns with the job. See exactly which keywords you're missing and what to improve.",
    },
    {
      icon: MessageSquare,
      title: "AI Cover Letter Generator",
      description: "Generate personalized cover letters tailored to specific job descriptions. Our AI considers your resume content and the job requirements.",
    },
    {
      icon: Upload,
      title: "Smart Resume Parsing",
      description: "Upload any PDF resume and our AI extracts all information into editable sections. No manual retyping needed—start editing immediately.",
    },
  ]

  const templates = [
    {
      id: 'default',
      name: "Standard",
      description: "High-density single-column layout optimized for ATS parsing",
      tags: ["ATS-Friendly", "Clean"]
    },
    {
      id: 'classic',
      name: "Classic",
      description: "Traditional timeline-style resume for academic and formal roles",
      tags: ["Traditional", "Professional"]
    },
    {
      id: 'modern',
      name: "Modern",
      description: "Contemporary full-width hero header with clean editorial body",
      tags: ["Creative", "Stylish"]
    },
    {
      id: 'executive',
      name: "Executive",
      description: "Authoritative serif typography for leadership positions",
      tags: ["Leadership", "Serif"]
    },
    {
      id: 'signal',
      name: "Signal",
      description: "High-contrast bold typography for marketing and sales",
      tags: ["Bold", "Impact"]
    },
    {
      id: 'minimal',
      name: "Minimalist",
      description: "Ultra-clean left-aligned layout perfect for tech professionals",
      tags: ["Tech", "Clean"]
    },
    {
      id: 'template01',
      name: "Sidebar",
      description: "Two-column balanced layout with skills sidebar",
      tags: ["Balanced", "Modern"]
    },
    {
      id: 'template02',
      name: "Canvas",
      description: "Asymmetric split design with strategic whitespace",
      tags: ["Creative", "Unique"]
    },
    {
      id: 'atlas',
      name: "Atlas",
      description: "Structured left-rail with dedicated skills panel",
      tags: ["Organized", "Detailed"]
    },
    {
      id: 'horizon',
      name: "Horizon",
      description: "Full-bleed gradient hero with card-based sections",
      tags: ["Modern", "Visual"]
    },
  ]

  const customizationFeatures = [
    {
      icon: Palette,
      title: "Visual Style Editor",
      description: "Customize colors, fonts, spacing, and section styles. Make your resume uniquely yours while maintaining ATS compatibility.",
    },
    {
      icon: Layout,
      title: "Flexible Section Management",
      description: "Add custom sections for certifications, projects, publications, or anything else. Reorder sections with drag-and-drop.",
    },
    {
      icon: Download,
      title: "Professional PDF Export",
      description: "Download unlimited PDFs with customizable margins. Perfect print-ready output in A4 format with professional styling.",
    },
    {
      icon: RefreshCw,
      title: "Multiple Resume Versions",
      description: "Create unlimited resume variations for different roles. Tailor each version to specific job applications.",
    },
  ]

  const jobMatchingFeatures = [
    {
      icon: Globe,
      title: "Job Description Scraping",
      description: "Paste job URLs from LinkedIn, Indeed, Seek, Glassdoor, and more. Our scraper automatically extracts job details for analysis.",
    },
    {
      icon: Zap,
      title: "Smart Recommendations Engine",
      description: "Get role-specific bullet point suggestions based on your job title, specialization, and seniority level. Powered by AI and industry data.",
    },
    {
      icon: FileCheck,
      title: "ATS Optimization",
      description: "All templates are designed to pass Applicant Tracking Systems. Get keyword suggestions and formatting that recruiters' software can read.",
    },
  ]

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      features: [
        "20 AI regenerations per day",
        "20 cover letters per day",
        "20 resume analyses per day",
        "Unlimited downloads",
        "Unlimited PDF uploads",
        "All 10 templates",
        "Full customization",
      ]
    },
    {
      name: "Supporter",
      price: "$9/mo",
      features: [
        "Unlimited AI regenerations",
        "Unlimited cover letters",
        "Unlimited analyses",
        "Unlimited downloads",
        "Unlimited uploads",
        "All templates & features",
        "Priority support",
      ],
      popular: true
    },
    {
      name: "Ultimate",
      price: "$19/mo",
      features: [
        "Everything in Supporter",
        "Premium templates (coming soon)",
        "Advanced AI models",
        "Priority processing",
        "Dedicated support",
        "Early access to new features",
      ]
    }
  ]

  return (
    <>
      <Head>
        <title>AI Resume Builder Features | Free Resume Tools & Templates</title>
        <meta name="description" content="Discover powerful AI-powered resume building features including unlimited free downloads, ATS optimization, keyword targeting, and professional templates. No credit card required." />
        <meta name="keywords" content="AI resume builder features, free resume tools, ATS optimization, resume templates, AI-powered writing, resume keyword targeting, cover letter generator, resume scoring, professional resume builder, free resume downloads" />
        <link rel="canonical" href="https://airesumecraft.xyz/features" />
        <meta property="og:title" content="AI Resume Builder Features | Free Resume Tools & Templates" />
        <meta property="og:description" content="Discover powerful AI-powered resume building features including unlimited free downloads, ATS optimization, and professional templates." />
        <meta property="og:url" content="https://airesumecraft.xyz/features" />
        <meta property="og:site_name" content="AI Resume Craft" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://airesumecraft.xyz/icon.svg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="AI Resume Craft Features - Free AI Resume Builder" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Resume Builder Features | Free Resume Tools & Templates" />
        <meta name="twitter:description" content="Discover powerful AI-powered resume building features including unlimited free downloads and ATS optimization." />
        <meta name="twitter:image" content="https://airesumecraft.xyz/icon.svg" />
      </Head>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      <main className="w-full min-h-screen">
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              Powerful Features for Your <span className="text-teal-600 dark:text-teal-400">Perfect Resume</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Explore all the AI-powered tools, templates, and customization options that make resume building effortless
            </p>
          </div>
        </section>

        {/* AI-Powered Features */}
        <section className="w-full py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                Advanced AI Capabilities
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Powered by cutting-edge AI models including OpenAI and Google Gemini
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 md:p-8 bg-slate-50 text-left dark:bg-slate-800 rounded-2xl border-2 border-transparent hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 hover:shadow-md hover:scale-[1.02] transition-all duration-300"
                >
                  <div className='flex items-center gap-4'>
                    <div className="min-w-12 min-h-12 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {feature.title}
                    </h3>
                 </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Templates Section */}
        <section id="templates" className="w-full py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                10 Professional Templates
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                All templates are ATS-optimized and fully customizable
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((template, index) => (
                <div
                  key={index}
                  className="group p-6 bg-slate-50 text-left dark:bg-slate-800 rounded-2xl border-2 border-transparent hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 hover:shadow-md hover:scale-[1.02] transition-all duration-300 flex gap-4"
                >
                  {/* Left side - Text content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                      {template.description}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {template.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs font-medium bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right side - Template preview */}
                  <div className="w-40 h-52 flex-shrink-0 rounded-lg overflow-hidden bg-white shadow-sm border border-slate-200 dark:border-slate-700 relative">
                    <div className="absolute inset-0" style={{ width: '794px', height: '1123px', transform: 'scale(0.18)', transformOrigin: 'top left' }}>
                      <ResumePreview
                        resumeData={dummyResume as any}
                        template={template.id}
                        className="pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Customization Features */}
        <section className="w-full py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                Complete Customization Control
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Make your resume truly yours with powerful editing tools
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customizationFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 md:p-8 bg-slate-50 text-left dark:bg-slate-800 rounded-2xl border-2 border-transparent hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 hover:shadow-md hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="min-w-12 min-h-12 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Job Matching Features */}
        <section className="w-full py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                Intelligent Job Matching
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Optimize your resume for every job application
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobMatchingFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`group p-6 md:p-8 bg-slate-50 text-left dark:bg-slate-800 rounded-2xl border-2 border-transparent hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 hover:shadow-md hover:scale-[1.02] transition-all duration-300 ${
                    index === 2 ? 'md:col-span-2 md:w-1/2 md:mx-auto' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="min-w-12 min-h-12 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors nowhitespace-wrap">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* CTA Section */}
        <section className="w-full py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <div className="p-8 md:p-12 bg-gradient-to-br from-teal-600 to-cyan-600 dark:from-teal-700 dark:to-cyan-700 rounded-3xl text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Build Your Perfect Resume?
              </h2>
              <p className="text-lg text-teal-50 mb-8 max-w-2xl mx-auto">
                Join thousands of job seekers who have landed their dream jobs with AI Resume Craft
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/builder"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-teal-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Create Your Resume Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/blogs"
                  className="px-8 py-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl border-2 border-teal-500 transition-all duration-300"
                >
                  Read Our Blog
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default FeaturesPage
