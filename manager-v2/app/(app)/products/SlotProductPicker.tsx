"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { initials, money, thumbStyle } from "./data";
import type { ComboOption } from "./ComboComposition";

/** Products with no section on the current menu (they live on other menus). */
const OTHER_MENUS = "Other menus";

const box = (on: boolean): CSSProperties => ({
  width: 18, height: 18, flexShrink: 0, borderRadius: 4, boxSizing: "border-box",
  display: "flex", alignItems: "center", justifyContent: "center",
  background: on ? "#FF5C1A" : "transparent", border: on ? "none" : "1.5px solid rgba(255,255,255,0.22)",
});

const Check = () => (
  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.6 2.6L9 1.2" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/**
 * "Choose products" modal for a combo slot (Products.dc.html `slotModalVals`).
 * Checkbox list grouped by section with a select-all per section. Nothing is
 * applied until Save, which hands back the full set of checked product ids;
 * the caller keeps existing rows (and their extra prices) for ids still checked.
 */
export function SlotProductPicker({
  slotTitle,
  options,
  initialSelected,
  onSave,
  onClose,
}: {
  slotTitle: string;
  options: ComboOption[];
  initialSelected: string[];
  onSave: (productIds: string[]) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState<Set<string>>(() => new Set(initialSelected));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggle = (ids: string[], on: boolean) =>
    setSel((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });

  // Sections in the order products arrive, with the off-menu bucket last.
  const q = search.trim().toLowerCase();
  const titles: string[] = [];
  options.forEach((o) => {
    const t = o.section || OTHER_MENUS;
    if (!titles.includes(t)) titles.push(t);
  });
  titles.sort((a, b) => Number(a === OTHER_MENUS) - Number(b === OTHER_MENUS));
  const groups = titles
    .map((title) => {
      const items = options.filter((o) => (o.section || OTHER_MENUS) === title).filter((o) => !q || o.name.toLowerCase().includes(q));
      const ids = items.map((o) => o.id);
      const n = ids.filter((id) => sel.has(id)).length;
      return { title, items, ids, n, all: items.length > 0 && n === ids.length };
    })
    .filter((g) => g.items.length > 0);

  const total = sel.size;

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose products"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 560, height: "min(680px, calc(100vh - 48px))", display: "flex", flexDirection: "column", background: "#212121", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", overflow: "hidden" }}
      >
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 12, padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#F1F1F1" }}>Choose products</span>
              <span style={{ fontSize: 12, color: "#75767C" }}>Slot · {slotTitle}</span>
            </div>
            <button type="button" className="zp-rowmenu" onClick={onClose} title="Close" style={{ width: 30, height: 30, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "none", background: "transparent", color: "#9B9B9B", cursor: "pointer" }}>
              <svg width="11" height="11" viewBox="0 0 9 9" fill="none"><path d="M1 1l7 7M8 1l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 34, padding: "0 11px", background: "#191919", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><circle cx="5.2" cy="5.2" r="3.6" stroke="#75767C" strokeWidth="1.3" /><path d="M8 8l2.4 2.4" stroke="#75767C" strokeWidth="1.3" strokeLinecap="round" /></svg>
            <input className="zp-bare" autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#E8E8E8" }} />
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          {groups.map((g) => (
            <div key={g.title}>
              <button type="button" onClick={() => toggle(g.ids, !g.all)} style={{ position: "sticky", top: 0, zIndex: 1, width: "100%", display: "flex", alignItems: "center", gap: 10, height: 36, padding: "0 20px", background: "#252525", border: "none", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", fontFamily: "var(--font-body)", textAlign: "left" }}>
                <span style={box(g.n > 0)}>
                  {g.all ? <Check /> : g.n > 0 ? <span style={{ width: 8, height: 2, borderRadius: 1, background: "#FFFFFF" }} /> : null}
                </span>
                <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, color: "#F1F1F1", letterSpacing: "0.01em" }}>{g.title}</span>
                <span style={{ fontSize: 10.5, color: "#75767C", fontFamily: "var(--font-mono)" }}>{g.n}/{g.ids.length}</span>
              </button>
              {g.items.map((o) => {
                const checked = sel.has(o.id);
                return (
                  <button key={o.id} type="button" className="zp-prow" role="checkbox" aria-checked={checked} onClick={() => toggle([o.id], !checked)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, minHeight: 52, padding: "8px 20px", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", fontFamily: "var(--font-body)", textAlign: "left" }}>
                    <span style={box(checked)}>{checked && <Check />}</span>
                    <span style={thumbStyle(32, 6)}>{initials(o.name)}</span>
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "#F1F1F1" }}>{o.name}</span>
                    <span style={{ flexShrink: 0, fontSize: 12, color: "#9B9B9B", fontFamily: "var(--font-mono)" }}>{money(o.price)}</span>
                  </button>
                );
              })}
            </div>
          ))}
          {groups.length === 0 && <div style={{ padding: "40px 20px", textAlign: "center", fontSize: 12.5, color: "#75767C" }}>No products match.</div>}
        </div>

        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ flex: 1, fontSize: 12.5, color: "#9B9B9B" }}>{total} {total === 1 ? "product selected" : "products selected"}</span>
          <button type="button" onClick={onClose} style={{ height: 34, padding: "0 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#E8E8E8", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button type="button" onClick={() => onSave(Array.from(sel))} style={{ height: 34, padding: "0 16px", borderRadius: 6, border: "none", background: "#FF5C1A", color: "#FFFFFF", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Save</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
