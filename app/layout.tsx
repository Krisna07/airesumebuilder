import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './global.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Resume Builder',
  description: 'Create a professional resume with the help of AI.',
  icons: {
    icon: '/icon.svg'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${inter.className} max-h-screen w-full  `}>
        <Providers>
          <Navbar />
          <main className='w-full min-h-[calc(100vh-4rem)]'>
            <section className='w-full min-[800px]:min-w-[800px] max-[800px]:h-full grid place-items-center '>{children}</section>
          </main>
        </Providers>
      </body>
    </html>
  );
}