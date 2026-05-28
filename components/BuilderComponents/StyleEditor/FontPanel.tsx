"use client"
import React from 'react';
import { ResumeData, ResumeStyle } from '@/types/types';
import { DEFAULT_RESUME_STYLE, mergeWithDefault } from '@/lib/defaultStyle';
import { Type, ALargeSmall } from 'lucide-react';

interface Props {
  resumeData: ResumeData;
  handleStyleChange: (styleConfig: Partial<ResumeStyle>) => void;
}

const FONT_OPTIONS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Merriweather",
  "Playfair Display",
  "Lora",
  "Roboto Mono",
  "Fira Code",
  "Montserrat",
  "Raleway",
  "Nunito",
  "Arial",
  "Georgia",
  "Times New Roman",
];

export default function FontPanel({ resumeData, handleStyleChange }: Props) {
  const rawStyle = (resumeData.styleConfig && typeof resumeData.styleConfig === 'object')
    ? resumeData.styleConfig
    : null;
  const settings = mergeWithDefault(rawStyle);

  const update = (updates: Partial<ResumeStyle>) => {
    handleStyleChange(updates);
  };

  return (
    <div className="space-y-4">

      <div className="grid grid-cols-2 gap-3">
        {/* Heading Font */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Type size={12}/> Heading Font
          </label>
          <select
            value={settings.headingFont || DEFAULT_RESUME_STYLE.headingFont}
            onChange={(e) => update({ headingFont: e.target.value })}
            className="w-full text-sm p-2 bg-gray-50 dark:bg-slate-700 border border-gray-200/50 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-teal-500 outline-none"
          >
            {FONT_OPTIONS.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Body Font */}
        <div>
          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Type size={12}/> Body Font
          </label>
          <select
            value={settings.bodyFont || DEFAULT_RESUME_STYLE.bodyFont}
            onChange={(e) => update({ bodyFont: e.target.value })}
            className="w-full text-sm p-2 bg-gray-50 dark:bg-slate-700 border border-gray-200/50 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-teal-500 outline-none"
          >
             {FONT_OPTIONS.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body Font Size Slider */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs text-gray-500 flex items-center gap-1">
            <ALargeSmall size={12}/> Body Size
          </label>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {settings.bodyFontSize || DEFAULT_RESUME_STYLE.bodyFontSize}px
          </span>
        </div>
        <input
          type="range"
          min="9"
          max="14"
          step="0.5"
          value={settings.bodyFontSize || DEFAULT_RESUME_STYLE.bodyFontSize}
          onChange={(e) => update({ bodyFontSize: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-teal-600"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>9px</span>
          <span>14px</span>
        </div>
      </div>

    </div>
  );
}
