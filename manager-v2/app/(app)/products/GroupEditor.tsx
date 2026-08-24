"use client";

import { useState } from "react";
import type { I18n, Lang, ModifierOption } from "./data";
import { KNOB_STYLE, LANGUAGES, parseMoney, primarySaveStyle, switchStyle, typeOptionStyle } from "./data";
import { CancelButton, Drawer, LangTabs, fieldLabelStyle, inputStyle } from "./Drawer";
import { ApiError, toAbsoluteImageUrl, uploadBucketImage } from "../../lib/api";
import { getManagerBusinessId, getManagerToken } from "../../lib/auth";

/** Image MIME types accepted for option thumbnails (matches the product image set). */
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/pjpeg", "image/png", "image/x-png", "image/gif"] as const;
const ACCEPTED_IMAGE_ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

export type GroupDraft = {
  mode: "create" | "edit";
  id: string | null;
  names: I18n;
  selection: "single" | "multi";
  required: boolean;
  min: string;
  max: string;
  options: ModifierOption[];
};

const smallInput = { ...inputStyle, height: 30, fontSize: 12.5, background: "#252525" };

export function GroupEditor({ initial, onCancel, onSave }: { initial: GroupDraft; onCancel: () => void; onSave: (g: GroupDraft) => void | Promise<void> }) {
  const [names, setNames] = useState<I18n>(initial.names);
  const [selection, setSelection] = useState<"single" | "multi">(initial.selection);
  const [required, setRequired] = useState(initial.required);
  const [min, setMin] = useState(initial.min);
  const [max, setMax] = useState(initial.max);
  const [options, setOptions] = useState<ModifierOption[]>(initial.options);
  const [lang, setLang] = useState<Lang>("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const langRow = LANGUAGES.find((l) => l[0] === lang) ?? LANGUAGES[0];
  const canSave = (names.en || "").trim().length > 0;

  const setMode = (mode: "single" | "multi") => {
    if (mode === "multi") {
      setSelection("multi");
      setMax(String(Math.max(Number(max) || 0, 2)));
    } else {
      setSelection("single");
      setMin(required ? "1" : "0");
      setMax("1");
    }
  };

  const toggleRequired = () => {
    const req = !required;
    setRequired(req);
    setMin(req ? String(Math.max(Number(min) || 0, 1)) : "0");
  };

  const patchOption = (i: number, patch: Partial<ModifierOption>) =>
    setOptions((prev) => prev.map((o, j) => (j === i ? { ...o, ...patch } : o)));

  const patchOptionById = (id: string, patch: Partial<ModifierOption>) =>
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const addOption = () =>
    setOptions((prev) => [...prev, { id: "opt-" + prev.length + "-" + (names.en || "opt"), names: { en: "" }, descriptions: { en: "" }, price: 0, thumb: null }]);

  // Upload an option thumbnail to the bucket; the stored `thumb` is the returned
  // proxy path (absolutized when rendered and when sent to the API on save).
  const uploadThumb = async (optId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      setError("Unsupported image type. Use JPEG, PNG, or GIF.");
      return;
    }
    const token = getManagerToken();
    if (!token) return;
    const businessId = getManagerBusinessId();
    setError("");
    setUploadingId(optId);
    try {
      const { url } = await uploadBucketImage(token, file, businessId);
      patchOptionById(optId, { thumb: url });
    } catch (err) {
      setError(err instanceof ApiError && err.status === 0 ? "Can't reach the server." : "Couldn't upload image.");
    } finally {
      setUploadingId((cur) => (cur === optId ? null : cur));
    }
  };

  const save = async () => {
    if (!canSave || busy) return;
    setBusy(true);
    setError("");
    try {
      await onSave({ mode: initial.mode, id: initial.id, names, selection, required, min, max, options });
    } catch (e) {
      setError(e instanceof ApiError && e.status === 0 ? "Can't reach the server." : "Couldn't save group.");
      setBusy(false);
    }
  };

  return (
    <Drawer
      width={440}
      title={initial.mode === "edit" ? "Edit modifier group" : "New modifier group"}
      onClose={onCancel}
      headerRight={<LangTabs langs={LANGUAGES} current={lang} onSelect={(l) => setLang(l as Lang)} />}
      footer={
        <>
          {error && <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: "#F08A6C", alignSelf: "center" }}>{error}</span>}
          <CancelButton onClick={onCancel} />
          <button type="button" onClick={save} disabled={busy || !canSave} style={primarySaveStyle(canSave && !busy)}>
            {busy ? "Saving…" : initial.mode === "edit" ? "Save group" : "Create group"}
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
          placeholder={lang === "en" ? "e.g. Add-ons" : (names.en || "Group") + " (" + langRow[2] + ")"}
          style={{ ...inputStyle, height: 32, fontSize: 12.5 }}
        />
      </div>

      <div>
        <div style={fieldLabelStyle}>Selection</div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["single", "multi"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} style={typeOptionStyle(selection === m)}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{m === "single" ? "Single" : "Multi"}</span>
              <span style={{ fontSize: 11, opacity: 0.7 }}>{m === "single" ? "One option" : "Several options"}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12.5, color: "#F1F1F1" }}>Required</div>
          <div style={{ fontSize: 11.5, color: "#75767C", marginTop: 2 }}>
            {required ? "Customer must choose before adding to cart." : "Customer can skip this group."}
          </div>
        </div>
        <button type="button" onClick={toggleRequired} style={switchStyle(required)}>
          <span style={KNOB_STYLE} />
        </button>
      </div>

      {selection === "multi" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 10 }}>
          <div>
            <div style={fieldLabelStyle}>Min selections</div>
            <input className="zp-input" value={min} onChange={(e) => setMin(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" style={{ ...inputStyle, height: 32, fontSize: 12.5, fontFamily: "var(--font-mono)" }} />
          </div>
          <div>
            <div style={fieldLabelStyle}>Max selections</div>
            <input className="zp-input" value={max} onChange={(e) => setMax(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" style={{ ...inputStyle, height: 32, fontSize: 12.5, fontFamily: "var(--font-mono)" }} />
          </div>
        </div>
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Options</span>
          <button type="button" onClick={addOption} style={{ height: 26, padding: "0 4px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#E8E8E8" }}>
            Add option
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {options.map((o, i) => {
            const thumbUrl = o.thumb ? toAbsoluteImageUrl(o.thumb) : null;
            const busyThumb = uploadingId === o.id;
            return (
            <div key={o.id} style={{ padding: 11, background: "#191919", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, display: "flex", gap: 10 }}>
              {/* Thumbnail */}
              <div style={{ width: 56, flexShrink: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ position: "relative", width: 56, height: 56 }}>
                  <label title={thumbUrl ? "Replace thumbnail" : "Add thumbnail"} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, boxSizing: "border-box", borderRadius: 6, cursor: busyThumb ? "default" : "pointer", overflow: "hidden", background: thumbUrl ? "#111" : "#252525", backgroundImage: thumbUrl ? `url(${thumbUrl})` : undefined, backgroundSize: "cover", backgroundPosition: "center", border: thumbUrl ? "1px solid rgba(255,255,255,0.1)" : "1px dashed rgba(255,255,255,0.16)" }}>
                    {busyThumb ? (
                      <span style={{ width: 15, height: 15, borderRadius: "9999px", border: "2px solid rgba(255,255,255,0.18)", borderTopColor: "#FF5C1A", animation: "zspin 0.7s linear infinite" }} />
                    ) : !thumbUrl && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6E6F74" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                    )}
                    <input type="file" accept={ACCEPTED_IMAGE_ACCEPT} disabled={busyThumb} onChange={(e) => uploadThumb(o.id, e)} style={{ display: "none" }} />
                  </label>
                  {thumbUrl && !busyThumb && (
                    <button type="button" title="Remove thumbnail" onClick={() => patchOption(i, { thumb: null })} style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", background: "#2F2F2F", border: "1px solid rgba(255,255,255,0.16)", borderRadius: "9999px", cursor: "pointer", color: "#C7C8CC", fontSize: 10, lineHeight: 1, padding: 0 }}>×</button>
                  )}
                </div>
                <span style={{ fontSize: 10, color: "#75767C", textAlign: "center", fontFamily: "var(--font-mono)" }}>{String(i + 1).padStart(2, "0")}</span>
              </div>
              {/* Fields */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    className="zp-input"
                    value={o.names[lang] || ""}
                    onChange={(e) => patchOption(i, { names: { ...o.names, [lang]: e.target.value } })}
                    placeholder={lang === "en" ? "Option name" : (o.names.en || "Option") + " (" + langRow[1] + ")"}
                    style={{ ...smallInput, flex: 1, minWidth: 0 }}
                  />
                  <div className="zp-field" style={{ display: "flex", alignItems: "center", gap: 5, width: 96, height: 30, padding: "0 9px", background: "#252525", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, boxSizing: "border-box" }}>
                    <span style={{ fontSize: 12, color: "#75767C", fontFamily: "var(--font-mono)" }}>$</span>
                    <input
                      value={typeof o.price === "number" ? o.price.toFixed(2) : o.price}
                      onChange={(e) => patchOption(i, { price: e.target.value })}
                      onBlur={() => patchOption(i, { price: parseMoney(o.price) })}
                      inputMode="decimal"
                      style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#F1F1F1" }}
                    />
                  </div>
                  <button type="button" onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))} title="Remove" style={{ width: 26, height: 26, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, cursor: "pointer", color: "#9B9B9B", fontSize: 11 }}>
                    ×
                  </button>
                </div>
                <input
                  className="zp-input"
                  value={o.descriptions[lang] || ""}
                  onChange={(e) => patchOption(i, { descriptions: { ...o.descriptions, [lang]: e.target.value } })}
                  placeholder={lang === "en" ? "Description (optional)" : "Description (" + langRow[1] + ")"}
                  style={{ ...smallInput, color: "#C7C8CC" }}
                />
              </div>
            </div>
          );})}
          {options.length === 0 && <div style={{ padding: "4px 0 2px", fontSize: 11.5, color: "#75767C" }}>No options yet.</div>}
        </div>
      </div>
    </Drawer>
  );
}
