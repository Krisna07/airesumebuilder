
import dummyResume from './../../app/data/dummyResume.json'
import ResumePreview from '../Templates/ResumePreview';
import Button from '../Ui/Button';

import { ArrowRight, Check } from 'lucide-react';
;
import { useAuth } from '@/context/authContext';
import { LocalResumeService } from '@/services/localResumeService';
import { ResumeService } from '@/services/resumeServices';
import { useState } from 'react';
import { useToast } from '@/context/PopupContext';


const TemplateSlider = () => {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockResume: any = {
    ...dummyResume
  }
  const templates = [
    {
      id: "professional",
      name: "Professional",
      description: "Clean and corporate, perfect for traditional industries.",
      tags: ["ATS-Friendly", "Corporate"],
      color: "bg-slate-800",
    },
    {
      id: "modern",
      name: "Modern",
      description: "Contemporary design with a creative edge.",
      tags: ["Creative", "Stylish"],
      color: "bg-teal-600",
    },
    {
      id: "minimal",
      name: "Minimal",
      description: "Simple and elegant, lets your content shine.",
      tags: ["Clean", "Simple"],
      color: "bg-slate-600",
    },
    {
      id: "executive",
      name: "Executive",
      description: "Sophisticated layout for senior positions.",
      tags: ["Leadership", "Premium"],
      color: "bg-slate-900",
    }
  ]
  const { user } = useAuth()
  const { showToast } = useToast()
  const [creating, setCreating] = useState<boolean>(false)
  const handleCreateResume = async (template: string) => {
    setCreating(true)
    const loggedInUser = user
    if (!loggedInUser) {
      LocalResumeService.create(undefined, undefined, template)
      window.location.href = ('/builder/guest-resume')
      setCreating(false)
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
      window.location.href = (`/builder/${data.data.id}`)
    } catch (err) {
      console.error("Error creating resume:", err)
      showToast("Error creating resume", 'error')
    } finally {
      setCreating(false)
    }
  }


  return (
    <div className='w-full md:grid flex md:grid-cols-3 p-2 gap-2 space-y-2 md:overflow-hidden overflow-x-scroll hide-scrollbar rounded-xl'>
      {templates.map((template) => (
        <div
          key={template.id}
          className="group relative"
          onMouseEnter={() => setHoveredTemplate(template.id)}
          onMouseLeave={() => setHoveredTemplate(null)}
        >
          {/* Template Preview */}
          <div
            className={`rounded-xl p-2 bg-white shadow relative overflow-hidden transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl h-[320px] sm:h-[360px] md:h-[420px]`}
          >


            <ResumePreview
              resumeData={mockResume}
              template={template.name}
              className='p-0! w-full h-full aspect-3/4! pointer-events-none rounded'
            />

            <div
              className={`absolute inset-0 bg-teal-600/20 flex items-center justify-center transition-opacity duration-300 ${hoveredTemplate === template.id || creating ? "opacity-100" : "opacity-0"}`}
            >
              <div onClick={() => handleCreateResume(template.name)}>
                <Button variant="primary" size="small" >
                  {creating ? "Creating" : ' Use Template'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Template Info */}
          < div className="mt-4" >
            <h3 className="font-semibold text-slate-900 dark:text-white">{template.name}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{template.description}</p>

            {/* Tags */}
            < div className="flex flex-wrap items-center justify-center gap-2 mt-3" >
              {
                template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                  >
                    <Check className="w-3 h-3" />
                    {tag}
                  </span>
                ))
              }
            </div>
          </div >
        </div >))
      }
    </div>
  );
};

export default TemplateSlider;