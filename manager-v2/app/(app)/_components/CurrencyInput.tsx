"use client";

import type { CSSProperties } from "react";

/** Up to $9,999,999.99 — keeps the cents integer well inside safe range. */
const MAX_DIGITS = 9;

/** "12.5" / "$1,250.00" / "abc" → "12.50" / "1250.00" / "0.00". */
export function toCurrencyString(value: string): string {
  const n = Number(String(value).replace(/[^0-9.]/g, ""));
  return (Number.isFinite(n) ? n : 0).toFixed(2);
}

/**
 * Cash-register style money field: digits only, filled from the cents up —
 * typing 1, 2, 5 shows 0.01 → 0.12 → 1.25, Backspace drops the last digit.
 * Value in and out is a plain "x.xx" string (dollars), so it drops into state
 * that already holds money as text.
 */
export function CurrencyInput({
  value,
  onChange,
  style,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  style?: CSSProperties;
  className?: string;
  ariaLabel?: string;
}) {
  const shown = toCurrencyString(value);
  return (
    <input
      value={shown}
      inputMode="numeric"
      className={className}
      aria-label={ariaLabel}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(-MAX_DIGITS);
        onChange((Number(digits || "0") / 100).toFixed(2));
      }}
      // The value only grows/shrinks at the right, so keep the caret there.
      onFocus={(e) => {
        const el = e.currentTarget;
        requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
      }}
      style={style}
    />
  );
}
