type Template = {
  id: string;
  name: string;
  description: string;
  accent: string;
  tags?: string[];
};

const Templates: Template[] = [
  {
    id: 'default',
    name: 'Standard',
    description: 'High-density single-column layout optimized for ATS parsing.',
    accent: 'from-sky-400 to-cyan-500',
    tags: ['ATS-Friendly', 'Clean']

  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional timeline-style resume suited for academic and formal roles.',
    accent: 'from-slate-400 to-zinc-500',
    tags: ['ATS-Friendly', 'Clean', 'Traditional']
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary full-width hero header with a clean editorial body.',
    accent: 'from-indigo-400 to-violet-500',
    tags: ['Creative', 'Stylish', 'Dark']
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Authoritative serif typography for leadership roles.',
    accent: 'from-stone-500 to-neutral-600',
    tags: ['ATS-Friendly', 'Clean', 'Serif']
  },
  {
    id: 'signal',
    name: 'Signal',
    description: 'High-contrast bold typography for marketing, sales, and impact-heavy resumes.',
    accent: 'from-neutral-800 to-neutral-900',
    tags: ['ATS-Friendly', 'Clean', 'Bold']
  },
  {
    id: 'minimal',
    name: 'Minimalist',
    description: 'Left-aligned, ultra-clean layout for tech pros.',
    accent: 'from-emerald-400 to-teal-500',
    tags: ['ATS-Friendly', 'Clean', 'Minimal']
  },
  {
    id: 'template01',
    name: 'Sidebar',
    description: 'Balanced two-column layout separating profile/skills from achievements.',
    accent: 'from-pink-400 to-rose-500',
    tags: ['ATS-Friendly', 'Clean', 'Sidebar']
  },
  {
    id: 'template02',
    name: 'Canvas',
    description: 'Asymmetric split with generous whitespace for product and design profiles.',
    accent: 'from-yellow-400 to-amber-500',
    tags: ['ATS-Friendly', 'Clean', 'Creative']
  },
  {
    id: 'atlas',
    name: 'Atlas',
    description: 'Structured left-rail layout with a strong skills panel and detailed timeline.',
    accent: 'from-teal-400 to-cyan-500',
    tags: ['ATS-Friendly', 'Structured', 'Two-Column']
  },
  {
    id: 'horizon',
    name: 'Horizon',
    description: 'Full-bleed gradient hero with card-based sections for premium presentation.',
    accent: 'from-blue-500 to-slate-700',
    tags: ['Creative', 'Hero Header', 'Premium']
  }
];

export { Templates as default };