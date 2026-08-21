"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import type { CSSProperties, ReactNode } from "react";

/**
 * Themed dropdown menu built on Radix DropdownMenu. Handles portalling,
 * outside-click / Escape dismissal, and keyboard navigation — the trigger is
 * passed through `asChild`, so give it any button element you like.
 */
export function Menu({
  trigger,
  children,
  align = "end",
  side = "bottom",
  sideOffset = 6,
  width,
  open,
  onOpenChange,
  contentStyle,
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  width?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  contentStyle?: CSSProperties;
}) {
  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          side={side}
          sideOffset={sideOffset}
          className="zp-menu"
          style={{ padding: 8, width, maxHeight: 300, overflow: "auto", ...contentStyle }}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/**
 * A selectable row. `closeOnSelect={false}` keeps the menu open (e.g. for rows
 * that toggle rather than pick-and-dismiss).
 */
export function MenuItem({
  children,
  onSelect,
  disabled,
  closeOnSelect = true,
  style,
}: {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  closeOnSelect?: boolean;
  style?: CSSProperties;
}) {
  return (
    <DropdownMenu.Item
      className="zp-menu-hl"
      disabled={disabled}
      onSelect={(e) => {
        if (!closeOnSelect) e.preventDefault();
        onSelect?.();
      }}
      style={{ borderRadius: 6, cursor: "pointer", ...style }}
    >
      {children}
    </DropdownMenu.Item>
  );
}
