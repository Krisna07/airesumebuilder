import React from 'react'
import dummyResume from '@/app/data/dummyResume.json';
import ResumePreview from '../Templates/ResumePreview';
import Button from '../UI/Button';
import Link from 'next/link';           

const TemplateSlider = () => {
  const getDummyData = () => JSON.parse(JSON.stringify(dummyResume));
  const dummyData = getDummyData();

  const templates = [
    { name: 'default' },
    { name: 'modern' },
    { name: 'classic' },
    { name: 'minimal' },
    { name: 'template01' },
    { name: 'template02' }
  ];

  return (
    <div className="w-full grid gap-4 my-4 place-items-center text-center">
      <h2 className="w-full min-[500px]:w-[500px] text-2xl font-semibold">
        Select From Design and Start Building your Resume
      </h2>
      <div className="w-full min-[1050px]:w-[1000px] md:grid flex md:grid-cols-3 p-2 gap-2 bg-gray-200 md:overflow-hidden overflow-x-scroll rounded-xl">
        {templates.map(t => (
          <div
            key={t.name}
            className="group relative min-w-[300px] md:min-w-full py-4 h-[400px] bg-white rounded-xl overflow-hidden"
          >
            {/* Preview */}
            <div className="h-full w-full transition-all duration-300 group-hover:blur-[2px]">
              <ResumePreview template={t.name} resumeData={dummyData} />
            </div>

            {/* Hover overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-2 transition-all duration-300">
              <Link
                href={`/builder`}
                className="pointer-events-auto"
              >
                <Button variant="primary" size="medium">
                  Start Building
                </Button>
              </Link>
            </div>

            {/* Template label */}
            <div className="absolute top-2 left-2 text-xs font-medium bg-white/80 backdrop-blur px-2 py-1 rounded shadow">
              {t.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSlider;