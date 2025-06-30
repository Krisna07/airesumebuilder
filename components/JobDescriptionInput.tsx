'use client';
import { useResume } from '@/context/ResumeContext';

export default function JobDescriptionInput() {
  const { setResume } = useResume();
  return (
    <textarea
      className="w-full p-2 border rounded mb-4"
      placeholder="Paste the job description here..."
      onChange={e => setResume((prev: any) => ({ ...prev, jobDescription: e.target.value }))}
    />
  );
}
