"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import UniversalImage from "./UI/UniversalImage"
import { FaDashcube, FaUser } from "react-icons/fa6"
import { useAuth } from "@/context/authContext"
import { LogIn, LogOut, Moon, Sun } from "lucide-react"
import { usePathname } from "next/navigation"

const Navbar = () => {
  const [menu, setMenu] = useState<boolean>(false)
  const { user, logOut } = useAuth()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const route = usePathname()
  const [activeTab, setActivetab] = useState<string>("")
  // avoid reading `window` during SSR — sync theme on mount
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    setMounted(true)
    const stored = localStorage.getItem("theme")
    if (stored) {
      const next = stored === "dark"
      document.documentElement.classList.toggle("dark", next)
      setIsDark(next)
      return
    }

    // if no stored preference, prefer current document class or OS preference
    const hasClass = document.documentElement.classList.contains("dark")
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    setIsDark(hasClass || prefersDark)
  }, [])
  console.log(mounted)
  useEffect(() => {
    setActivetab(route ?? "")
    setMenu(false)
  }, [route])

  const toggleTheme = () => {
    if (typeof window === "undefined") return

    setIsDark((prev) => {
      const next = !prev
      const root = document.documentElement
      root.classList.toggle("dark", next)

      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (next === prefersDark) {
        localStorage.removeItem("theme")
      } else {
        localStorage.setItem("theme", next ? "dark" : "light")
      }
      return next
    })
  }

  useEffect(() => {
    if (!menu) return
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return
      const target = event.target as HTMLElement
      if (!menuRef.current.contains(target)) {
        setMenu(false)
      }
    }
    const handleScroll = () => setMenu(false)
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("scroll", handleScroll)
    }
  }, [menu])

  const userImage = user?.image

  return (
    <nav className="w-full grid place-items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 z-50 transition-colors duration-200">
      <div className="min-[800px]:w-[800px] w-full p-3 px-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md shadow-teal-500/20">
            <UniversalImage
              src="/icon.svg"
              alt="AI Resume Builder"
              width={24}
              height={24}
              className="brightness-0 invert"
            />
          </div>
          <span className="font-semibold text-slate-800 dark:text-white hidden sm:block">ResumeAI</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-6">
          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "/"
                  ? "text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400"
                  : "text-slate-600 hover:text-teal-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
            >
              Home
            </Link>
            <Link
              href="/builder"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab.includes("builder")
                  ? "text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400"
                  : "text-slate-600 hover:text-teal-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
            >
              Builder
            </Link>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            aria-pressed={isDark}
            onClick={toggleTheme}
            className="relative flex items-center w-14 h-7 rounded-full bg-slate-200 dark:bg-slate-700 p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            <Sun
              className={`w-4 h-4 absolute z-20 left-1.5 transition-opacity duration-200 ${isDark ? "dark:opacity-50 dark:text-slate-400" : "opacity-100 text-amber-500"}`}
            />
            <Moon
              className={`w-4 h-4 absolute z-20 right-1.5 transition-opacity duration-200 ${isDark ? "opacity-100 text-teal-400" : "opacity-50 text-slate-400"}`}
            />
            <div
              className={`w-5 h-5 rounded-full z-10 bg-white shadow-sm transition-transform duration-200 ${isDark ? "translate-x-7" : "translate-x-0"}`}
            />
          </button>

          {/* User Menu */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menu}
              aria-label="User menu"
              onClick={() => setMenu((prev) => !prev)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent hover:border-teal-300 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              {user ? (
                <UniversalImage
                  src={`${userImage}`}
                  className="w-full h-full rounded-full object-cover"
                  alt="user_profile_picture"
                  width={32}
                  height={32}
                />
              ) : (
                <FaUser className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
            </button>

            {/* Dropdown */}
            {menu && (
              <div
                className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pop"
                role="menu"
              >
                {/* User Info */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center  font-semibold">
                      {user ? user.name?.charAt(0).toUpperCase() : "G"}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white text-sm">
                        {user ? user.name : "Guest User"}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border border-dashed border-teal-300 dark:border-teal-600">
                        {user ? "Member" : "Free"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  {user && (
                    <Link
                      href="/builder"
                      className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      onClick={() => setMenu(false)}
                    >
                      <FaDashcube className="w-4 h-4 text-teal-500" />
                      Dashboard
                    </Link>
                  )}
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    role="menuitem"
                    onClick={() => {
                      if (user) logOut()
                      else window.location.href = "/auth/signin"
                      setMenu(false)
                    }}
                  >
                    {user ? (
                      <>
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign out</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 text-teal-500" />
                        <span>Sign in</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
