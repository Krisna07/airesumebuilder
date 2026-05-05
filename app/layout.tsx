import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './global.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import { ToastContainer } from 'react-toastify';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Free AI Resume Builder | Craft Your Resume in Minutes',
  description: 'Build, tailor, and optimize your resume for free with our AI-powered resume builder. Get past ATS systems and land your dream job faster.',
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var v = localStorage.getItem('theme');
                  if (v === 'dark' || (!v && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className={`${inter.className} w-full min-h-screen relative text-neutral-900 transition-colors duration-200 dark:bg-neutral-950 dark:text-neutral-50 scroll-smooth overflow-x-hidden`}>
        {/* Global SVG filter for glass distortion used by mobile slider */}
        <svg style={{ display: 'none' }} aria-hidden>
          <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
            <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="1" seed="5" result="turbulence" />
            <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
            <feDisplacementMap in="SourceGraphic" in2="softMap" scale="50" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <ToastContainer />
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className='w-full flex-1'>
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}