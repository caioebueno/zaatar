"use client";

import React, { forwardRef } from "react";

type TextInputProps = {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {/* Label */}
        {label && (
          <label className="text-[16px] font-semibold text-neutral-700">
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div
          className={`flex items-center rounded-xl bg-foreground text-lg px-3 transition border-2
            ${
              error
                ? "border-red-500 focus-within:border-brandBackground"
                : "border-foreground focus-within:border-brandBackground"
            }
            ${props.disabled ? "opacity-50" : ""}
          `}
        >
          {/* Left icon */}
          {leftIcon && <div className="mr-2 text-neutral-500">{leftIcon}</div>}

          {/* Input */}
          <input
            ref={ref}
            {...props}
            className={`w-full py-3 outline-none bg-transparent text-lg ${className}`}
          />

          {/* Right icon */}
          {rightIcon && <div className="ml-2 text-neutral-500">{rightIcon}</div>}
        </div>

        {/* Helper / Error */}
        {error ? (
          <p className="text-[16px] font-medium text-red-500">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-neutral-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export default TextInput;
