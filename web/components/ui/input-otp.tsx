"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

type InputOTPProps = {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  className?: string
}

export function InputOTP({
  value,
  onChange,
  length = 6,
  disabled,
  className,
}: InputOTPProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([])

  const normalized = React.useMemo(() => {
    const digits = value.replace(/\D/g, "")
    return digits.slice(0, length)
  }, [value, length])

  const slots = React.useMemo(
    () => Array.from({ length }, (_, index) => normalized[index] ?? ""),
    [length, normalized],
  )

  const focusIndex = React.useCallback((index: number) => {
    const nextIndex = Math.max(0, Math.min(length - 1, index))
    refs.current[nextIndex]?.focus()
    refs.current[nextIndex]?.select()
  }, [length])

  const setDigit = React.useCallback(
    (index: number, nextDigit: string) => {
      const next = slots.slice()
      next[index] = nextDigit
      onChange(next.join(""))
    },
    [onChange, slots],
  )

  return (
    <div
      data-slot="input-otp"
      className={cn("flex flex-row items-center gap-2 w-full", className)}
      onPaste={(event) => {
        event.preventDefault()
        if (disabled) return

        const pasted = event.clipboardData.getData("text").replace(/\D/g, "")
        if (!pasted) return

        onChange(pasted.slice(0, length))

        const nextIndex = Math.min(pasted.length, length - 1)
        requestAnimationFrame(() => {
          focusIndex(nextIndex)
        })
      }}
    >
      {slots.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element
          }}
          value={digit}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          maxLength={1}
          onFocus={(event) => {
            event.currentTarget.select()
          }}
          onChange={(event) => {
            if (disabled) return

            const nextValue = event.currentTarget.value.replace(/\D/g, "")
            if (!nextValue) {
              setDigit(index, "")
              return
            }

            const nextDigit = nextValue[nextValue.length - 1]
            setDigit(index, nextDigit)

            if (index < length - 1) {
              focusIndex(index + 1)
            }
          }}
          onKeyDown={(event) => {
            if (disabled) return

            if (event.key === "Backspace") {
              if (digit) {
                setDigit(index, "")
                return
              }

              if (index > 0) {
                event.preventDefault()
                setDigit(index - 1, "")
                focusIndex(index - 1)
              }
              return
            }

            if (event.key === "ArrowLeft" && index > 0) {
              event.preventDefault()
              focusIndex(index - 1)
              return
            }

            if (event.key === "ArrowRight" && index < length - 1) {
              event.preventDefault()
              focusIndex(index + 1)
            }
          }}
          className={cn(
            "h-14 w-14 flex-1 rounded-xl  bg-foreground text-center text-lg font-semibold text-text outline-none transition",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-brandBackground",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
      ))}
    </div>
  )
}
