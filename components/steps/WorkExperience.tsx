'use client';

import { useResume } from '@/context/ResumeContext';
import type { Resume, WorkExperience } from '@/types/Resume';
import { Plus, Trash2 } from 'lucide-react';

const InputField = ({ label, name, placeholder, value, onChange }: any) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type="text"
      id={name}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
    />
  </div>
);

const TextareaField = ({ label, name, placeholder, value, onChange }: any) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
      />
    </div>
  );


export default function WorkExperienceComponent() {
  const { resume, setResume } = useResume();

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newWorkExperience = [...(resume.work || [])];
    newWorkExperience[index] = { ...newWorkExperience[index], [name]: value };
    setResume((prev: Resume) => ({ ...prev, work: newWorkExperience }));
  };

  const addWorkExperience = () => {
    const newWorkExperience = [...(resume.work || []), { company: '', role: '', duration: '', description: '' }];
    setResume((prev: Resume) => ({ ...prev, work: newWorkExperience }));
  };

  const removeWorkExperience = (index: number) => {
    const newWorkExperience = [...(resume.work || [])];
    newWorkExperience.splice(index, 1);
    setResume((prev: Resume) => ({ ...prev, work: newWorkExperience }));
  };

  const workExperiences = resume.work?.length ? resume.work : [{ company: '', role: '', duration: '', description: '' }];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Work Experience</h2>
      <div className="space-y-6">
        {workExperiences.map((work: WorkExperience, index: number) => (
          <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
             <h3 className="font-semibold text-lg mb-4">Position {index + 1}</h3>
            <div className="space-y-4">
                <InputField label="Company Name" name="company" placeholder="e.g., Google" value={work.company} onChange={(e: any) => handleChange(index, e)} />
                <InputField label="Role / Title" name="role" placeholder="e.g., Software Engineer" value={work.role} onChange={(e: any) => handleChange(index, e)} />
                <InputField label="Duration" name="duration" placeholder="e.g., Jan 2022 - Present" value={work.duration} onChange={(e: any) => handleChange(index, e)} />
                <TextareaField label="Responsibilities & Achievements" name="description" placeholder="Describe your role and accomplishments..." value={work.description} onChange={(e: any) => handleChange(index, e)} />
            </div>
            {workExperiences.length > 1 && (
                <button
                    type="button"
                    onClick={() => removeWorkExperience(index)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addWorkExperience}
        className="mt-6 flex items-center px-4 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Position
      </button>
    </div>
  );
}
