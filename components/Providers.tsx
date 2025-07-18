'use client'

import { ToastProvider } from '@/context/PopupContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
       <ToastProvider>
          {children}
        </ToastProvider>
  
  )
}