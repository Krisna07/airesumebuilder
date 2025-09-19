import React from 'react';
import Link from 'next/link';
import Button from '../UI/Button';
import ResumePreview from '../Templates/ResumePreview';
import dummyResume from '@/app/data/dummyResume.json';

type Template = {
  id: string;
  name: string;
  description: string;
  accent: string;
};

const templates: Template[] = [
  { id: 'default', name: 'Default', description: 'Clean, recruiter-friendly layout. Great for corporate roles.', accent: 'from-sky-400 to-cyan-500' },
  { id: 'classic', name: 'Classic', description: 'Clean, recruiter-friendly layout. Great for corporate roles.', accent: 'from-sky-400 to-cyan-500' },
  { id: 'modern', name: 'Modern', description: 'Contemporary layout with bold headings and clear sections.', accent: 'from-indigo-400 to-violet-500' },
  { id: 'minimal', name: 'Technical', description: 'Compact, skills-first design for engineers and data scientists.', accent: 'from-emerald-400 to-teal-500' },
  { id: 'template01', name: 'Creative', description: 'Visually distinct template for designers and product folks.', accent: 'from-pink-400 to-rose-500' },
  { id: 'template02', name: 'Compact', description: 'Dense, information-first layout for CVs with lots of skills.', accent: 'from-yellow-400 to-amber-500' }
];

const TemplatesSection: React.FC = () => {
  const getDummyData = () => JSON.parse(JSON.stringify(dummyResume));
  const dummyData = getDummyData();
  return (
    <section className=' overflow-hidden px-4 grid place-items-center py-12' aria-label='Templates'>
      <div className='text-center mb-8'>
        <h2 className='text-2xl sm:text-3xl font-extrabold text-slate-900'>Templates built for results</h2>
        <p className='mt-2 text-slate-600 max-w-2xl mx-auto'>Pick a template that fits your industry — all templates are ATS-friendly and customizable.</p>
      </div>

      <div className='max-[1300px]:w-full md:grid flex md:grid-cols-2 lg:grid-cols-3 p-4 gap-4  md:overflow-hidden overflow-x-scroll rounded-xl'>
        {templates.map((template) => (
          <div key={template.id} className='group p-2 min-w-[340px] max-w-min h-[350px] rounded-lg  backdrop-blur-sm shadow-[0_0_2px_0_gray] grid gap-1 py-4 '>
            <div className={`w-full rounded-md overflow-hidden mb-4 bg-gradient-to-tr ${template.accent} flex items-center justify-center relative`}>
              <div className='h-full w-full transition-all duration-300 group-hover:blur-[2px] relative z-[10]'>
                <ResumePreview template={template.id} resumeData={dummyData} />
              </div>
              <div className='w-full h-full absolute z-[100] '></div>
            </div>
            <hr />
            <h3 className='text-lg font-semibold text-slate-900'>{template.name}</h3>
            <p className=' text-sm text-slate-600 flex-1'>{template.description}</p>

            <div className='mt-2 flex items-center justify-center gap-3'>
              <Link href={`/builder`} className='inline-block'>
                <Button variant='primary' size='small'>
                  Use template
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TemplatesSection;
