"use client";

import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { initials, money, parseMoney, thumbStyle } from "./data";
import type { ComboFixedDraft, ComboSlotDraft, Lang, ProductDraft } from "./data";
import { Popover } from "../_components/Popover";

/** A product that can be attached to a combo (everything but the combo itself). */
export type ComboOption = { id: string; name: string; price: number; section: string };

const LANG_LABEL: Record<Lang, string> = { en: "English", es: "Spanish", pt: "Portuguese" };

const inputStyle: CSSProperties = {
  width: "100%",
  height: 34,
  padding: "0 11px",
  background: "#191919",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 6,
  boxSizing: "border-box",
  fontFamily: "var(--font-body)",
  fontSize: 12.5,
  color: "#F1F1F1",
  outline: "none",
};

const numStyle: CSSProperties = { ...inputStyle, fontFamily: "var(--font-mono)", textAlign: "center", padding: "0 8px" };
const rowStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 9, padding: "7px 9px", minWidth: 0, background: "#252525", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6 };
const stepperStyle: CSSProperties = { width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 5, cursor: "pointer", color: "#C7C8CC", fontSize: 12 };
const iconBtnStyle: CSSProperties = { width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "transparent", border: "none", borderRadius: 5, cursor: "pointer", color: "#75767C" };
const subLabel: CSSProperties = { fontSize: 10, fontWeight: 600, color: "#75767C", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 };
const fieldLabel: CSSProperties = { fontSize: 11, color: "#9B9B9B", marginBottom: 5 };

const switchStyle = (on: boolean): CSSProperties => ({
  width: 42, height: 23, flexShrink: 0, padding: 2, display: "flex", justifyContent: on ? "flex-end" : "flex-start",
  alignItems: "center", background: on ? "#FF5C1A" : "#3A3B3F", border: "none", borderRadius: 9999, cursor: "pointer",
  transition: "background 140ms ease",
});

const intOf = (v: string): number => {
  const n = Math.round(parseMoney(v));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Reasons the API would reject this composition (it validates the same rules and
 * answers 400 with just a field name, so catch them here where we can explain).
 */
export function comboIssues(draft: ProductDraft): string[] {
  const out: string[] = [];
  draft.comboSlots.forEach((slot, i) => {
    const name = (slot.names.en ?? "").trim();
    const label = name || `Slot ${i + 1}`;
    if (!name) out.push(`${label} needs a name.`);
    if (slot.products.length === 0) out.push(`${label} has no products attached.`);
    if (intOf(slot.max) < intOf(slot.min)) out.push(`${label} has a max below its min.`);
    if (!slot.allowDuplicates && slot.products.length > 0 && intOf(slot.max) > slot.products.length) {
      out.push(`${label} allows no duplicates, so max can't exceed its ${slot.products.length} product(s).`);
    }
  });
  return out;
}

export function ComboComposition({
  draft,
  options,
  lang,
  patchDraft,
}: {
  draft: ProductDraft;
  lang: Lang;
  options: ComboOption[];
  patchDraft: (patch: Partial<ProductDraft>) => void;
}) {
  const [fixedPick, setFixedPick] = useState("");
  const [fixedQty, setFixedQty] = useState("1");
  const [openPicker, setOpenPicker] = useState<string | null>(null);
  const [slotSearch, setSlotSearch] = useState("");
  const [pickPrice, setPickPrice] = useState<Record<string, string>>({});
  // Draft-only ids for rows the API has not seen yet; it assigns real ones on save.
  const nextId = useRef(0);
  const newId = (prefix: string) => {
    nextId.current += 1;
    return `${prefix}_new_${nextId.current}`;
  };

  const byId = (id: string) => options.find((o) => o.id === id);
  const fixed = draft.comboFixed;
  const slots = draft.comboSlots;
  const issues = comboIssues(draft);

  const patchSlot = (id: string, patch: Partial<ComboSlotDraft>) =>
    patchDraft({ comboSlots: slots.map((sl) => (sl.id === id ? { ...sl, ...patch } : sl)) });

  const addFixed = () => {
    if (!fixedPick) return;
    const qty = Math.max(1, intOf(fixedQty) || 1);
    const existing = fixed.find((f) => f.productId === fixedPick);
    patchDraft({
      comboFixed: existing
        ? fixed.map((f) => (f.productId === fixedPick ? { ...f, quantity: f.quantity + qty } : f))
        : fixed.concat([{ id: newId("cf"), productId: fixedPick, quantity: qty }]),
    });
    setFixedPick("");
    setFixedQty("1");
  };

  const patchFixed = (id: string, patch: Partial<ComboFixedDraft>) =>
    patchDraft({ comboFixed: fixed.map((f) => (f.id === id ? { ...f, ...patch } : f)) });

  const attachable = (slot: ComboSlotDraft) => {
    const q = slotSearch.trim().toLowerCase();
    return options
      .filter((o) => !slot.products.some((sp) => sp.productId === o.id))
      .filter((o) => !q || o.name.toLowerCase().includes(q) || o.section.toLowerCase().includes(q));
  };

  return (
    <div style={{ padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Combo composition</div>

      {/* ── Fixed products ── */}
      <div style={{ padding: 12, background: "#191919", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}>
        <div style={subLabel}>Fixed products</div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={fixedPick} onChange={(e) => setFixedPick(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0, cursor: "pointer" }}>
            <option value="">Select product…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.name} · {money(o.price)}</option>
            ))}
          </select>
          <input value={fixedQty} onChange={(e) => setFixedQty(e.target.value)} inputMode="numeric" aria-label="Quantity" style={{ ...inputStyle, width: 60, flexShrink: 0, textAlign: "center", padding: "0 8px", fontFamily: "var(--font-mono)" }} />
          <button type="button" onClick={addFixed} style={{ flexShrink: 0, height: 34, padding: "0 14px", borderRadius: 6, border: "none", cursor: "pointer", background: "rgba(255,92,26,0.14)", color: "#FF5C1A", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600 }}>Add</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          {fixed.map((f) => {
            const p = byId(f.productId);
            return (
              <div key={f.id} style={rowStyle}>
                <span style={thumbStyle(26, 5)}>{initials(p?.name ?? f.productId)}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "#F1F1F1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p?.name ?? f.productId}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#75767C" }}>{p ? money(p.price * f.quantity) : ""}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 2, background: "#252525", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6 }}>
                  <button type="button" aria-label="Decrease" onClick={() => patchFixed(f.id, { quantity: Math.max(1, f.quantity - 1) })} style={stepperStyle}>−</button>
                  <span style={{ minWidth: 22, textAlign: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "#F1F1F1" }}>{f.quantity}</span>
                  <button type="button" aria-label="Increase" onClick={() => patchFixed(f.id, { quantity: f.quantity + 1 })} style={stepperStyle}>+</button>
                </div>
                <button type="button" title="Remove" onClick={() => patchDraft({ comboFixed: fixed.filter((x) => x.id !== f.id) })} style={iconBtnStyle}>
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </button>
              </div>
            );
          })}
          {fixed.length === 0 && <div style={{ fontSize: 11.5, color: "#75767C" }}>Attach fixed products for combos with no choice step.</div>}
        </div>
      </div>

      {/* ── Slots ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 14 }}>
        <span style={{ fontSize: 11.5, color: "#9B9B9B" }}>Slot-based choices. Use these instead of fixed products.</span>
        <button
          type="button"
          onClick={() => patchDraft({ comboSlots: slots.concat([{ id: newId("cs"), names: { en: `Slot ${slots.length + 1}`, es: "", pt: "" }, min: "1", max: "1", allowDuplicates: false, products: [] }]) })}
          style={{ flexShrink: 0, height: 30, display: "flex", alignItems: "center", gap: 6, padding: "0 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12, color: "#E8E8E8" }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1.5v8M1.5 5.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span>Add combo slot</span>
        </button>
      </div>

      {fixed.length > 0 && slots.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 10, padding: "8px 10px", background: "rgba(255,214,0,0.08)", border: "1px solid rgba(255,214,0,0.25)", borderRadius: 6 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><circle cx="7" cy="7" r="5.6" stroke="#FFD600" strokeWidth="1.4" /><path d="M7 4.2v3.6" stroke="#FFD600" strokeWidth="1.4" strokeLinecap="round" /><circle cx="7" cy="10" r="0.8" fill="#FFD600" /></svg>
          <span style={{ fontSize: 11.5, color: "#FFD600", lineHeight: 1.4 }}>This combo has both fixed products and slots. Customers will get the fixed items plus every slot choice.</span>
        </div>
      )}

      {/* Blocking problems, named before the API answers with just a field. */}
      {issues.length > 0 && (
        <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6 }}>
          {issues.map((issue, i) => (
            <div key={i} style={{ fontSize: 11.5, color: "#F87171", lineHeight: 1.5 }}>{issue}</div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
        {slots.map((slot, slotIndex) => {
          const title = (slot.names.en ?? "").trim() || `Slot ${slotIndex + 1}`;
          const candidates = attachable(slot);
          const priceForPick = pickPrice[slot.id] ?? "0.00";
          return (
            <div key={slot.id} style={{ padding: 12, background: "#191919", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, color: "#F1F1F1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
                <button type="button" onClick={() => patchDraft({ comboSlots: slots.filter((x) => x.id !== slot.id) })} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11.5, color: "#EF4444" }}>Remove slot</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 74px 74px", gap: 8, alignItems: "end" }}>
                <div>
                  <div style={fieldLabel}>Slot name · {LANG_LABEL[lang]}</div>
                  <input
                    value={slot.names[lang] || ""}
                    onChange={(e) => patchSlot(slot.id, { names: { ...slot.names, [lang]: e.target.value } })}
                    placeholder={lang === "en" ? "Slot name" : `Translation for ${LANG_LABEL[lang]}`}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div style={fieldLabel}>Min</div>
                  <input
                    value={slot.min}
                    inputMode="numeric"
                    onChange={(e) => patchSlot(slot.id, { min: e.target.value })}
                    onBlur={() => {
                      const min = Math.max(0, intOf(slot.min));
                      patchSlot(slot.id, { min: String(min), max: String(Math.max(min, intOf(slot.max))) });
                    }}
                    style={numStyle}
                  />
                </div>
                <div>
                  <div style={fieldLabel}>Max</div>
                  <input
                    value={slot.max}
                    inputMode="numeric"
                    onChange={(e) => patchSlot(slot.id, { max: e.target.value })}
                    onBlur={() => {
                      const max = Math.max(1, intOf(slot.max));
                      patchSlot(slot.id, { max: String(max), min: String(Math.min(max, intOf(slot.min))) });
                    }}
                    style={numStyle}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: 12.5, color: "#F1F1F1" }}>Allow duplicate picks</div>
                  <div style={{ fontSize: 11.5, color: "#75767C", marginTop: 2 }}>
                    {slot.allowDuplicates ? "The same product can be picked more than once." : "Each product can be picked once."}
                  </div>
                </div>
                <button type="button" aria-label="Allow duplicate picks" onClick={() => patchSlot(slot.id, { allowDuplicates: !slot.allowDuplicates })} style={switchStyle(slot.allowDuplicates)}>
                  <span style={{ width: 19, height: 19, borderRadius: 9999, background: "#fff", display: "block" }} />
                </button>
              </div>

              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={subLabel}>Attach products</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Popover
                      open={openPicker === slot.id}
                      onOpenChange={(o) => { setOpenPicker(o ? slot.id : null); setSlotSearch(""); }}
                      align="start"
                      sideOffset={6}
                      contentStyle={{ width: 296, padding: 0 }}
                      trigger={
                        <button type="button" style={{ ...inputStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "#9B9B9B" }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><circle cx="5.2" cy="5.2" r="3.6" stroke="#75767C" strokeWidth="1.3" /><path d="M8 8l2.4 2.4" stroke="#75767C" strokeWidth="1.3" strokeLinecap="round" /></svg>
                          <span style={{ flex: 1, minWidth: 0, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Search products to attach</span>
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}><path d="M1 1l4 4 4-4" stroke="#75767C" strokeWidth="1.4" strokeLinecap="round" /></svg>
                        </button>
                      }
                    >
                      <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, color: "#F1F1F1" }}>Attach to {title}</div>
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 10px", background: "#252525", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 7 }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><circle cx="5.2" cy="5.2" r="3.6" stroke="#75767C" strokeWidth="1.3" /><path d="M8 8l2.4 2.4" stroke="#75767C" strokeWidth="1.3" strokeLinecap="round" /></svg>
                          <input value={slotSearch} onChange={(e) => setSlotSearch(e.target.value)} placeholder="Search products to attach" style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#E8E8E8" }} />
                        </div>
                      </div>
                      <div style={{ maxHeight: 236, overflow: "auto", padding: 6 }}>
                        {candidates.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            className="zp-attachrow"
                            onClick={() => {
                              patchSlot(slot.id, {
                                products: slot.products.concat([{ id: newId("so"), productId: o.id, extra: parseMoney(priceForPick).toFixed(2) }]),
                              });
                              setOpenPicker(null);
                              setSlotSearch("");
                            }}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "7px 8px", borderRadius: 7, background: "transparent", border: "none", cursor: "pointer" }}
                          >
                            <span style={thumbStyle(26, 5)}>{initials(o.name)}</span>
                            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, color: "#F1F1F1" }}>{o.name}</span>
                              <span style={{ fontSize: 11, color: "#75767C" }}>{o.section} · {money(o.price)}</span>
                            </span>
                            <span style={{ flexShrink: 0, fontSize: 11, color: "#75767C" }}>Attach</span>
                          </button>
                        ))}
                        {candidates.length === 0 && <div style={{ padding: "14px 8px", textAlign: "center", fontSize: 11.5, color: "#75767C" }}>No other products match.</div>}
                      </div>
                    </Popover>
                  </div>
                  <div title="Extra price applied to the next product you attach" style={{ display: "flex", alignItems: "center", gap: 5, width: 104, flexShrink: 0, height: 34, padding: "0 10px", background: "#191919", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, boxSizing: "border-box" }}>
                    <span style={{ fontSize: 12, color: "#75767C", fontFamily: "var(--font-mono)" }}>+$</span>
                    <input value={priceForPick} inputMode="decimal" aria-label="Extra price for the next attached product" onChange={(e) => setPickPrice((prev) => ({ ...prev, [slot.id]: e.target.value }))} style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#F1F1F1" }} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                  {slot.products.map((sp) => {
                    const p = byId(sp.productId);
                    return (
                      <div key={sp.id} style={rowStyle}>
                        <span style={thumbStyle(26, 5)}>{initials(p?.name ?? sp.productId)}</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "#F1F1F1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p?.name ?? sp.productId}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, width: 88, flexShrink: 0, height: 28, padding: "0 9px", background: "#252525", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, boxSizing: "border-box" }}>
                          <span style={{ fontSize: 11, color: "#75767C", fontFamily: "var(--font-mono)" }}>+$</span>
                          <input
                            value={sp.extra}
                            inputMode="decimal"
                            aria-label={`Extra price for ${p?.name ?? sp.productId}`}
                            onChange={(e) => patchSlot(slot.id, { products: slot.products.map((x) => (x.id === sp.id ? { ...x, extra: e.target.value } : x)) })}
                            onBlur={() => patchSlot(slot.id, { products: slot.products.map((x) => (x.id === sp.id ? { ...x, extra: parseMoney(x.extra).toFixed(2) } : x)) })}
                            style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-mono)", fontSize: 12, color: "#F1F1F1" }}
                          />
                        </div>
                        <button type="button" title="Remove" onClick={() => patchSlot(slot.id, { products: slot.products.filter((x) => x.id !== sp.id) })} style={iconBtnStyle}>
                          <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                        </button>
                      </div>
                    );
                  })}
                  {slot.products.length === 0 && <div style={{ fontSize: 11.5, color: "#75767C" }}>No products attached to this slot yet.</div>}
                </div>
              </div>
            </div>
          );
        })}
        {slots.length === 0 && (
          <div style={{ padding: 12, background: "#191919", border: "1px dashed rgba(255,255,255,0.14)", borderRadius: 8, fontSize: 11.5, color: "#75767C" }}>
            No slots yet. Add one when customers should choose between products.
          </div>
        )}
      </div>
    </div>
  );
}
