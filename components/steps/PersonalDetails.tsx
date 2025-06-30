'use client';

import { useResume } from '@/context/ResumeContext';
import type { Resume } from '@/types/Resume';

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

export default function PersonalDetails() {
  const { resume, setResume } = useResume();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResume((prev: Resume) => ({ ...prev, personal: { ...prev.personal, [name]: value } }));
  };

  const personal = resume.personal || {};

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 ">Personal Details</h2>
      <div className="space-y-4">
        <InputField label="Full Name" name="name" placeholder="e.g., John Doe" value={personal.name} onChange={handleChange} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Email" name="email" placeholder="e.g., john.doe@email.com" value={personal.email} onChange={handleChange} />
            <InputField label="Phone" name="phone" placeholder="e.g., +1 123-456-7890" value={personal.phone} onChange={handleChange} />
        </div>
        <InputField label="Location" name="location" placeholder="e.g., San Francisco, CA" value={personal.location} onChange={handleChange} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="LinkedIn Profile" name="linkedin" placeholder="URL" value={personal.linkedin} onChange={handleChange} />
            <InputField label="GitHub Profile" name="github" placeholder="URL" value={personal.github} onChange={handleChange} />
        </div>
        <InputField label="Portfolio/Website" name="portfolio" placeholder="URL" value={personal.portfolio} onChange={handleChange} />
      </div>
    </div>
  );
}
