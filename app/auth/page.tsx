'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthForm from '@/components/AuthForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const searchParams = useSearchParams()
  const error = searchParams?.get('error')

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
  }

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'oauth_error':
        return 'There was an error with OAuth authentication. Please try again.'
      case 'no_code':
        return 'Authentication code not received. Please try again.'
      default:
        return null
    }
  }

  const errorMessage = getErrorMessage(error)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center">
        <Link 
          href="/" 
          className="flex items-center text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errorMessage}</p>
            </div>
          )}
          <AuthForm mode={mode} onToggleMode={toggleMode} />
        </div>
      </div>
    </div>
  )
}
