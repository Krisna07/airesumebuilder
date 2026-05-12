import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

interface AuthLayoutProps {
  children: ReactNode
}


export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-teal-900/20 dark:to-purple-900/20">
     
      {/* Dot Pattern Overlay */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />

      <div className="absolute z-20 top-6 px-4 flex justify-center">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-xl border border-white/30 dark:border-slate-700/50 hover:scale-105 transition-all duration-300 hover:shadow-2xl"
        >
          <div className="w-full shadow-lg shadow-teal-500/40 rounded-lg">
            <Image
              src='/icon.svg'
              alt="AI Resume Builder"
              width={32}
              height={32}
            />
          </div>
        
        </Link>
      </div>
      <div className="w-full relative z-10 min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-0">

            <div className="w-full relative z-10 ">
              {children}
            </div>

      </div>

      {/* Animated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-teal-500/5 to-transparent animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
    </div>
  )
}
