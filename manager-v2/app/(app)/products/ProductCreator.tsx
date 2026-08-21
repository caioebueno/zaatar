"use client";

import { useState } from "react";
import type { I18n, Lang } from "./data";
import { KNOB_STYLE, LANGUAGES, primarySaveStyle, switchStyle, typeOptionStyle } from "./data";
import { CancelButton, Drawer, LangTabs, fieldLabelStyle, inputStyle } from "./Drawer";
import { Select } from "../_components/Select";

export type CreatorDraft = {
  section: string;
  names: I18n;
  descriptions: I18n;
  type: "single" | "combo";
  price: string;
  comparedAt: string;
  active: boolean;
};

export function ProductCreator({ initial, sections, onCancel, onSave }: { initial: CreatorDraft; sections: string[]; onCancel: () => void; onSave: (c: CreatorDraft) => void }) {
  const [names, setNames] = useState<I18n>(initial.names);
  const [descriptions, setDescriptions] = useState<I18n>(initial.descriptions);
  const [type, setType] = useState<"single" | "combo">(initial.type);
  const [section, setSection] = useState(initial.section);
  const [price, setPrice] = useState(initial.price);
  const [comparedAt, setComparedAt] = useState(initial.comparedAt);
  const [active, setActive] = useState(initial.active);
  const [lang, setLang] = useState<Lang>("en");

  const langRow = LANGUAGES.find((l) => l[0] === lang) ?? LANGUAGES[0];
  const canSave = (names.en || "").trim().length > 0;
  const money = (v: string) => (v ? (parseFloat(v.replace(/[^0-9.]/g, "")) || 0).toFixed(2) : "");

  const save = () => canSave && onSave({ section, names, descriptions, type, price, comparedAt, active });

  return (
    <Drawer
      width={420}
      zIndex={70}
      title="New product"
      onClose={onCancel}
      headerRight={<LangTabs langs={LANGUAGES} current={lang} onSelect={(l) => setLang(l as Lang)} />}
      footer={
        <>
          <CancelButton onClick={onCancel} />
          <button type="button" onClick={save} style={primarySaveStyle(canSave)}>
            Create product
          </button>
        </>
      }
    >
      <div>
        <div style={fieldLabelStyle}>Name · {langRow[2]}</div>
        <input
          className="zp-input"
          value={names[lang] || ""}
          onChange={(e) => setNames((prev) => ({ ...prev, [lang]: e.target.value }))}
          placeholder={lang === "en" ? "e.g. Smash burger" : "Name translation"}
          style={inputStyle}
        />
      </div>
      <div>
        <div style={fieldLabelStyle}>Description · {langRow[2]}</div>
        <textarea
          className="zp-input"
          value={descriptions[lang] || ""}
          onChange={(e) => setDescriptions((prev) => ({ ...prev, [lang]: e.target.value }))}
          placeholder={lang === "en" ? "Short description" : "Description translation"}
          rows={3}
          style={{ ...inputStyle, height: "auto", padding: "9px 11px", fontSize: 12.5, lineHeight: 1.5, resize: "vertical" }}
        />
      </div>
      <div>
        <div style={fieldLabelStyle}>Section</div>
        <Select
          value={section}
          onValueChange={setSection}
          ariaLabel="Section"
          options={sections.map((s) => ({ value: s, label: s }))}
          triggerStyle={{ ...inputStyle, fontSize: 12.5, padding: "0 9px", width: "100%" }}
        />
      </div>
      <div>
        <div style={fieldLabelStyle}>Product type</div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["single", "combo"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} style={typeOptionStyle(type === t)}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{t === "single" ? "Single item" : "Combo"}</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>{t === "single" ? "One product" : "Bundle of items"}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 10 }}>
        <PriceField label="Price" value={price} onChange={setPrice} onBlur={() => setPrice(money(price))} />
        <PriceField label="Compared at" value={comparedAt} onChange={setComparedAt} onBlur={() => setComparedAt(money(comparedAt))} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12.5, color: "#F1F1F1" }}>Available for sale</div>
          <div style={{ fontSize: 11.5, color: "#75767C", marginTop: 2 }}>{active ? "Visible on the menu right away." : "Created hidden from the menu."}</div>
        </div>
        <button type="button" onClick={() => setActive((v) => !v)} style={switchStyle(active)}>
          <span style={KNOB_STYLE} />
        </button>
      </div>
      <div style={{ fontSize: 11.5, color: "#75767C", lineHeight: 1.5 }}>
        Media, modifier groups and preparation tasks can be added after the product is created.
      </div>
    </Drawer>
  );
}

export function PriceField({ label, value, onChange, onBlur }: { label: string; value: string; onChange: (v: string) => void; onBlur: () => void }) {
  return (
    <div>
      <div style={fieldLabelStyle}>{label}</div>
      <div className="zp-field" style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 11px", background: "#191919", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, boxSizing: "border-box" }}>
        <span style={{ fontSize: 12.5, color: "#75767C", fontFamily: "var(--font-mono)" }}>$</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} inputMode="decimal" style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-mono)", fontSize: 13, color: "#F1F1F1" }} />
      </div>
    </div>
  );
}
