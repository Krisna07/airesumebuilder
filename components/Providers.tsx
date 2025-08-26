'use client'
import { ToastProvider } from '@/context/PopupContext'
import { AuthProvider } from '@/context/authContext';
import { ThemeProvider } from '@/context/themeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}