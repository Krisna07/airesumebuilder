'use client';
import { useResume } from '@/context/ResumeContext';
import { useState } from 'react';

export default function GenerateButton() {
  const { resume, setResume } = useResume();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: resume.jobDescription }),
      });
      const data = await res.json();
      setResume((prev: any) => ({ ...prev, generated: data.resume }));
    } catch (e) {
      setError('Failed to generate resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleGenerate} className="px-4 py-2 bg-green-600 text-white rounded" disabled={loading}>
        {loading ? 'Generating...' : 'Generate Resume'}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
