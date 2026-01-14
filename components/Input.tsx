"use client"

import type React from "react"
import clsx from "clsx"

interface InputProps {
  type?: string
  name?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  label?: string | boolean
  disabled?: boolean
  error?: string
  className?: string
  id?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBlur?: (e: any) => void | undefined
}

const Input: React.FC<InputProps> = ({
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  required,
  label,
  onBlur,
  disabled,
  error,
  className,
  id,
}) => {
  const inputId = id || name || placeholder?.toLowerCase().replace(/\s+/g, "-")

  return (
    <div className="w-full grid gap-1.5 transition-all ease-in-out text-sm">
      {label !== false && (
        <label htmlFor={inputId} className="font-medium text-slate-700 dark:text-slate-200 px-0.5">
          {typeof label === "string" ? label : placeholder}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        name={name}
        onBlur={onBlur}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={clsx(
          "w-full px-3 py-2 rounded-lg border transition-all duration-200 ease-in-out",
          "bg-white dark:bg-slate-900",
          "text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
          "border-slate-200 dark:border-slate-700",
          "focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500",
          "hover:border-slate-300 dark:hover:border-slate-600",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50",
          error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
          className,
        )}
      />
      {error && <p className="text-xs text-red-500 px-0.5">{error}</p>}
    </div>
  )
}

export default Input
