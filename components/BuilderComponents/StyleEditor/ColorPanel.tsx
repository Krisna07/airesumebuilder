"use client"
import React from 'react';
import { ResumeData, ResumeStyle } from '@/types/types';
import { DEFAULT_RESUME_STYLE, mergeWithDefault } from '@/lib/defaultStyle';
import { Palette } from 'lucide-react';

interface Props {
  resumeData: ResumeData;
  handleStyleChange: (styleConfig: Partial<ResumeStyle>) => void;
}

export default function ColorPanel({ resumeData, handleStyleChange }: Props) {
  const rawStyle = (resumeData.styleConfig && typeof resumeData.styleConfig === 'object')
    ? resumeData.styleConfig
    : null;
  const settings = mergeWithDefault(rawStyle);

  const update = (updates: Partial<ResumeStyle>) => {
    handleStyleChange(updates);
  };

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-2 gap-4">
        {/* Accent Color */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Palette size={12}/> Accent Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.accentColor || DEFAULT_RESUME_STYLE.accentColor}
              onChange={(e) => update({ accentColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0 overflow-hidden bg-transparent outline-none"
            />
            <span className="text-xs text-gray-600 font-mono uppercase">
              {settings.accentColor || DEFAULT_RESUME_STYLE.accentColor}
            </span>
          </div>
        </div>

        {/* Line Color */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Palette size={12}/> Line Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.lineColor || DEFAULT_RESUME_STYLE.lineColor}
              onChange={(e) => update({ lineColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0 overflow-hidden bg-transparent outline-none"
            />
            <span className="text-xs text-gray-600 font-mono uppercase">
              {settings.lineColor || DEFAULT_RESUME_STYLE.lineColor}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
