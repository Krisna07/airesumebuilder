
"use client"

import dummyResume from './../../app/data/dummyResume.json'
import ResumePreview from '../Templates/ResumePreview';
import Button from '../Ui/Button';

import { ArrowRight, Check } from 'lucide-react';
import { useAuth } from '@/context/authContext';
import { LocalResumeService } from '@/services/localResumeService';
import { ResumeService } from '@/services/resumeServices';
import { useState } from 'react';
import { useToast } from '@/context/PopupContext';
import Templates from '../Templates/templates';


const TemplateSlider = () => {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockResume: any = {
    ...dummyResume
  }


  const templates = Templates.slice(0, 6)

  const { user } = useAuth()
  const { showToast } = useToast()
  const handleCreateResume = async (template: string) => {
    setCreatingTemplate(template)
    const loggedInUser = user
    if (!loggedInUser) {
      LocalResumeService.create(undefined, undefined, template)
      window.location.href = ('/builder/guest-resume')
      return
    }

    try {
      const response = await ResumeService.create(loggedInUser.id, template)
      const data = await response.json()

      if (!response.ok) {
        showToast(data.message || response.statusText, 'error')
        return
      }

      showToast("Resume created successfully", 'success')
      window.location.href = (`/builder/resumes/${data.data.id}`)
    } catch (err) {
      console.error("Error creating resume:", err)
      showToast("Error creating resume", 'error')
    } finally {
      setCreatingTemplate(null)
    }
  }


  return (
    <div className='w-full lg:grid flex md:grid-cols-3 p-2 gap-2 space-y-2 lg:overflow-hidden overflow-x-scroll hide-scrollbar rounded-xl'>
      {templates.map((template) => {
        const isHovered = hoveredTemplate === template.id
        const isCreating = creatingTemplate === template.name

        return (
          <div
            key={template.id}
            className="group relative w-60 shrink-0 sm:w-[300px] md:w-auto md:min-w-0"
            onMouseEnter={() => setHoveredTemplate(template.id)}
            onMouseLeave={() => setHoveredTemplate(null)}
          >
            <div
              className="relative h-80 overflow-hidden rounded-xl bg-white p-2 shadow transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl sm:h-[360px] md:h-[420px]"
            >
              <ResumePreview
                resumeData={mockResume}
                template={template.name}
                deferUntilVisible
                className='pointer-events-none h-full w-full rounded p-0! aspect-3/4!'
              />

              <div
                className={`absolute inset-0 flex items-center justify-center rounded-xl bg-teal-600/20 transition-opacity duration-300 ${isHovered || isCreating ? "opacity-100" : "opacity-0"}`}
              >
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => handleCreateResume(template.name)}
                >
                  {isCreating ? "Creating" : 'Use Template'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 text-center">
              <h3 className="font-semibold text-slate-900 dark:text-white">{template.name}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{template.description}</p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {template?.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                  >
                    <Check className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  );
};

export default TemplateSlider;