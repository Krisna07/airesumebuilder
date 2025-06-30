'use client';

import { useResume } from '@/context/ResumeContext';
import type { Resume } from '@/types/Resume';
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
        rows={3}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-black focus:border-black"
      />
    </div>
  );


export default function Projects() {
  const { resume, setResume } = useResume();

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newProjects = [...(resume.projects || [])];
    newProjects[index] = { ...newProjects[index], [name]: value };
    setResume((prev: Resume) => ({ ...prev, projects: newProjects }));
  };

  const addProject = () => {
    const newProjects = [...(resume.projects || []), { name: '', description: '', techStack: '', role: '' }];
    setResume((prev: Resume) => ({ ...prev, projects: newProjects }));
  };

  const removeProject = (index: number) => {
    const newProjects = [...(resume.projects || [])];
    newProjects.splice(index, 1);
    setResume((prev: Resume) => ({ ...prev, projects: newProjects }));
  };

  const projects = resume.projects?.length ? resume.projects : [{ name: '', description: '', techStack: '', role: '' }];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Projects</h2>
      <div className="space-y-6">
        {projects.map((project, index) => (
          <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
            <h3 className="font-semibold text-lg mb-4">Project {index + 1}</h3>
            <div className="space-y-4">
                <InputField label="Project Name" name="name" placeholder="e.g., AI Resume Builder" value={project.name} onChange={(e: any) => handleChange(index, e)} />
                <TextareaField label="Description" name="description" placeholder="Describe the project..." value={project.description} onChange={(e: any) => handleChange(index, e)} />
                <InputField label="Technologies Used" name="techStack" placeholder="e.g., Next.js, TypeScript, Gemini" value={project.techStack} onChange={(e: any) => handleChange(index, e)} />
                <InputField label="Role / Contributions" name="role" placeholder="e.g., Lead Developer" value={project.role} onChange={(e: any) => handleChange(index, e)} />
            </div>
            {projects.length > 1 && (
                <button
                    type="button"
                    onClick={() => removeProject(index)}
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
        onClick={addProject}
        className="mt-6 flex items-center px-4 py-2 border border-dashed border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Project
      </button>
    </div>
  );
}
