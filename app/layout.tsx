import './globals.css';
import { ReactNode } from 'react';

// /Users/kpaudel/Personal/airesumebuilder/app/layout.tsx


export const metadata = {
    title: 'AI Resume Builder',
    description: 'Build your resume effortlessly with AI',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}