"use client"
import { Edit, Plus, Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

interface MenuPanelProps {
  menu: boolean
  setShowConfirm: (show: boolean) => void
  menuRef: React.RefObject<HTMLDivElement | null>
  slug: string
}

const MenuPanel = (({ menuRef, menu, setShowConfirm, slug }: MenuPanelProps) => {
  const router = useRouter()

  const handleEdit = useCallback(() => {
    router.push(`/builder/${slug}`)
  }, [router, slug])

  const handleNew = useCallback(() => {
    router.push("/builder")
  }, [router])

  const handleDelete = useCallback(() => {
    setShowConfirm(true)
  }, [setShowConfirm])

  if (!menu) return null

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      ref={menuRef}
      className="shadow-lg dark:shadow-slate-700 p-3 rounded-xl grid gap-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700"
    >
      <button
        onClick={handleEdit}
        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium shadow-sm flex items-center gap-2"
      >
        <Edit size={16} /> Edit Resume
      </button>
      <button
        onClick={handleNew}
        className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium shadow-sm flex items-center gap-2"
      >
        <Plus size={16} /> New Resume
      </button>
      <button
        onClick={handleDelete}
        className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium shadow-sm flex items-center gap-2"
      >
        <Trash size={16} /> Delete
      </button>
    </div>
  )
})

export default MenuPanel
