'use client'
import { ToastProvider } from '@/context/PopupContext'
import { AuthProvider } from '@/context/authContext';
import { ThemeProvider } from '@/context/themeContext';
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,

    },
  },
});
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
        </QueryClientProvider>
      </SessionProvider>
    </ToastProvider>
  );
}