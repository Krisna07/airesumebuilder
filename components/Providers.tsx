'use client'
import { ToastProvider } from '@/context/PopupContext'
import { AuthProvider } from '@/context/authContext';
import { ThemeProvider } from '@/context/themeContext';
import { SessionProvider } from "next-auth/react";
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'

export default function Providers({ children }: { children: React.ReactNode }) {

  return (
    <ThemeProvider>
    <ToastProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
              {children}
          </AuthProvider>
        </QueryClientProvider>
      </SessionProvider>
    </ToastProvider>
    </ThemeProvider>
  );
}