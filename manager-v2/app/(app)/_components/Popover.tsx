"use client";

import * as RPopover from "@radix-ui/react-popover";
import type { CSSProperties, ReactNode } from "react";

/**
 * Themed popover built on Radix Popover. Use for rich anchored panels that a
 * menu can't host — anything with inputs, calendars, or custom layout. Handles
 * portalling, outside-click / Escape dismissal, and positioning.
 *
 * Controlled (`open` + `onOpenChange`) or uncontrolled. Content padding is left
 * to the caller so panels keep their own bespoke spacing.
 */
export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  align = "start",
  side = "bottom",
  sideOffset = 8,
  width,
  contentStyle,
  onlyContentStyle,
}: {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  width?: number | string;
  contentStyle?: CSSProperties;
  /** Skip the default `.zp-menu` surface (border/bg/shadow) — caller styles all. */
  onlyContentStyle?: boolean;
}) {
  return (
    <RPopover.Root open={open} onOpenChange={onOpenChange}>
      <RPopover.Trigger asChild>{trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content
          align={align}
          side={side}
          sideOffset={sideOffset}
          className={onlyContentStyle ? undefined : "zp-menu"}
          style={{ width, ...contentStyle }}
        >
          {children}
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  );
}

export const PopoverClose = RPopover.Close;
