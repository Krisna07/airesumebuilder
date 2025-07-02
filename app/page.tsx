"use client";
import Link from "next/link";
import { ArrowRight, LogIn, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b">
        <div className="text-2xl font-bold text-gray-800">
        R
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard/builder" className="text-gray-600 hover:text-black">
            Builder
          </Link>
          {user && (
            <Link href="/dashboard" className="text-gray-600 hover:text-black">
              Dashboard
            </Link>
          )}
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Welcome, {user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-3 py-2 text-gray-600 hover:text-black transition-colors"
                  >
                    <User className="w-4 h-4 mr-1" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="flex items-center px-3 py-2 text-gray-600 hover:text-black transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </Link>
              )}
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
          Build Your Dream Resume, <br /> Powered by AI
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl">
          Effortlessly create a professional, ATS-friendly resume tailored to your dream job.
          Upload your current resume or start from scratch and let our AI do the heavy lifting.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/builder"
            className="group flex items-center justify-center px-8 py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-transform transform hover:scale-105"
          >
            Start Building for Free
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          {!user && !loading && (
            <Link
              href="/auth"
              className="group flex items-center justify-center px-8 py-4 border-2 border-black text-black rounded-lg font-semibold hover:bg-black hover:text-white transition-all"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Sign In
            </Link>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 border-t text-center text-gray-500">
        &copy; {new Date().getFullYear()} AI Resume Builder. All Rights Reserved.
      </footer>
    </div>
  );
}
