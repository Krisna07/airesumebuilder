'use client'
import { ToastProvider } from '@/context/PopupContext'
import { AuthProvider } from '@/context/authContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  );
}