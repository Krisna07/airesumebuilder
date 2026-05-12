"use client"
import { memo, useCallback } from "react"
import Link from "next/link"

interface Template {
  id: string
  name: string
}

interface TemplatesPanelProps {
  displayTemplate: Template[]
  selectedTemplate: string
  templatesRef: React.RefObject<HTMLDivElement | null>
  handleTemplateChange: (templateId: string) => void
  user: { id: string } | null
}

const TemplatesPanel = memo(({ templatesRef, displayTemplate, selectedTemplate, handleTemplateChange, user }: TemplatesPanelProps) => {

  const createClickHandler = useCallback(
    (templateId: string) => () => handleTemplateChange(templateId),
    [handleTemplateChange],
  )

  return (
        <div
          onClick={(e) => e.stopPropagation()}
          ref={templatesRef}
          className="w-full space-y-2 z-110 px-3 rounded-2xl pb-4 mb-4 shadow-lg dark:shadow-slate-700 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
        >
          <div className="w-full grid gap-4">
            <div className="font-bold py-3 text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700">
              Preview Template
            </div>
            <div className="grid min-[1000px]:grid-cols-2 gap-2">
              {displayTemplate.map((template) => {
                const isSelected = selectedTemplate === template.id
                return (
                  <button
                    key={template.id}
                    onClick={createClickHandler(template.id)}
                    className={`md:p-3 p-2 rounded-lg border-2 transition-all duration-200 text-left 
                      ${isSelected
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30 shadow-lg"
                      : "border-gray-200/50 dark:border-slate-600 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md bg-white dark:bg-slate-700"
                      }`}
                  >
                    <div className="flex items-center gap-3 justify-left">
                      <h3
                        className={`text-sm font-medium ${isSelected ? "text-teal-700 dark:text-teal-300" : "text-gray-800 dark:text-gray-200"}`}
                      >
                        {template.name}
                      </h3>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {!user && (
            <div className="w-full flex flex-col gap-2 items-center justify-center pt-3 border-t border-gray-100 dark:border-slate-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please{" "}
                <Link
                  href="/auth/signin"
                  className="text-teal-600 dark:text-teal-400 underline hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                >
                  sign in
                </Link>{" "}
                to access more templates
              </p>
            </div>
          )}
        </div>
  )
},
)
TemplatesPanel.displayName = "TemplatesPanel"

export default TemplatesPanel
