"use client"
import { usePathname } from "next/navigation"
import Navbar from "./Navbar"

/**
 * Conditional Navbar Component
 * 
 * Renders the global Navbar only on non-dashboard pages.
 * Dashboard pages (like /builder) use their own DashboardNav component
 * defined in their respective layouts.
 * 
 * This prevents double navigation bars and allows for different
 * navigation experiences between homepage and dashboard contexts.
 */
export default function ConditionalNavbar() {
  const pathname = usePathname()
  
  // Don't render Navbar on builder pages (they have their own DashboardNav)
  if (pathname?.startsWith("/builder")) {
    return null
  }
  
  return <Navbar />
}
