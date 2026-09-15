"use client";

import { useRef } from "react";
import type { CSSProperties } from "react";
import type { ProgressiveDiscount, ProgressiveDiscountStepInput, ProgressiveDiscountStepType } from "../../lib/api";

/** A step while it is being edited: `amount`/`discount` stay strings so the inputs stay free-form. */
export type StepDraft = {
  amount: string;
  discount: string;
  id: string;
  /** Prizes are read-only here — this API has no prize write endpoint. */
  prizes: { id: string; imageUrl: string | null; name: string; productNames: string[]; quantity: number }[];
  type: ProgressiveDiscountStepType;
};

export type DiscountDraft = { completed: boolean; steps: StepDraft[] };

const CENTS = 100;

const money = (dollars: number): string =>
  "$" + dollars.toLocaleString("en-US", { minimumFractionDigits: dollars % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });

/** Free-form input → number, tolerant of "$", commas and half-typed values. */
export function amountOf(v: string): number {
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

export function draftFromDiscount(d: ProgressiveDiscount | null): DiscountDraft {
  if (!d) return { completed: false, steps: [] };
  return {
    completed: d.completed,
    steps: d.steps
      .slice()
      .sort((a, b) => a.amount - b.amount)
      .map((st) => ({
        id: st.id,
        type: st.type,
        amount: String(st.amount / CENTS),
        discount: st.discount == null ? "" : String(st.discount),
        prizes: st.prizes.map((pz) => ({
          id: pz.id,
          name: pz.name,
          quantity: pz.quantity,
          imageUrl: pz.imageUrl,
          productNames: pz.products.map((p) => p.name),
        })),
      })),
  };
}

/** Draft → API payload. Dollars become cents; GIFT steps must carry no discount. */
export function stepsToInput(steps: StepDraft[]): ProgressiveDiscountStepInput[] {
  return steps
    .slice()
    .sort((a, b) => amountOf(a.amount) - amountOf(b.amount))
    .map((st) =>
      st.type === "GIFT"
        ? { type: "GIFT" as const, amount: Math.round(amountOf(st.amount) * CENTS) }
        : {
            type: "PERCENTAGEDISCOUNT" as const,
            amount: Math.round(amountOf(st.amount) * CENTS),
            discount: Math.round(amountOf(st.discount)),
          },
    );
}

/** The design's one-line summary: "3 steps · $25 → $80 · 1 gift". */
export function pdSummary(d: ProgressiveDiscount): string {
  if (d.steps.length === 0) return "No steps yet";
  const sorted = d.steps.slice().sort((a, b) => a.amount - b.amount);
  const gifts = d.steps.filter((st) => st.type === "GIFT").length;
  const bits = [
    `${d.steps.length} ${d.steps.length === 1 ? "step" : "steps"}`,
    `${money(sorted[0].amount / CENTS)} → ${money(sorted[sorted.length - 1].amount / CENTS)}`,
  ];
  if (gifts) bits.push(`${gifts} ${gifts === 1 ? "gift" : "gifts"}`);
  return bits.join(" · ");
}

/** The design's ladder warnings, in its priority order. */
export function ladderWarning(steps: StepDraft[]): string {
  const amounts = steps.map((st) => amountOf(st.amount));
  if (amounts.some((v, i) => amounts.indexOf(v) !== i)) return "Two steps share the same threshold.";
  if (steps.some((st) => st.type === "GIFT" && st.prizes.length === 0)) return "A gift step has no prize linked.";
  if (steps.some((st) => st.type === "PERCENTAGEDISCOUNT" && !(amountOf(st.discount) > 0))) return "A discount step has no percentage set.";
  return "";
}

const segStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  minWidth: 0,
  height: 28,
  borderRadius: 5,
  border: "none",
  cursor: "pointer",
  background: active ? "rgba(255,92,26,0.16)" : "transparent",
  color: active ? "#FF5C1A" : "#9B9B9B",
  fontFamily: "var(--font-body)",
  fontSize: 11.5,
  fontWeight: active ? 600 : 400,
  whiteSpace: "nowrap",
});

const fieldStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  height: 34,
  padding: "0 11px",
  background: "#191919",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 6,
  boxSizing: "border-box",
};

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: "transparent",
  border: "none",
  outline: "none",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
  color: "#F1F1F1",
};

const switchStyle = (on: boolean): CSSProperties => ({
  width: 42,
  height: 23,
  flexShrink: 0,
  padding: 2,
  display: "flex",
  justifyContent: on ? "flex-end" : "flex-start",
  alignItems: "center",
  background: on ? "#FF5C1A" : "#3A3B3F",
  border: "none",
  borderRadius: 9999,
  cursor: "pointer",
  transition: "background 140ms ease",
});

export function ProgressiveDiscountPanel({
  discount,
  draft,
  loading,
  error,
  saving,
  saveError,
  onPatch,
  onSave,
  onDiscard,
  onClose,
  onRetry,
}: {
  discount: ProgressiveDiscount | null;
  draft: DiscountDraft;
  loading: boolean;
  error: string;
  saving: boolean;
  saveError: string;
  onPatch: (next: DiscountDraft) => void;
  onSave: () => void;
  onDiscard: () => void;
  onClose: () => void;
  onRetry: () => void;
}) {
  // Saved state is derived, never mirrored into state — the panel is fed the
  // server's discount and the working draft, so the diff is a pure computation.
  const saved = draftFromDiscount(discount);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const stepsDirty = JSON.stringify(draft.steps) !== JSON.stringify(saved.steps);
  const prizeCount = (discount?.steps ?? []).reduce((n, st) => n + st.prizes.length, 0);
  const warning = ladderWarning(draft.steps);
  const sorted = draft.steps.slice().sort((a, b) => amountOf(a.amount) - amountOf(b.amount));

  const patchStep = (id: string, patch: Partial<StepDraft>) =>
    onPatch({ ...draft, steps: draft.steps.map((st) => (st.id === id ? { ...st, ...patch } : st)) });

  // Draft-only ids for rows the server has not seen yet; the API assigns real ones
  // on save. A counter keeps them stable across re-renders (and keeps render pure).
  const nextId = useRef(0);
  const addStep = () => {
    const last = sorted.length ? amountOf(sorted[sorted.length - 1].amount) : 0;
    nextId.current += 1;
    onPatch({
      ...draft,
      steps: draft.steps.concat([
        { id: `new_${nextId.current}`, type: "PERCENTAGEDISCOUNT", amount: String(last + 25), discount: "5", prizes: [] },
      ]),
    });
  };

  return (
    <div style={{ width: "100%", minWidth: 360, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#F1F1F1" }}>Progressive discount</div>
          <div style={{ marginTop: 3, fontFamily: "var(--font-mono)", fontSize: 11, color: "#75767C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {discount ? discount.id : "Not created yet"}
          </div>
        </div>
        {discount && (
          <span style={{ padding: "2px 8px", borderRadius: 9999, fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap", background: draft.completed ? "rgba(34,197,94,0.14)" : "rgba(255,214,0,0.14)", color: draft.completed ? "#22C55E" : "#FFD600" }}>
            {draft.completed ? "Completed" : "Running"}
          </span>
        )}
        <button type="button" onClick={onClose} aria-label="Close" style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, cursor: "pointer" }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="#9B9B9B" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "18px 20px 24px" }}>
        {loading && <div style={{ padding: "40px 0", textAlign: "center", fontSize: 12.5, color: "#9B9B9B" }}>Loading progressive discount…</div>}

        {!loading && error && (
          <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12.5, color: "#F87171" }}>{error}</div>
            <button type="button" onClick={onRetry} style={{ height: 30, padding: "0 14px", background: "#FF5C1A", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717" }}>Try again</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: "#F1F1F1" }}>Completed</div>
                <div style={{ fontSize: 11.5, color: "#75767C", marginTop: 2 }}>
                  {draft.completed ? "Closed — no longer offered to customers." : "Live and collecting progress."}
                </div>
              </div>
              <button type="button" aria-label="Toggle completed" onClick={() => onPatch({ ...draft, completed: !draft.completed })} style={switchStyle(draft.completed)}>
                <span style={{ width: 19, height: 19, borderRadius: 9999, background: "#fff", display: "block" }} />
              </button>
            </div>

            <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Ladder</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {sorted.map((st, i) => (
                  <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {i > 0 && <span style={{ fontSize: 12, color: "#5B5C61" }}>→</span>}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 28, padding: "0 10px", borderRadius: 9999, background: "#252525", border: "1px solid " + (st.type === "GIFT" ? "rgba(255,214,0,0.3)" : "rgba(255,92,26,0.3)") }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "#F1F1F1" }}>{money(amountOf(st.amount))}</span>
                      <span style={{ fontSize: 11.5, color: "#9B9B9B" }}>{st.type === "GIFT" ? "Gift" : amountOf(st.discount) + "% off"}</span>
                    </span>
                  </div>
                ))}
                {sorted.length === 0 && <span style={{ fontSize: 11.5, color: "#75767C" }}>No steps yet. Add the first spend threshold below.</span>}
              </div>
              {warning && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, padding: "8px 10px", background: "rgba(255,214,0,0.08)", border: "1px solid rgba(255,214,0,0.25)", borderRadius: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><circle cx="7" cy="7" r="5.6" stroke="#FFD600" strokeWidth="1.4" /><path d="M7 4.2v3.6" stroke="#FFD600" strokeWidth="1.4" strokeLinecap="round" /><circle cx="7" cy="10" r="0.8" fill="#FFD600" /></svg>
                  <span style={{ fontSize: 11.5, color: "#FFD600" }}>{warning}</span>
                </div>
              )}
              {/* The API rebuilds every step on save and prizes cascade off steps, so
                  an edit here is destructive in a way the screen must not hide. */}
              {stepsDirty && prizeCount > 0 && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginTop: 10, padding: "8px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="7" cy="7" r="5.6" stroke="#EF4444" strokeWidth="1.4" /><path d="M7 4.2v3.6" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" /><circle cx="7" cy="10" r="0.8" fill="#EF4444" /></svg>
                  <span style={{ fontSize: 11.5, color: "#F87171", lineHeight: 1.45 }}>
                    Saving step changes rebuilds the ladder and will delete {prizeCount === 1 ? "the linked prize" : `all ${prizeCount} linked prizes`}. Re-link {prizeCount === 1 ? "it" : "them"} afterwards.
                  </span>
                </div>
              )}
            </div>

            <div style={{ padding: "16px 0 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Steps</span>
                <button type="button" onClick={addStep} style={{ height: 28, display: "flex", alignItems: "center", gap: 6, padding: "0 11px", borderRadius: 6, cursor: "pointer", background: "rgba(255,92,26,0.14)", border: "none", color: "#FF5C1A", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600 }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1.5v8M1.5 5.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  <span>Add step</span>
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sorted.map((st, i) => (
                  <div key={st.id} style={{ padding: 12, background: "#252525", borderRadius: 8, border: "1px solid " + (st.type === "GIFT" ? "rgba(255,214,0,0.22)" : "rgba(255,255,255,0.08)") }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                      <span style={{ width: 24, height: 34, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#75767C" }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 5 }}>Spend reaches</div>
                        <div style={fieldStyle}>
                          <span style={{ fontSize: 12.5, color: "#75767C", fontFamily: "var(--font-mono)" }}>$</span>
                          <input
                            value={st.amount}
                            inputMode="decimal"
                            onChange={(e) => patchStep(st.id, { amount: e.target.value })}
                            onBlur={() => patchStep(st.id, { amount: String(Math.max(0, amountOf(st.amount))) })}
                            style={inputStyle}
                          />
                        </div>
                      </div>
                      <div style={{ width: 172, flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 5 }}>Reward</div>
                        <div style={{ display: "flex", gap: 3, padding: 2, background: "#191919", borderRadius: 6 }}>
                          {([["PERCENTAGEDISCOUNT", "Discount"], ["GIFT", "Gift"]] as const).map(([type, label]) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => patchStep(st.id, { type, discount: type === "GIFT" ? "" : st.discount || "10" })}
                              style={segStyle(st.type === type)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <button type="button" title="Remove step" onClick={() => onPatch({ ...draft, steps: draft.steps.filter((x) => x.id !== st.id) })} style={{ width: 26, height: 34, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "transparent", border: "none", borderRadius: 6, cursor: "pointer", color: "#75767C" }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      </button>
                    </div>

                    {st.type === "PERCENTAGEDISCOUNT" && (
                      <div style={{ marginTop: 12, width: 180 }}>
                        <div style={{ fontSize: 11, color: "#9B9B9B", marginBottom: 5 }}>Discount</div>
                        <div style={fieldStyle}>
                          <input
                            value={st.discount}
                            inputMode="numeric"
                            onChange={(e) => patchStep(st.id, { discount: e.target.value })}
                            onBlur={() => patchStep(st.id, { discount: String(Math.min(100, Math.max(0, Math.round(amountOf(st.discount))))) })}
                            style={inputStyle}
                          />
                          <span style={{ fontSize: 12.5, color: "#75767C", fontFamily: "var(--font-mono)" }}>%</span>
                        </div>
                      </div>
                    )}

                    {st.type === "GIFT" && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#75767C", textTransform: "uppercase", letterSpacing: "0.06em" }}>Prizes</span>
                          <span style={{ fontSize: 10.5, color: "#5B5C61" }}>Read-only</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {st.prizes.map((pz) => (
                            <div key={pz.id} style={{ display: "flex", gap: 10, padding: 10, background: "#191919", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}>
                              <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 6, background: "#252525", border: "1px solid rgba(255,255,255,0.08)", backgroundImage: pz.imageUrl ? `url(${pz.imageUrl})` : "none", backgroundSize: "cover", backgroundPosition: "center" }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "#F1F1F1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pz.name || "Unnamed prize"}</span>
                                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#75767C" }}>×{pz.quantity}</span>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
                                  {pz.productNames.map((name, k) => (
                                    <span key={k} style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 8px", borderRadius: 9999, background: "#2F2F2F", border: "1px solid rgba(255,255,255,0.09)", fontSize: 11, color: "#E8E8E8" }}>{name}</span>
                                  ))}
                                  {pz.productNames.length === 0 && <span style={{ fontSize: 11, color: "#75767C" }}>No product linked</span>}
                                </div>
                              </div>
                            </div>
                          ))}
                          {st.prizes.length === 0 && (
                            <div style={{ padding: "9px 10px", background: "rgba(255,214,0,0.06)", border: "1px solid rgba(255,214,0,0.2)", borderRadius: 6, fontSize: 11.5, color: "#FFD600" }}>
                              A gift step needs at least one prize.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {!loading && !error && dirty && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.07)", background: "#1C1C1C", flexShrink: 0 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: saveError ? "#F87171" : "#9B9B9B" }}>
            {saveError || (discount ? "Unsaved changes" : "New progressive discount")}
          </span>
          <button type="button" onClick={onDiscard} disabled={saving} style={{ height: 32, padding: "0 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 6, cursor: saving ? "default" : "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#C7C8CC" }}>Discard</button>
          <button type="button" onClick={onSave} disabled={saving} style={{ height: 32, padding: "0 16px", background: "#FF5C1A", border: "none", borderRadius: 6, cursor: saving ? "default" : "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save"}</button>
        </div>
      )}
    </div>
  );
}
