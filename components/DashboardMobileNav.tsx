"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { LayoutDashboard, FileText, Settings } from "lucide-react"
import { usePathname } from "next/navigation"

/**
 * Dashboard Mobile Navigation Component
 * 
 * Fixed bottom navigation bar for mobile devices with liquid glass effect.
 * Features:
 * - Always visible at bottom of screen on mobile
 * - Animated liquid glass indicator for active tab
 * - Icon + label for each navigation item
 * - Smooth transitions and hover effects
 * - Dark mode support
 */
const DashboardMobileNav = () => {
  const route = usePathname()
  const [activeTab, setActiveTab] = useState<string>("")

  useEffect(() => {
    setActiveTab(route ?? "")
  }, [route])

  return (
    <div className="sm:hidden fixed left-0 right-0 bottom-0 z-50" style={{ position: 'fixed' }}>
      <div className="liquidGlass-wrapper backdrop-blur-[2px] w-full grid grid-cols-3 place-items-center relative shadow-lg dark:bg-gray-800/95 bg-gray-200/95 p-3 overflow-hidden border-t border-slate-300 dark:border-slate-600">
        
        {/* THE LIQUID GLASS INDICATOR */}
        <div 
          className="liquidGlass-wrapper rounded-full absolute transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
          style={{
            width: '64px',
            height: '72%',
            zIndex: 5,
            left: activeTab === "/builder" 
              ? 'calc(12px + ((100% - 24px) / 3) * 0.5)'
              : activeTab.includes("/builder/resumes")
              ? 'calc(12px + ((100% - 24px) / 3) * 1.5)'
              : activeTab.includes("/builder/settings")
              ? 'calc(12px + ((100% - 24px) / 3) * 2.5)'
              : 'calc(12px + ((100% - 24px) / 3) * 0.5)',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 1,
          }}
        >
          <div className="liquidGlass-effect"></div>
          <div className="liquidGlass-tint"></div>
          <div className="liquidGlass-shine"></div>
        </div>

        {/* Dashboard Link */}
        <Link
          href="/builder"
          className="relative z-10 h-12 w-full grid place-items-center"
        >
          <div className="flex flex-col items-center gap-1">
            <LayoutDashboard 
              className={`h-5 w-5 transition-all duration-300 ${
                activeTab === "/builder"
                  ? "text-teal-600 dark:text-teal-400 scale-110"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            />
            <span className={`text-[10px] font-medium transition-all duration-300 ${
              activeTab === "/builder"
                ? "text-teal-600 dark:text-teal-400"
                : "text-slate-600 dark:text-slate-400"
            }`}>
              
            </span>
          </div>
        </Link>

        {/* My Resumes Link */}
        <Link
          href="/builder/resumes"
          className="relative z-10 h-12 w-full grid place-items-center"
        >
          <div className="flex flex-col items-center gap-1">
            <FileText 
              className={`h-5 w-5 transition-all duration-300 ${
                activeTab.includes("/builder/resumes")
                  ? "text-teal-600 dark:text-teal-400 scale-110"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            />
            <span className={`text-[10px] font-medium transition-all duration-300 ${
              activeTab.includes("/builder/resumes")
                ? "text-teal-600 dark:text-teal-400"
                : "text-slate-600 dark:text-slate-400"
            }`}>
              
            </span>
          </div>
        </Link>

        {/* Settings Link */}
        <Link
          href="/builder/settings"
          className="relative z-10 h-12 w-full grid place-items-center"
        >
          <div className="flex flex-col items-center gap-1">
            <Settings 
              className={`h-5 w-5 transition-all duration-300 ${
                activeTab.includes("/builder/settings")
                  ? "text-teal-600 dark:text-teal-400 scale-110"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            />
            <span className={`text-[10px] font-medium transition-all duration-300 ${
              activeTab.includes("/builder/settings")
                ? "text-teal-600 dark:text-teal-400"
                : "text-slate-600 dark:text-slate-400"
            }`}>
              
            </span>
          </div>
        </Link>

        {/* SVG FILTER DEFINITION */}
        <svg className="absolute w-0 h-0 pointer-events-none">
          <filter id="glass-distortion-dashboard">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" seed="5" />
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feDisplacementMap in="SourceGraphic" in2="blur" scale="25" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      </div>
    </div>
  )
}

export default DashboardMobileNav
