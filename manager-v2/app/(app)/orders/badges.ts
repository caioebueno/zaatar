import type { CSSProperties } from "react";
import { PAYMENT_COLORS, TYPE_COLORS, statusMeta } from "./data";

export type Badge = { badgeStyle: CSSProperties; dotStyle: CSSProperties; label: string };

function make(color: string, label: string, size?: "lg"): Badge {
  return {
    label,
    badgeStyle: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: size === "lg" ? "4px 10px" : "3px 8px",
      borderRadius: 9999,
      background: color + "1F",
      color,
      fontSize: size === "lg" ? 11.5 : 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
    },
    dotStyle: { width: 5, height: 5, borderRadius: 9999, background: color, flexShrink: 0 },
  };
}

export function statusBadge(status: string, canceled: boolean, size?: "lg"): Badge {
  const m = statusMeta(status, canceled);
  return make(m.color, m.label, size);
}

export function typeBadge(label: string): Badge {
  return make(TYPE_COLORS[label] ?? "#8A8B90", label);
}

export function paymentBadge(label: string): Badge {
  return make(PAYMENT_COLORS[label] ?? "#8A8B90", label);
}
