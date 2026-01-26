type Template = {
  id: string;
  name: string;
  description: string;
  accent: string;
};

const Templates: Template[] = [
  { id: 'default', name: 'Standard', description: 'Clean, high-density layout. Perfect for ATS systems.', accent: 'from-sky-400 to-cyan-500' },
  { id: 'classic', name: 'Classic', description: 'Traditional academic layout. Simple and effective.', accent: 'from-slate-400 to-zinc-500' },
  { id: 'modern', name: 'Modern', description: 'Contemporary dark-header design for digital roles.', accent: 'from-indigo-400 to-violet-500' },
  { id: 'executive', name: 'Executive', description: 'Authoritative serif typography for leadership roles.', accent: 'from-stone-500 to-neutral-600' },
  { id: 'signal', name: 'Signal', description: 'High-contrast, bold design for marketing & sales.', accent: 'from-neutral-800 to-neutral-900' },
  { id: 'minimal', name: 'Minimalist', description: 'Left-aligned, ultra-clean layout for tech pros.', accent: 'from-emerald-400 to-teal-500' },
  { id: 'template01', name: 'Sidebar', description: 'Two-column layout separating skills from experience.', accent: 'from-pink-400 to-rose-500' },
  { id: 'template02', name: 'Canvas', description: 'Artistic whitespace usage for creative portfolios.', accent: 'from-yellow-400 to-amber-500' }
];

export default Templates;