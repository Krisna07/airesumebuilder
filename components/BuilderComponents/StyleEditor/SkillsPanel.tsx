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
    <div className="space-y-3">
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

      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 pt-2">Skill Appearance</h4>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleStyleChange({ skillsWithBackground: true })}
          className={`text-xs py-2 rounded border ${settings.skillsWithBackground !== false ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-gray-200/50 text-gray-600 hover:border-gray-300'}`}
        >
          With Background
        </button>
        <button
          type="button"
          onClick={() => handleStyleChange({ skillsWithBackground: false })}
          className={`text-xs py-2 rounded border ${settings.skillsWithBackground === false ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-gray-200/50 text-gray-600 hover:border-gray-300'}`}
        >
          Plain
        </button>
      </div>

      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 pt-2">Skill Border</h4>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleStyleChange({ skillsWithBorder: true })}
          className={`text-xs py-2 rounded border ${settings.skillsWithBorder !== false ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-gray-200/50 text-gray-600 hover:border-gray-300'}`}
        >
          With Border
        </button>
        <button
          type="button"
          onClick={() => handleStyleChange({ skillsWithBorder: false })}
          className={`text-xs py-2 rounded border ${settings.skillsWithBorder === false ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-gray-200/50 text-gray-600 hover:border-gray-300'}`}
        >
          No Border
        </button>
      </div>
    </div>
  );
}
