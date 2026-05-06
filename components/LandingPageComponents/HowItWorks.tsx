"use client";
import { useState } from "react";
import Image from "next/image";

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState(0);

  const steps = [
    {
      id: 0,
      title: "1. Add your experience",
      description: "Paste your resume or import a job description — we extract the key facts for you in seconds.",
      image: "/steps/step1.png",
      alt: "AI Resume Builder form interface extracting work experience"
    },
    {
      id: 1,
      title: "2. Tailor with AI",
      description: "Use our artificial intelligence to rewrite bullets, highlight impact, and perfectly match the language of the job posting.",
      image: "/steps/step2.png",
      alt: "AI text generation magically rewriting resume bullet points"
    },
    {
      id: 2,
      title: "3. Export & apply for Free",
      description: "Format seamlessly into our professional, ATS-friendly templates and export unlimited PDFs—completely free.",
      image: "/steps/step3.png",
      alt: "Resume PDF template export preview screen"
    }
  ];

  return (
    <section id="how-it-works" className="w-full py-16 md:py-24  transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">How it works</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">Create a tailored resume in three simple steps — no design skills required.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Tabs / Text Left Side */}
          <div className="w-full lg:w-[45%] flex flex-col gap-4">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setActiveTab(index)}
                className={`text-left p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 transform group ${
                  activeTab === index
                    ? "border-teal-500 bg-teal-50/50 dark:bg-teal-900/20 shadow-md scale-[1.02]"
                    : "border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-[1.01]"
                }`}
              >
                <div className={`text-xl font-bold mb-3 transition-colors ${activeTab === index ? "text-teal-600 dark:text-teal-400" : "text-slate-800 dark:text-slate-200 group-hover:text-teal-500"}`}>
                  {step.title}
                </div>
                <p className={`text-sm md:text-base leading-relaxed transition-colors ${activeTab === index ? "text-slate-700 dark:text-slate-300 font-medium" : "text-slate-500 dark:text-slate-400"}`}>
                  {step.description}
                </p>
              </button>
            ))}
          </div>

          {/* Fading Image Right Side */}
          <div className="w-full lg:w-[55%] relative w-full aspect-[4/3] md:aspect-video lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                  activeTab === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <Image
                  src={step.image}
                  alt={step.alt}
                  fill
                  className="object-cover object-left-top"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks;
