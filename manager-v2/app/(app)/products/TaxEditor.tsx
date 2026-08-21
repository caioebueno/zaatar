"use client";

import { useState } from "react";
import { primarySaveStyle } from "./data";
import { CancelButton, Drawer, inputStyle } from "./Drawer";

export type TaxDraft = { mode: "create" | "edit"; id: string | null; name: string; rate: string };

export function TaxEditor({ initial, onCancel, onSave }: { initial: TaxDraft; onCancel: () => void; onSave: (t: TaxDraft) => void }) {
  const [name, setName] = useState(initial.name);
  const [rate, setRate] = useState(initial.rate);

  const canSave = name.trim().length > 0;
  const save = () => canSave && onSave({ ...initial, name, rate });

  return (
    <Drawer
      width={380}
      title={initial.mode === "edit" ? "Edit tax group" : "New tax group"}
      onClose={onCancel}
      footer={
        <>
          <CancelButton onClick={onCancel} />
          <button type="button" onClick={save} style={primarySaveStyle(canSave, 30)}>
            {initial.mode === "edit" ? "Save tax group" : "Create tax group"}
          </button>
        </>
      }
    >
      <div>
        <div style={{ fontSize: 11, color: "#B4B5BA", marginBottom: 5 }}>Name</div>
        <input className="zp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. State sales tax" style={{ ...inputStyle, height: 32, fontSize: 12.5 }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#B4B5BA", marginBottom: 5 }}>Rate</div>
        <div className="zp-field" style={{ display: "flex", alignItems: "center", gap: 6, width: 120, height: 32, padding: "0 11px", background: "#191919", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, boxSizing: "border-box" }}>
          <input
            value={rate}
            onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#F1F1F1" }}
          />
          <span style={{ fontSize: 12.5, color: "#B4B5BA", fontFamily: "var(--font-mono)" }}>%</span>
        </div>
      </div>
      <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "#9A9BA1" }}>
        Tax groups are shared across products. Editing a group updates every product it is attached to.
      </div>
    </Drawer>
  );
}
