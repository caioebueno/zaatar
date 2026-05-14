import type { ReactNode } from "react";

export type PillVariant = "ontime" | "cooking" | "late" | "dispatched" | "draft";

type StatusPillProps = {
  variant: PillVariant;
  children: ReactNode;
};

const PILL_STYLES: Record<PillVariant, { bg: string; fg: string; dot: string }> = {
  ontime:     { bg: "#e6f7ee", fg: "#006e44", dot: "#00a866" },
  cooking:    { bg: "#fff3d6", fg: "#7a5a00", dot: "#c89500" },
  late:       { bg: "#ffe2da", fg: "#8a1c06", dot: "#ff3d14" },
  dispatched: { bg: "#16120f", fg: "#faf5ee", dot: "#ff3d14" },
  draft:      { bg: "#efe7da", fg: "#2a231e", dot: "#6c6259" },
};

export function StatusPill({ variant, children }: StatusPillProps) {
  const { bg, fg, dot } = PILL_STYLES[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: bg,
        color: fg,
        padding: "5px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: dot,
          flexShrink: 0,
        }}
      />
      {children}
    </span>
  );
}
