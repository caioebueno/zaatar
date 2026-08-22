"use client";

import type { ReactNode } from "react";

export function Drawer({
  width,
  title,
  headerRight,
  footer,
  onClose,
  zIndex = 60,
  children,
}: {
  width: number;
  title: string;
  headerRight?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  zIndex?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="zp-drawer-overlay"
      style={{ position: "fixed", inset: 0, zIndex, display: "flex", justifyContent: "flex-end", background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="zp-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: "94vw",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#202020",
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "-8px 0 24px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#F1F1F1" }}>{title}</span>
          {headerRight}
          <button
            type="button"
            onClick={onClose}
            style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, cursor: "pointer" }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1L9 9M9 1L1 9" stroke="#9B9B9B" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>

        {footer && (
          <div style={{ flexShrink: 0, display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", background: "#252525", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function LangTabs({ langs, current, onSelect }: { langs: [string, string, string][]; current: string; onSelect: (l: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: 2, background: "#191919", borderRadius: 6 }}>
      {langs.map((l) => (
        <button
          key={l[0]}
          type="button"
          onClick={() => onSelect(l[0])}
          style={{
            height: 24,
            padding: "0 10px",
            borderRadius: 5,
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.03em",
            background: l[0] === current ? "#2F2F2F" : "transparent",
            color: l[0] === current ? "#F1F1F1" : "#75767C",
          }}
        >
          {l[1]}
        </button>
      ))}
    </div>
  );
}

export function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ height: 32, padding: "0 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#C7C8CC" }}
    >
      Cancel
    </button>
  );
}

export const fieldLabelStyle = { fontSize: 11, color: "#9B9B9B", marginBottom: 5 } as const;
export const inputStyle = {
  width: "100%",
  height: 34,
  padding: "0 11px",
  background: "#191919",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 6,
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "#F1F1F1",
  boxSizing: "border-box" as const,
  outline: "none",
};
