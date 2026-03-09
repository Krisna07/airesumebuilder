"use client"
import React from 'react';
import { ResumeData, ResumeStyle } from '@/types/types';
import { mergeWithDefault } from '@/lib/defaultStyle';

interface Props {
  resumeData: ResumeData;
  handleStyleChange: (styleConfig: Partial<ResumeStyle>) => void;
}

export default function SpacingPanel({ resumeData, handleStyleChange }: Props) {
  const rawStyle = (resumeData.styleConfig && typeof resumeData.styleConfig === 'object')
    ? resumeData.styleConfig
    : null;
  const settings = mergeWithDefault(rawStyle);

  const update = (updates: Partial<ResumeStyle>) => {
    handleStyleChange(updates);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Spacing and Text</h3>

      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <label>Section Gap</label>
          <span>{settings.sectionGap}px</span>
        </div>
        <input
          type="range"
          min="8"
          max="32"
          step="1"
          value={settings.sectionGap}
          onChange={(e) => update({ sectionGap: Number(e.target.value) })}
          className="w-full accent-teal-600"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <label>Item Gap</label>
          <span>{settings.itemGap}px</span>
        </div>
        <input
          type="range"
          min="4"
          max="20"
          step="1"
          value={settings.itemGap}
          onChange={(e) => update({ itemGap: Number(e.target.value) })}
          className="w-full accent-teal-600"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <label>Line Height</label>
          <span>{Number(settings.lineHeight).toFixed(2)}</span>
        </div>
        <input
          type="range"
          min="1.2"
          max="1.8"
          step="0.05"
          value={settings.lineHeight}
          onChange={(e) => update({ lineHeight: Number(e.target.value) })}
          className="w-full accent-teal-600"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Body Text Align</label>
        <div className="grid grid-cols-3 gap-2">
          {(['left', 'justify', 'center'] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => update({ bodyTextAlign: align })}
              className={`text-xs py-1.5 rounded border ${settings.bodyTextAlign === align ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {align}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
