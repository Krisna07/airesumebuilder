type Template = {
  id: string;
  name: string;
  description: string;
  accent: string;
};

const Templates: Template[] = [
  { id: 'default', name: 'Default', description: 'Clean, recruiter-friendly layout. Great for corporate roles.', accent: 'from-sky-400 to-cyan-500' },
  { id: 'classic', name: 'Classic', description: 'Clean, recruiter-friendly layout. Great for corporate roles.', accent: 'from-sky-400 to-cyan-500' },
  { id: 'modern', name: 'Modern', description: 'Contemporary layout with bold headings and clear sections.', accent: 'from-indigo-400 to-violet-500' },
  { id: 'minimal', name: 'Technical', description: 'Compact, skills-first design for engineers and data scientists.', accent: 'from-emerald-400 to-teal-500' },
  { id: 'template01', name: 'Creative', description: 'Visually distinct template for designers and product folks.', accent: 'from-pink-400 to-rose-500' },
  { id: 'template02', name: 'Compact', description: 'Dense, information-first layout for CVs with lots of skills.', accent: 'from-yellow-400 to-amber-500' }
];

export default Templates;