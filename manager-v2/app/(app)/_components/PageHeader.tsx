import type { ReactNode } from "react";

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 20px",
        height: 56,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 16,
          color: "#F1F1F1",
          letterSpacing: "-0.2px",
        }}
      >
        {title}
      </div>
      {actions}
    </div>
  );
}
