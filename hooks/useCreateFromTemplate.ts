"use client"

import { useState } from 'react';
import { useAuth } from '@/context/authContext';
import { LocalResumeService } from '@/services/localResumeService';
import { ResumeService } from '@/services/resumeServices';
import { useToast } from '@/context/PopupContext';

/** Creates a resume from a template name and redirects into the builder (guest or signed-in). */
export function useCreateFromTemplate() {
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null)
  const { user } = useAuth()
  const { showToast } = useToast()

  async function createFromTemplate(template: string): Promise<void> {
    setCreatingTemplate(template)

    if (!user) {
      LocalResumeService.create(undefined, undefined, template)
      window.location.href = '/builder/guest-resume'
      return
    }

    try {
      const response = await ResumeService.create(user.id, template)
      const data = await response.json()

      if (!response.ok) {
        showToast(data.message || response.statusText, 'error')
        return
      }

      showToast("Resume created successfully", 'success')
      window.location.href = `/builder/resumes/${data.data.id}`
    } catch (err) {
      console.error("Error creating resume:", err)
      showToast("Error creating resume", 'error')
    } finally {
      setCreatingTemplate(null)
    }
  }

  return { creatingTemplate, createFromTemplate }
}
