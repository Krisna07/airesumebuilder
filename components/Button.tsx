import React from "react";
import clsx from "clsx";
import { cva } from "class-variance-authority";
import { VariantProps } from "class-variance-authority";

interface ButtonProps extends VariantProps<typeof buttonStyles> {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant: "primary" | "secondary" | "success" | "danger";
  size: "small" | "medium" | "large";
  fullWidth?: boolean;
  disabled?: boolean;
}

const buttonStyles = cva(
  "px-[16px] py-[4px] h-fit rounded-lg transition-all ease-in-out duration-300 font-semibold shadow-md flex items-center gap-1",
  {
    variants: {
      variant: {
        primary: "bg-gray-900  hover:bg-gray-700 text-white",
        secondary: "bg-gray-100 text-black hover:bg-gray-300 ",
        success:
          "bg-green-500 text-white hover:bg-green-600 uppercase text-gray-900",
        danger: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        small: "text-[12px]",
        medium: "text-[14px]",
        large: "text-[16px]",
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
  }
);

const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  fullWidth,
  children,
  ...props
}) => {
  return (
    <button
      className={clsx(buttonStyles({ variant, size, fullWidth }))}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
