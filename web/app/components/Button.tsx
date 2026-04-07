import React from "react";
import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export default function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex cursor-pointer items-center justify-center rounded-xl font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-brandBackground text-white hover:bg-[#1C3A36] focus:ring-[#2A564F]",
    secondary:
      "bg-background text-text hover:bg-gray-100 hover:text-text focus:ring-gray-300",
    outline:
      "border border-[#B0B7B6] text-text hover:bg-gray-100 hover:text-text focus:ring-gray-300",
    ghost:
      "text-text hover:bg-gray-100 hover:text-text focus:ring-gray-300",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "text-lg font-bold py-3 px-4",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
