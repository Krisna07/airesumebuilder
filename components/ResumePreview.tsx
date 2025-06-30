'use client';
import { useResume } from '@/context/ResumeContext';

export default function ResumePreview() {
  const { resume } = useResume();
  return (
    <div className="border p-4 rounded bg-white mt-4 text-black/50">
      <h2 className="text-xl font-bold mb-2">Live Resume Preview</h2>
      <pre className="whitespace-pre-wrap text-sm">
        {resume.generated || JSON.stringify(resume, null, 2)}
      </pre>
    </div>
  );
}
