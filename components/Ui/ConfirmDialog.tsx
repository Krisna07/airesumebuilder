"use client"
import type React from "react"
import { useEffect, useCallback } from "react"
import Button from "./Button"

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message?: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  variant?: "danger" | "warning" | "info"
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  variant = "danger",
}) => {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !loading) onCancel()
    },
    [open, loading, onCancel],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [handleEscape])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  if (!open) return null

  const variantStyles = {
    danger: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    warning: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    info: "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800",
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={`w-full max-w-sm rounded-xl bg-white dark:bg-slate-800 shadow-xl border overflow-hidden animate-scale-in ${variantStyles[variant]}`}
      >
        <div className="p-5 space-y-3">
          <h2 id="dialog-title" className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {title}
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-300">{message}</div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="small" className="flex-1" onClick={onCancel} disabled={loading}>
              {cancelText}
            </Button>
            <Button
              variant={variant === "info" ? "primary" : "danger"}
              size="small"
              className={`flex-1 ${loading ? "animate-pulse" : ""}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Processing..." : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
