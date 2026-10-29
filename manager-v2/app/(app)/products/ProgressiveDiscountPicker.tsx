"use client";

import type { ProgressiveDiscount } from "../../lib/api";
import { pdSummary } from "./ProgressiveDiscountPanel";

/**
 * Body of the toolbar's progressive-discount dropdown: the ladder attached to the
 * current menu, the other ladders on file, and a way to start a new one.
 *
 * Attaching sets `Menu.progressiveDiscountId` for this menu only; a ladder can run
 * on several menus at once, and a menu can run none. A completed ladder stays
 * attached but isn't offered to customers.
 */
export function ProgressiveDiscountPicker({
  catalog,
  active,
  currentMenuId,
  menuName,
  loading,
  error,
  busy,
  onEdit,
  onActivate,
  onDeactivate,
  onCreate,
  onRetry,
}: {
  active: ProgressiveDiscount | null;
  busy: boolean;
  catalog: ProgressiveDiscount[];
  currentMenuId: string;
  error: string;
  loading: boolean;
  menuName: (menuId: string) => string;
  onActivate: (id: string) => void;
  onCreate: () => void;
  onDeactivate: () => void;
  onEdit: (id: string) => void;
  onRetry: () => void;
}) {
  const others = catalog.filter((d) => d.id !== active?.id);
  // Where else a ladder runs, so attaching/editing a shared one isn't a surprise.
  const otherMenus = (d: ProgressiveDiscount) => (d.menuIds ?? []).filter((id) => id !== currentMenuId).map(menuName);

  return (
    <>
      <div style={{ padding: "4px 6px 8px", fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Progressive discount</div>

      {loading && <div style={{ padding: "8px 6px", fontSize: 11.5, color: "#75767C" }}>Loading…</div>}

      {!loading && error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 6px" }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: "#F87171" }}>{error}</span>
          <button type="button" onClick={onRetry} style={{ height: 24, padding: "0 9px", borderRadius: 6, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,255,255,0.14)", fontFamily: "var(--font-body)", fontSize: 11, color: "#C7C8CC" }}>Retry</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {active && (
            <div style={{ padding: 10, background: "#252525", border: "1px solid rgba(255,92,26,0.28)", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "#F1F1F1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{active.id}</span>
                {active.completed ? (
                  <span style={{ flexShrink: 0, padding: "2px 8px", borderRadius: 9999, fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap", background: "rgba(34,197,94,0.14)", color: "#22C55E" }}>Completed</span>
                ) : (
                  <span style={{ flexShrink: 0, padding: "2px 8px", borderRadius: 9999, fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap", background: "rgba(255,214,0,0.14)", color: "#FFD600" }}>Running</span>
                )}
              </div>
              <div style={{ marginTop: 6, fontSize: 11.5, color: "#9B9B9B" }}>{pdSummary(active)}</div>
              {active.completed && <div style={{ marginTop: 4, fontSize: 11.5, color: "#75767C", lineHeight: 1.45 }}>Completed ladders aren&apos;t offered. Reopen it in Edit steps.</div>}
              {otherMenus(active).length > 0 && <div style={{ marginTop: 4, fontSize: 11, color: "#75767C" }}>Also on {otherMenus(active).join(", ")}</div>}
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button type="button" onClick={() => onEdit(active.id)} style={{ height: 28, padding: "0 11px", borderRadius: 6, cursor: "pointer", border: "none", background: "#FF5C1A", color: "#171717", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600 }}>Edit steps</button>
                <button type="button" disabled={busy} onClick={onDeactivate} style={{ height: 28, padding: "0 11px", borderRadius: 6, cursor: busy ? "default" : "pointer", border: "1px solid rgba(239,68,68,0.4)", background: "transparent", color: "#EF4444", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, opacity: busy ? 0.6 : 1 }}>Detach</button>
              </div>
            </div>
          )}

          {/* Nothing attached — the menu runs without a progressive discount. */}
          {!active && catalog.length > 0 && (
            <div style={{ padding: 10, background: "#252525", border: "1px dashed rgba(255,255,255,0.14)", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#E8E8E8" }}>No discount attached</div>
              <div style={{ marginTop: 4, fontSize: 11.5, color: "#75767C", lineHeight: 1.45 }}>Customers on this menu order at full price. Attach one below to run a ladder here.</div>
            </div>
          )}

          <div style={{ padding: "12px 6px 6px", fontSize: 10, fontWeight: 600, color: "#75767C", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {active ? "Other discounts" : "Available discounts"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 212, overflow: "auto" }}>
            {others.map((d) => (
              <div key={d.id} className="zp-attachrow" style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, borderRadius: 6, minWidth: 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "#F1F1F1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.id}</span>
                    {d.completed && <span style={{ flexShrink: 0, padding: "1px 7px", borderRadius: 9999, background: "rgba(34,197,94,0.14)", color: "#22C55E", fontSize: 10.5, fontWeight: 600 }}>Completed</span>}
                  </div>
                  <div style={{ marginTop: 3, fontSize: 11, color: "#9B9B9B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pdSummary(d)}</div>
                  {otherMenus(d).length > 0 && <div style={{ marginTop: 2, fontSize: 10.5, color: "#75767C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>On {otherMenus(d).join(", ")}</div>}
                </div>
                <button type="button" onClick={() => onEdit(d.id)} style={{ flexShrink: 0, height: 24, padding: "0 9px", borderRadius: 6, cursor: "pointer", background: "transparent", border: "1px solid rgba(255,255,255,0.14)", fontFamily: "var(--font-body)", fontSize: 11, color: "#C7C8CC" }}>Edit</button>
                <button type="button" disabled={busy} onClick={() => onActivate(d.id)} style={{ flexShrink: 0, height: 24, padding: "0 10px", borderRadius: 6, cursor: busy ? "default" : "pointer", border: "none", background: "rgba(255,92,26,0.16)", color: "#FF5C1A", fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, opacity: busy ? 0.6 : 1 }}>Attach</button>
              </div>
            ))}
            {others.length === 0 && (
              <div style={{ padding: "8px 6px", fontSize: 11.5, color: "#75767C" }}>{active ? "No other progressive discounts." : "No progressive discounts yet."}</div>
            )}
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />
          <button type="button" disabled={busy} onClick={onCreate} style={{ width: "100%", height: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "transparent", border: "1px dashed rgba(255,255,255,0.16)", borderRadius: 6, cursor: busy ? "default" : "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#C7C8CC", opacity: busy ? 0.6 : 1 }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1.5v8M1.5 5.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            <span>New progressive discount</span>
          </button>
        </>
      )}
    </>
  );
}
