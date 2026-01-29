"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LucideIcon } from "lucide-react"

interface TabOption {
  id: string
  label: string
  icon?: LucideIcon
}

interface AnimatedTabsProps {
  tabs: TabOption[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export const AnimatedTabs = ({ tabs, activeTab, onChange, className = "" }: AnimatedTabsProps) => {
  return (
    <div className={`flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors z-10 
              ${isActive ? "text-teal-700 dark:text-teal-400" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}
          >
            {isActive && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-sm border border-slate-200 dark:border-slate-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                style={{ zIndex: -1 }}
              />
            )}
            {Icon && <Icon size={16} />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
