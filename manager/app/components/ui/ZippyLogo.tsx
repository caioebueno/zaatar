import type { CSSProperties } from "react";

// ── Pulse mark (Section 02 · Option A) ──────────────────────────────────────
// Square center dot (rx 8) with two concentric arcs — reads as live dispatch/ping.
// viewBox 0 0 100 100 so it scales cleanly at any size.

type MarkProps = {
  size?: number;
  bg?: string;
  fg?: string;
  radius?: number;
  style?: CSSProperties;
};

export function MarkPulse({ size = 64, bg = "#ff3d14", fg = "#faf5ee", radius = 18, style }: MarkProps) {
  const cx = 50;
  const cy = 60;
  const dotSize = 18;
  const dotRx = 8;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      style={{ display: "block", flexShrink: 0, ...style }}
      aria-hidden
    >
      {/* badge background */}
      <rect width="100" height="100" rx={radius} fill={bg} />

      {/* outer arc — low opacity */}
      <path
        d="M18 60 A 32 32 0 0 1 82 60"
        stroke={fg}
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.25"
      />

      {/* inner arc */}
      <path
        d="M28 60 A 22 22 0 0 1 72 60"
        stroke={fg}
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* center square dot */}
      <rect
        x={cx - dotSize / 2}
        y={cy - dotSize / 2}
        width={dotSize}
        height={dotSize}
        rx={dotRx}
        fill={fg}
      />
    </svg>
  );
}

// ── Wordmark ─────────────────────────────────────────────────────────────────
// "Zippy" in Geist 700 with a custom orange square dot painted over the dotless-i.

type WordmarkProps = {
  size?: number;
  color?: string;
  dot?: string;
};

export function ZippyWordmark({ size = 56, color = "#16120f", dot = "#ff3d14" }: WordmarkProps) {
  return (
    <span
      style={{
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.045em",
        lineHeight: 1,
        color,
        display: "inline-flex",
        alignItems: "baseline",
        userSelect: "none",
      }}
    >
      Z
      {/* dotless-i (ı U+0131) so we can paint our own square dot */}
      <span style={{ position: "relative", display: "inline-block" }}>
        ı
        <span
          style={{
            position: "absolute",
            left: "50%",
            top: "0.36em",
            width: "0.14em",
            height: "0.14em",
            background: dot,
            transform: "translateX(-50%)",
            borderRadius: "1px",
          }}
        />
      </span>
      ppy
    </span>
  );
}

// ── Lockup ────────────────────────────────────────────────────────────────────
// Horizontal row: Pulse mark + Zippy wordmark.

type LockupProps = {
  markSize?: number;
  wordSize?: number;
  markBg?: string;
  markFg?: string;
  wordColor?: string;
  dotColor?: string;
  style?: CSSProperties;
};

export function ZippyLockup({
  markSize = 48,
  wordSize = 44,
  markBg = "#ff3d14",
  markFg = "#faf5ee",
  wordColor = "#16120f",
  dotColor = "#ff3d14",
  style,
}: LockupProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: Math.round(markSize * 0.28),
        ...style,
      }}
    >
      <MarkPulse size={markSize} bg={markBg} fg={markFg} />
      <ZippyWordmark size={wordSize} color={wordColor} dot={dotColor} />
    </div>
  );
}
