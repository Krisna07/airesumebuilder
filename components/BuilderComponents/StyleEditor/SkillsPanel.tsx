"use client"
import React from 'react';
import { ResumeData, ResumeStyle } from '@/types/types';
import { DEFAULT_RESUME_STYLE } from '@/lib/defaultStyle';

interface Props {
  resumeData: ResumeData;
  handleStyleChange: (styleConfig: Partial<ResumeStyle>) => void;
}

export default function SkillsPanel({ resumeData, handleStyleChange }: Props) {
  const settings = resumeData.styleConfig ?? DEFAULT_RESUME_STYLE;

  return (
    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Skills Layout</h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleStyleChange({ skillsGrouped: true })}
          className={`text-xs py-2 rounded border ${settings.skillsGrouped ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-gray-200/50 text-gray-600 hover:border-gray-300'}`}
        >
          Grouped
        </button>
        <button
          type="button"
          onClick={() => handleStyleChange({ skillsGrouped: false })}
          className={`text-xs py-2 rounded border ${!settings.skillsGrouped ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-gray-200/50 text-gray-600 hover:border-gray-300'}`}
        >
          Flat
        </button>
      </div>
    </div>
  );
}
