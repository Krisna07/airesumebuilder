"use client"
import React from 'react';
import { ResumeData, ResumeStyle, SectionTitleStyle, SectionTitleType, TextAlign, FontWeight, TextTransform } from '@/types/types';
import { AlignLeft, AlignCenter, AlignRight, Type, Bold, Italic, ALargeSmall } from 'lucide-react';
import { DEFAULT_RESUME_STYLE, mergeWithDefault } from '@/lib/defaultStyle';

interface Props {
  resumeData: ResumeData;
  handleStyleChange: (styleConfig: Partial<ResumeStyle>) => void;
}

const TITLE_TYPES: { value: SectionTitleType; label: string }[] = [
  { value: 'plain', label: 'Plain Text' },
  { value: 'underline', label: 'Underline' },
  { value: 'overline', label: 'Overline' },
  { value: 'ribbon', label: 'Ribbon Background' },
  { value: 'left-bar', label: 'Left Bar Accent' },
];

const FONT_WEIGHTS: FontWeight[] = [400, 500, 600, 700, 800, 900];

export default function SectionTitlePanel({ resumeData, handleStyleChange }: Props) {
  const rawStyle = (resumeData.styleConfig && typeof resumeData.styleConfig === 'object')
    ? resumeData.styleConfig
    : null;
  const settings = mergeWithDefault(rawStyle).sectionTitleStyle;

  const update = (updates: Partial<SectionTitleStyle>) => {
    handleStyleChange({
      sectionTitleStyle: { ...settings, ...updates }
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Section Titles</h3>

      {/* Type Selector */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Style Type</label>
        <select
          value={settings.type}
          onChange={(e) => update({ type: e.target.value as SectionTitleType })}
          className="w-full text-sm p-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-teal-500 outline-none"
        >
          {TITLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Alignment (Icon Buttons) */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Alignment</label>
        <div className="flex bg-gray-50 dark:bg-slate-700 rounded-md p-1 border border-gray-200 dark:border-slate-600">
          {(['left', 'center', 'right'] as TextAlign[]).map((align) => {
            const active = settings.align === align;
            return (
              <button
                key={align}
                onClick={() => update({ align })}
                className={`flex-1 flex justify-center py-1.5 rounded-sm transition-colors ${
                  active ? 'bg-white dark:bg-slate-600 shadow-sm text-teal-600' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }`}
              >
                {align === 'left' && <AlignLeft size={16} />}
                {align === 'center' && <AlignCenter size={16} />}
                {align === 'right' && <AlignRight size={16} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Controls Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Weight */}
        <div>
           <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Bold size={12}/> Weight</label>
           <select
             value={settings.fontWeight}
             onChange={(e) => update({ fontWeight: parseInt(e.target.value) as FontWeight })}
             className="w-full text-sm p-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md outline-none"
           >
             {FONT_WEIGHTS.map(w => <option key={w} value={w}>{w}</option>)}
           </select>
        </div>
        {/* Transform */}
        <div>
           <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><Type size={12}/> Casing</label>
           <select
             value={settings.textTransform}
             onChange={(e) => update({ textTransform: e.target.value as TextTransform })}
             className="w-full text-sm p-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md outline-none"
           >
             <option value="none">Normal</option>
             <option value="uppercase">UPPERCASE</option>
             <option value="capitalize">Capitalize</option>
           </select>
        </div>
      </div>

      {/* Italic Toggle */}
      <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit text-sm text-gray-700 dark:text-gray-300">
         <div className={`p-1 rounded ${settings.fontStyle === 'italic' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 dark:bg-slate-700 text-gray-500'}`}>
            <Italic size={14} />
         </div>
         <input
            type="checkbox"
            className="hidden"
            checked={settings.fontStyle === 'italic'}
            onChange={(e) => update({ fontStyle: e.target.checked ? 'italic' : 'normal' })}
         />
         Italicize titles
      </label>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs text-gray-500 flex items-center gap-1">
            <ALargeSmall size={12} /> Title Size
          </label>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {(settings.fontSize ?? DEFAULT_RESUME_STYLE.sectionTitleStyle.fontSize).toFixed(1)}px
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="16"
          step="0.5"
          value={settings.fontSize ?? DEFAULT_RESUME_STYLE.sectionTitleStyle.fontSize}
          onChange={(e) => update({ fontSize: Number(e.target.value) })}
          className="w-full h-1.5 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-teal-600"
        />
      </div>

      {/* Icon Control */}
      <div className="pt-2 border-t border-gray-100 dark:border-slate-700 mt-4">
         <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300 font-medium">
            <input
               type="checkbox"
                 checked={Boolean(settings.iconEnabled)}
               onChange={(e) => update({ iconEnabled: e.target.checked })}
               className="rounded text-teal-600 focus:ring-teal-500"
            />
            Show an emoji icon next to title
         </label>
         {settings.iconEnabled && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
               <input
                 type="text"
                 maxLength={2}
                 value={settings.icon ?? ''}
                 placeholder="💼"
                 onChange={(e) => update({ icon: e.target.value })}
                 className="w-12 text-center text-lg p-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-500 rounded-md outline-none"
               />
               <span className="ml-2">Press <kbd className="px-1 bg-gray-100 rounded">Win</kbd> + <kbd className="px-1 bg-gray-100 rounded">.</kbd> to pick emoji (PDF safe)</span>
            </div>
         )}
      </div>

    </div>
  );
}
