'use client'
import { ToastProvider } from '@/context/PopupContext'
import { AuthProvider } from '@/context/authContext';
import { ThemeProvider } from '@/context/themeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}