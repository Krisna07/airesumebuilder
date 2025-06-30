'use client';

import { useResume } from '@/context/ResumeContext';
import type { Education as EducationType } from '@/types/Resume';
import { Plus, Trash2 } from 'lucide-react';

const InputField = ({ label, name, placeholder, value, onChange }: {
  label: string;
  name: keyof EducationType;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
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

export default function Education() {
  const { resume, setResume } = useResume();

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newEducation = [...(resume.education || [])];
    newEducation[index] = { ...newEducation[index], [name]: value };
    setResume((prev) => ({ ...prev, education: newEducation }));
  };

  const addEducation = () => {
    const newEducation = [...(resume.education || []), { institution: '', degree: '', field: '', duration: '' }];
    setResume((prev) => ({ ...prev, education: newEducation }));
  };

  const removeEducation = (index: number) => {
    const newEducation = [...(resume.education || [])];
    newEducation.splice(index, 1);
    setResume((prev) => ({ ...prev, education: newEducation }));
  };

  const educations = resume.education?.length ? resume.education : [{ institution: '', degree: '', field: '', duration: '' }];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Education</h2>
      <div className="space-y-6">
        {educations.map((edu, index) => (
          <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
            <h3 className="font-semibold text-lg mb-4">Entry {index + 1}</h3>
            <div className="space-y-4">
                <InputField label="Institution" name="institution" placeholder="e.g., University of Example" value={edu.institution || ''} onChange={(e) => handleChange(index, e)} />
                <InputField label="Degree" name="degree" placeholder="e.g., Bachelor of Science" value={edu.degree || ''} onChange={(e) => handleChange(index, e)} />
                <InputField label="Field of Study" name="field" placeholder="e.g., Computer Science" value={edu.field || ''} onChange={(e) => handleChange(index, e)} />
                <InputField label="Duration" name="duration" placeholder="e.g., 2018 - 2022" value={edu.duration || ''} onChange={(e) => handleChange(index, e)} />
            </div>
            {educations.length > 1 && (
                <button
                    type="button"
                    onClick={() => removeEducation(index)}
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
        onClick={addEducation}
        className="mt-6 flex items-center px-4 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Entry
      </button>
    </div>
  );
}
