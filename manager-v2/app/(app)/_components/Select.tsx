"use client";

import * as RSelect from "@radix-ui/react-select";
import type { CSSProperties, ReactNode } from "react";

export type SelectOption = { value: string; label: string };

/**
 * Themed single-choice dropdown built on Radix Select. Drop-in replacement for
 * a native `<select>`: pass `value`, `onValueChange`, and `options`. The
 * `triggerStyle` matches whatever the call site used for its native control.
 */
export function Select({
  value,
  onValueChange,
  options,
  triggerStyle,
  ariaLabel,
  placeholder,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  triggerStyle?: CSSProperties;
  ariaLabel?: string;
  placeholder?: string;
}) {
  return (
    <RSelect.Root value={value} onValueChange={onValueChange}>
      <RSelect.Trigger
        aria-label={ariaLabel}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          height: 32,
          padding: "0 10px",
          background: "#2F2F2F",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6,
          fontFamily: "var(--font-body)",
          fontSize: 12.5,
          color: "#F1F1F2",
          cursor: "pointer",
          outline: "none",
          boxSizing: "border-box",
          ...triggerStyle,
        }}
      >
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon>
          <Chevron />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          className="zp-menu"
          style={{ minWidth: "var(--radix-select-trigger-width)", maxHeight: "var(--radix-select-content-available-height)" }}
        >
          <RSelect.Viewport style={{ padding: 6 }}>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}

function SelectItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <RSelect.Item value={value} className="zp-menu-item">
      <RSelect.ItemText>{children}</RSelect.ItemText>
      <RSelect.ItemIndicator style={{ position: "absolute", right: 9, display: "inline-flex" }}>
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5L4.5 8.5L11 1.5" stroke="#FF7A44" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </RSelect.ItemIndicator>
    </RSelect.Item>
  );
}

function Chevron() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}>
      <path d="M1 1L5 5L9 1" stroke="#75767C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
