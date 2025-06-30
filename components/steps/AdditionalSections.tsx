'use client';
import { useResume } from '@/context/ResumeContext';

export default function AdditionalSections() {
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
      <h2 className="text-2xl font-semibold">Additional Sections</h2>
      <input type="text" name="awards" placeholder="Awards (comma separated)" className="w-full p-2 border rounded" onChange={handleChange} />
      <input type="text" name="languages" placeholder="Languages (comma separated)" className="w-full p-2 border rounded" onChange={handleChange} />
      <input type="text" name="volunteer" placeholder="Volunteer Experience (comma separated)" className="w-full p-2 border rounded" onChange={handleChange} />
    </div>
  );
}
