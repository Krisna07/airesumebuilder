import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './global.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import { ToastContainer } from 'react-toastify';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Resume Craft',
  description: 'Build and Taylor your job search process with AI',
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' data-scroll-behavior="smooth">
      <body className={`${inter.className} w-full min-h-screen  relative text-neutral-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-50 scroll-smooth`}>
        <ToastContainer />
        <Providers>
          <Navbar />
          <main className='w-full'>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}