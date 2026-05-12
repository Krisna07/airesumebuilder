"use client"
import { memo, type RefObject } from "react"
import SectionTitlePanel from "@/components/BuilderComponents/StyleEditor/SectionTitlePanel"
import FontPanel from "@/components/BuilderComponents/StyleEditor/FontPanel"
import ColorPanel from "@/components/BuilderComponents/StyleEditor/ColorPanel"
import SectionOrderPanel from "@/components/BuilderComponents/StyleEditor/SectionOrderPanel"
import SkillsPanel from "@/components/BuilderComponents/StyleEditor/SkillsPanel"
import SpacingPanel from "@/components/BuilderComponents/StyleEditor/SpacingPanel"
import { ResumeData, ResumeStyle } from "@/types/types"

type TemplateOption = {
  id: string
  name: string
}

interface StylePanelProps {
  resumeData: ResumeData
  templateId: string
  handleStyleChange: (styleConfig: Partial<ResumeStyle>) => void
  stylesRef?: RefObject<HTMLDivElement | null>
  templateOptions?: TemplateOption[]
  onTemplateChange?: (templateId: string) => void
  userSignedIn?: boolean
}

const StylePanel = memo(({ stylesRef, resumeData, templateId, handleStyleChange, templateOptions, onTemplateChange, userSignedIn }: StylePanelProps) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      ref={stylesRef}
      className="w-full max-w-xl xl:max-w-none max-h-[70vh] overflow-y-auto space-y-4 z-110 px-4 py-4 rounded-2xl shadow-lg dark:shadow-slate-700 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
    >
      <div className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
        Style Editor
      </div>

      <div className="grid gap-4">
        {templateOptions?.length && onTemplateChange && (
          <details open>
            <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300">Templates</summary>
            <div className="pt-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {templateOptions.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onTemplateChange(template.id)}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${templateId === template.id
                      ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-sm'
                      : 'border-gray-200/50 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:border-gray-300 dark:hover:border-slate-500'
                      }`}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
              {userSignedIn === false && (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Sign in to access all templates.
                </p>
              )}
            </div>
          </details>
        )}

        <details>
          <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300">Section Titles</summary>
          <SectionTitlePanel
            resumeData={resumeData}
            handleStyleChange={handleStyleChange}
          />
        </details>

        <details>
          <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300">Typography</summary>
          <FontPanel
            resumeData={resumeData}
            handleStyleChange={handleStyleChange}
          />
        </details>

        <details>
          <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300">Colors</summary>
          <ColorPanel
            resumeData={resumeData}
            handleStyleChange={handleStyleChange}
          />
        </details>

        <details>
          <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300">Skills</summary>
          <SkillsPanel
            resumeData={resumeData}
            handleStyleChange={handleStyleChange}
          />
        </details>

        <details>
          <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300">Spacing</summary>
          <SpacingPanel
            resumeData={resumeData}
            handleStyleChange={handleStyleChange}
          />
        </details>

        <details>
          <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300">Section Order</summary>
          <div className="pt-3">
            <SectionOrderPanel
              resumeData={resumeData}
              templateId={templateId}
              handleStyleChange={handleStyleChange}
            />
          </div>
        </details>
      </div>
    </div>
  )
})

StylePanel.displayName = "StylePanel"

export default StylePanel
