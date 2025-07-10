import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50">
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
            R
          </div>
          
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
