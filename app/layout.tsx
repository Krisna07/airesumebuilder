import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './global.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Resume Builder',
  description: 'Create a professional resume with the help of AI.'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${inter.className} w-full m-[0_auto] place-items-center`}>
        <Providers>
          <Navbar />
          <section className='w-full  grid place-items-center'>{children}</section>
        </Providers>
      </body>
    </html>
  );
}