"use client"
import { memo, useEffect, useState, type RefObject } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
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
  onCreateTemplate?: (templateName: string, baseTemplateId?: string) => void
  baseTemplateOptions?: TemplateOption[]
  defaultCreateBaseTemplateId?: string
  createTemplatePlaceholder?: string
  creatingTemplate?: boolean
  customTemplateName?: string | null
  userSignedIn?: boolean
  densityMode?: 'comfortable' | 'compact'
}

const StylePanel = memo(({
  stylesRef,
  resumeData,
  templateId,
  handleStyleChange,
  templateOptions,
  onTemplateChange,
  onCreateTemplate,
  baseTemplateOptions,
  defaultCreateBaseTemplateId,
  createTemplatePlaceholder = 'username-resume',
  creatingTemplate = false,
  customTemplateName,
  userSignedIn,
  densityMode = 'comfortable'
}: StylePanelProps) => {
  const [openPanel, setOpenPanel] = useState<string>(templateOptions?.length && onTemplateChange ? 'templates' : 'titles')
  const [createName, setCreateName] = useState('')
  const [showCreateOwn, setShowCreateOwn] = useState(false)
  const [createBaseTemplateId, setCreateBaseTemplateId] = useState(defaultCreateBaseTemplateId || 'modern')
  const compact = densityMode === 'compact'
  const panelWrapClass = compact ? 'px-2.5 pb-2.5' : 'px-3 pb-3'

  useEffect(() => {
    if (defaultCreateBaseTemplateId) {
      setCreateBaseTemplateId(defaultCreateBaseTemplateId);
    }
  }, [defaultCreateBaseTemplateId]);

  const togglePanel = (key: string) => {
    setOpenPanel((prev) => (prev === key ? '' : key))
  }

  const Header = ({ panelKey, label }: { panelKey: string; label: string }) => (
    <button type="button" onClick={() => togglePanel(panelKey)} className="w-full flex items-center justify-between text-left px-3.5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50/80 dark:hover:bg-slate-700/40 rounded-t-xl transition-colors touch-manipulation select-none">
      <span>{label}</span>
      {openPanel === panelKey ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  )

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      ref={stylesRef}
      data-style-panel="true"
      className={`w-full max-w-xl xl:max-w-none max-h-[72vh] overflow-y-auto z-110 rounded-2xl shadow-[0_16px_38px_-24px_rgba(2,6,23,0.8)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 ${compact ? 'space-y-3 px-3 py-3' : 'space-y-4 px-4 py-4'}`}
    >
      <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
        <div className="font-semibold tracking-tight text-slate-900 dark:text-white">Style Editor</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customize layout, typography, and visual tone.</div>
      </div>

      <div className={`grid ${compact ? 'gap-2.5' : 'gap-3'}`}>
        {templateOptions?.length && onTemplateChange && (
          <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl bg-white/60 dark:bg-slate-800/50">
            <Header panelKey="templates" label="Templates" />
            {openPanel === 'templates' && <div className={`${panelWrapClass} space-y-3 anim-fade-in-soft`} style={{ animationDelay: '30ms' }}>
              <div className="rounded-lg border border-dashed border-teal-300 dark:border-teal-700 p-2.5 bg-teal-50/50 dark:bg-teal-900/15">
                <button
                  type="button"
                  onClick={() => setShowCreateOwn((prev) => !prev)}
                  className="w-full text-left text-sm font-semibold text-teal-700 dark:text-teal-300"
                >
                  + Create your own
                </button>
                {showCreateOwn && onCreateTemplate && (
                  <div className="mt-2 space-y-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Base template</label>
                      <select
                        value={createBaseTemplateId}
                        onChange={(e) => setCreateBaseTemplateId(e.target.value)}
                        className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                      >
                        {(baseTemplateOptions && baseTemplateOptions.length > 0 ? baseTemplateOptions : templateOptions)?.map((template) => (
                          <option key={template.id} value={template.id}>{template.name}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder={createTemplatePlaceholder}
                      className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      disabled={creatingTemplate}
                      onClick={() => {
                        onCreateTemplate(createName, createBaseTemplateId || defaultCreateBaseTemplateId || templateId)
                        setCreateName('')
                      }}
                      className="w-full rounded-md bg-teal-600 text-white text-xs font-semibold px-2.5 py-1.5 hover:bg-teal-500 disabled:opacity-60"
                    >
                      {creatingTemplate ? 'Creating...' : 'Create Template'}
                    </button>
                  </div>
                )}
              </div>

              {customTemplateName && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Editing custom template: <span className="font-semibold text-slate-700 dark:text-slate-200">{customTemplateName}</span>
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                {templateOptions.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onTemplateChange(template.id)}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${templateId === template.id
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500 bg-white/80 dark:bg-slate-900/30'
                      }`}
                  >
                    <div className="font-medium leading-tight">{template.name}</div>
                  </button>
                ))}
              </div>
              {userSignedIn === false && (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Sign in to access all templates.
                </p>
              )}
            </div>}
          </div>
        )}

        <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl bg-white/60 dark:bg-slate-800/50">
          <Header panelKey="titles" label="Section Titles" />
          {openPanel === 'titles' && <div className={`${panelWrapClass} anim-fade-in-soft`} style={{ animationDelay: '45ms' }}><SectionTitlePanel
            resumeData={resumeData}
            handleStyleChange={handleStyleChange}
          /></div>}
        </div>

        <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl bg-white/60 dark:bg-slate-800/50">
          <Header panelKey="typography" label="Typography" />
          {openPanel === 'typography' && <div className={`${panelWrapClass} anim-fade-in-soft`} style={{ animationDelay: '60ms' }}><FontPanel
            resumeData={resumeData}
            handleStyleChange={handleStyleChange}
          /></div>}
        </div>

        <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl bg-white/60 dark:bg-slate-800/50">
          <Header panelKey="colors" label="Colors" />
          {openPanel === 'colors' && <div className={`${panelWrapClass} anim-fade-in-soft`} style={{ animationDelay: '75ms' }}><ColorPanel
            resumeData={resumeData}
            handleStyleChange={handleStyleChange}
          /></div>}
        </div>

        <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl bg-white/60 dark:bg-slate-800/50">
          <Header panelKey="skills" label="Skills" />
          {openPanel === 'skills' && <div className={`${panelWrapClass} anim-fade-in-soft`} style={{ animationDelay: '90ms' }}><SkillsPanel
            resumeData={resumeData}
            handleStyleChange={handleStyleChange}
          /></div>}
        </div>

        <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl bg-white/60 dark:bg-slate-800/50">
          <Header panelKey="spacing" label="Spacing" />
          {openPanel === 'spacing' && <div className={`${panelWrapClass} anim-fade-in-soft`} style={{ animationDelay: '105ms' }}><SpacingPanel
            resumeData={resumeData}
            handleStyleChange={handleStyleChange}
          /></div>}
        </div>

        <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl bg-white/60 dark:bg-slate-800/50">
          <Header panelKey="order" label="Section Order" />
          {openPanel === 'order' && <div className={`${panelWrapClass} anim-fade-in-soft`} style={{ animationDelay: '120ms' }}>
            <SectionOrderPanel
              resumeData={resumeData}
              handleStyleChange={handleStyleChange}
            />
          </div>}
        </div>
      </div>
    </div>
  )
})

StylePanel.displayName = "StylePanel"

export default StylePanel
