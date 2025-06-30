'use client'

import ResumeList from '@/components/ResumeList'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          
          <div className="text-xl font-bold text-gray-900">
            AI Resume Builder
          </div>
          
          <Link 
            href="/builder" 
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            New Resume
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <ResumeList />
      </main>
    </div>
  )
}
