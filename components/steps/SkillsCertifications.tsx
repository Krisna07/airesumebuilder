'use client';
import { useResume } from '@/context/ResumeContext';

export default function SkillsCertifications() {
  const { setResume } = useResume();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setResume((prev: any) => ({
      ...prev,
      [name]: value.split(',').map((s) => s.trim()),
    }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Skills & Certifications</h2>
      <input type="text" name="skills" placeholder="Skills (comma separated)" className="w-full p-2 border rounded" onChange={handleChange} />
      <input type="text" name="certifications" placeholder="Certifications (comma separated)" className="w-full p-2 border rounded" onChange={handleChange} />
    </div>
  );
}
