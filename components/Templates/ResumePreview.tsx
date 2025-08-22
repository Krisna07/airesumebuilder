'use client';
import { ResumeStorage } from '@/lib/resume-storage';
import { generateTemplateHTML } from '@/lib/template-utils';
import { ResumeData, UserResume } from '@/types/types';
import React, { useEffect, useState } from 'react';


interface ResumePreviewProps {
  slug: string;
  resumeData: ResumeData;
}

const ResumePreview = ({ slug, resumeData }: ResumePreviewProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<UserResume['template']>('modern');

  // Template definitions
  const templates: { id: UserResume['template']; name: string; description: string; icon: string }[] = [
    { id: 'modern', name: 'Modern', description: 'Clean design with gradient header', icon: '🎨' },
    { id: 'classic', name: 'Classic', description: 'Traditional professional layout', icon: '📄' },
    { id: 'minimal', name: 'Minimal', description: 'Simple, elegant design', icon: '✨' },
  ];

  // Load saved template on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = ResumeStorage.load(slug);
      if (stored?.template) {
        setSelectedTemplate(stored.template);
      }
    }
  }, [slug]);

  const handleTemplateChange = (templateId: UserResume['template']) => {
    setSelectedTemplate(templateId);
    if (typeof window !== 'undefined') {
      const stored = ResumeStorage.load(slug);
      if (stored) {
        ResumeStorage.save(slug, templateId, stored.resumeData);
      }
    }
  };

  return (
    <div>
      <div className="grid gap-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Template</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateChange(template.id)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{template.icon}</span>
                <h3
                  className={`font-semibold ${
                    selectedTemplate === template.id ? 'text-blue-700' : 'text-gray-800'
                  }`}
                >
                  {template.name}
                </h3>
              </div>
              <p className="text-sm text-gray-600">{template.description}</p>
            </button>
          ))}
        </div>

        {/* Render generated HTML in iframe */}
        <div className="select-none mt-6">
          <iframe
            style={{ width: '100%', height: '100vh', border: '1px solid #ddd', borderRadius: '12px' }}
            srcDoc={generateTemplateHTML(selectedTemplate, resumeData)}
          />
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
