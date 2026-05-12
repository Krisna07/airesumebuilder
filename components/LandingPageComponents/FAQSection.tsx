"use client"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

/**
 * FAQ Section Component
 * 
 * Comprehensive FAQ section for SEO and user guidance
 * Includes structured data for rich snippets
 */
export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "What is a professional resume?",
      answer: "A professional resume is a document that jobseekers use to showcase their relevant strengths and experience to land their desired role. Designed to catch the attention of job recruiters or hiring managers, it typically contains a summary of an individual's skills, work history, educational background, and achievements. As a rule of thumb, professional resumes must be carefully crafted based on the job description and requirements to maximize your chances of getting hired."
    },
    {
      question: "How does the AI resume builder work?",
      answer: "Our AI resume builder analyzes your experience, skills, and the job description you're targeting. It then generates tailored content suggestions, optimizes keywords for ATS systems, and helps you create a professional resume in seconds. Simply input your information, and our AI will craft personalized resume sections that highlight your strengths and match the job requirements."
    },
    {
      question: "How do you improve your resume with AI?",
      answer: "Our AI helps improve your resume by: analyzing job descriptions to match relevant keywords, suggesting powerful action verbs and achievements, optimizing content for ATS systems, providing real-time feedback on resume strength, and generating multiple versions tailored to different roles. You can regenerate suggestions until you find the perfect match for your professional story."
    },
    {
      question: "Is the AI resume builder free?",
      answer: "Yes! Our AI resume builder is completely free to use. You can create unlimited resumes, access all templates, use AI-powered suggestions, and download your resume in PDF format without any cost or credit card required. We believe everyone deserves access to professional resume-building tools."
    },
    {
      question: "Are the resumes ATS-friendly?",
      answer: "Absolutely! All our resume templates are specifically designed to be ATS (Applicant Tracking System) friendly. This means your resume will successfully pass through automated screening systems used by most companies. We use clean formatting, standard fonts, and proper section headers that ATS systems can easily read and parse."
    },
    {
      question: "Can I customize my resume design?",
      answer: "Yes! While maintaining ATS compatibility, you can customize colors, fonts, section order, and layout. Our templates offer the perfect balance between visual appeal and ATS optimization. You can make your resume stand out while ensuring it gets past automated screening systems."
    },
    {
      question: "How are you moderating the AI resume builder for safe use?",
      answer: "We've implemented multiple layers of safety measures to ensure responsible AI use. Our content moderation systems filter inappropriate content, protect user privacy, and ensure all generated suggestions are professional and appropriate. If you encounter any issues, you can report them immediately through our feedback system."
    },
    {
      question: "Can I create multiple versions of my resume?",
      answer: "Yes! You can create unlimited resume versions tailored to different job applications. This is highly recommended as it allows you to customize your resume for each specific role, highlighting the most relevant skills and experiences for each position you're applying to."
    }
  ]

  return (
    <section className="w-full bg-gradient-to-br  py-16 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Your Questions, Answered
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Everything you need to know about our AI resume builder
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white pr-8">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-teal-600 dark:text-teal-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="p-6 pt-0 text-slate-600 dark:text-slate-300 text-left leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
