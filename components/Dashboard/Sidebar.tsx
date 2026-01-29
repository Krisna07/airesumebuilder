'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Settings, CreditCard, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

const Sidebar = () => {
    const pathname = usePathname()

    const links = [
        { href: '/builder', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/builder/resumes', label: 'My Resumes', icon: FileText },
        // { href: '/builder/cover-letters', label: 'Cover Letters', icon: Mail }, // Future
        { href: '/settings', label: 'Settings', icon: Settings },
        { href: '/billing', label: 'Billing', icon: CreditCard },
    ]

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl z-40 pt-24 pb-4 px-4">
            <div className="flex flex-col gap-2 flex-1">
                <div className="mb-6 px-2">
                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu</h2>
                </div>
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href || (link.href !== '/builder' && pathname?.startsWith(link.href))
                    
                    // Special case for dashboard root
                    const isExactDashboard = link.href === '/builder' && pathname === '/builder'
                    const isActiveLink = isExactDashboard || (link.href !== '/builder' && pathname?.startsWith(link.href))

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                                ${isActiveLink 
                                    ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActiveLink ? 'text-teal-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                            <span className="font-medium text-sm">{link.label}</span>
                        </Link>
                    )
                })}
            </div>

            <div className="mt-auto border-t border-gray-200 dark:border-slate-700 pt-4">
                <button 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium text-sm">Sign Out</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar
