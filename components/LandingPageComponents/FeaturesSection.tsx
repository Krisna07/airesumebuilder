import React from 'react';

type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const features: Feature[] = [
  {
    title: 'Tailored for each job',
    description: 'Paste a job description and get a resume optimized for that role — keywords, strengths and suggestions included.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 21a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    title: 'ATS-friendly templates',
    description: 'Choose clean, recruiter-tested templates that parse well through applicant tracking systems.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M7 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    title: 'One-click export',
    description: 'Export to PDF instantly with preserved layout and high print quality.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="4" y="17" width="16" height="3" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    )
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="w-full py-12 bg-transparent" aria-label="Features">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Everything you need to land the job</h2>
          <p className="mt-2 text-slate-600 max-w-2xl mx-auto">Smart tools to create, tailor and export professional resumes in minutes.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div key={i} className="p-6 bg-white/5 backdrop-blur-sm border border-slate-100/6 rounded-lg shadow-[0_0_2px_0_gray] grid place-items-center">
              <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-md bg-gray-600 text-white">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;