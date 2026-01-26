import type React from "react"
import clsx from "clsx"
import { cva, type VariantProps } from "class-variance-authority"

interface ButtonProps extends VariantProps<typeof buttonStyles> {
  children: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  type?: "button" | "submit" | "reset"
  variant: "primary" | "secondary" | "success" | "danger" | "ghost"
  size: "small" | "medium" | "large"
  fullWidth?: boolean
  disabled?: boolean
  className?: string
}

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/25 hover:-translate-y-0.5",
        secondary:
          "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-teal-300 hover:text-teal-700 shadow-sm",
        success: "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-md shadow-emerald-500/20",
        danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-md shadow-red-500/20",
        ghost:
          "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-teal-600 dark:text-slate-300 dark:hover:bg-slate-700 shadow dark:shadow-[0_0_2px_0_white]",
      },
      size: {
        small: "text-xs px-3 py-1.5 h-8",
        medium: "text-sm px-4 py-2 h-10",
        large: "text-base px-6 py-2.5 h-12",
      },
      fullWidth: {
        true: "w-full",
        false: "w-fit",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "medium",
      fullWidth: false,
    },
  },
)

const Button: React.FC<ButtonProps> = ({ variant, size, fullWidth, children, className, disabled, ...props }) => {
  return (
    <button className={clsx(buttonStyles({ variant, size, fullWidth }), className)} disabled={disabled} {...props}>
      {children}
    </button>
  )
}

export default Button
