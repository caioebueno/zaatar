"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import {
  ApiError, createModifierGroup, createModifierGroupItem, deleteModifierGroupItem,
  toAbsoluteImageUrl, updateModifierGroup, updateModifierGroupItem, uploadBucketImage,
} from "../../lib/api";
import type { ModifierGroupItemResult, SquareCatalogSyncTask, UpdateModifierGroupItemBody } from "../../lib/api";
import { getManagerBusinessId, getManagerToken } from "../../lib/auth";
import type { FlatProduct, I18n, Lang, MediaItem, ModifierGroup, ModifierOption, PrepTask, ProductDraft } from "./data";
import {
  KNOB_STYLE, LANGUAGES, groupMeta, i18n, initials, money, parseMoney, pickerRowStyle,
  statusChip, switchStyle, taskMeta, typeOptionStyle,
} from "./data";
import { GroupEditor } from "./GroupEditor";
import type { GroupDraft } from "./GroupEditor";
import { TaskEditor } from "./TaskEditor";
import type { TaskDraft } from "./TaskEditor";
import { Menu, MenuItem } from "../_components/Menu";

/**
 * Square sync tasks from a modifier-item mutation. Prefer `squareSyncTasks` (the
 * full per-menu list); fall back to the single `squareSyncTask`. Empty when the
 * business has no Square connection.
 */
function tasksOf(r: ModifierGroupItemResult): SquareCatalogSyncTask[] {
  if (r.squareSyncTasks && r.squareSyncTasks.length) return r.squareSyncTasks;
  return r.squareSyncTask ? [r.squareSyncTask] : [];
}

/** Image MIME types the product image upload accepts (must match the bucket's allowed set). */
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/pjpeg", "image/png", "image/x-png", "image/gif"] as const;
const ACCEPTED_IMAGE_ACCEPT = ACCEPTED_IMAGE_TYPES.join(",");

/** { es: { title }, pt: { title } } for the non-English names, or undefined if none. */
function langTranslations(names: I18n): Record<string, { title: string }> | undefined {
  const out: Record<string, { title: string }> = {};
  (["es", "pt"] as const).forEach((loc) => {
    if ((names[loc] || "").trim()) out[loc] = { title: names[loc] as string };
  });
  return Object.keys(out).length ? out : undefined;
}

/** { es: { title, description }, pt: {...} } for a modifier option, or undefined if none. */
function optionTranslations(o: ModifierOption): Record<string, { title: string; description: string }> | undefined {
  const out: Record<string, { title: string; description: string }> = {};
  (["es", "pt"] as const).forEach((loc) => {
    const title = o.names[loc] || "";
    const description = o.descriptions[loc] || "";
    if (title.trim() || description.trim()) out[loc] = { title, description };
  });
  return Object.keys(out).length ? out : undefined;
}

const sectionLabel: CSSProperties = { fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em" };
const attachBtn: CSSProperties = { height: 26, padding: "0 4px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#E8E8E8" };
const newBtn: CSSProperties = { ...attachBtn, fontWeight: 600, color: "#FF7A44" };
const fieldLabel: CSSProperties = { fontSize: 11, color: "#9B9B9B", marginBottom: 5 };
const inputStyle: CSSProperties = { width: "100%", height: 34, padding: "0 11px", background: "#191919", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 13, color: "#F1F1F1", boxSizing: "border-box", outline: "none" };
const rowCard: CSSProperties = { display: "flex", alignItems: "center", gap: 10, padding: "10px 11px", background: "#191919", borderRadius: 6 };
const editLink: CSSProperties = { height: 24, padding: "0 4px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11.5, color: "#C7C8CC" };
const detachBtn: CSSProperties = { width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", color: "#9B9B9B", fontSize: 13 };


export function ProductDetail({
  product, draft, baseline, lang, modifierLibrary, prepLibrary,
  setLang, patchDraft, onMediaChange, onSave, onDiscard, onClose, upsertModifierGroup, upsertPrepTask, trackModifierSync,
}: {
  product: FlatProduct;
  draft: ProductDraft;
  baseline: ProductDraft;
  lang: Lang;
  modifierLibrary: ModifierGroup[];
  prepLibrary: PrepTask[];
  setLang: (l: Lang) => void;
  patchDraft: (patch: Partial<ProductDraft>) => void;
  onMediaChange: (media: MediaItem[]) => Promise<void>;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  onClose: () => void;
  upsertModifierGroup: (g: ModifierGroup) => void;
  upsertPrepTask: (t: PrepTask) => void;
  trackModifierSync: (label: string, tasks: (SquareCatalogSyncTask | null | undefined)[], retrigger?: () => Promise<(SquareCatalogSyncTask | null | undefined)[]>) => void;
}) {
  const [groupEditor, setGroupEditor] = useState<GroupDraft | null>(null);
  const [taskEditor, setTaskEditor] = useState<TaskDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleSave = async () => {
    setBusy(true);
    setSaveError("");
    try {
      await onSave();
    } catch (err) {
      setSaveError(err instanceof ApiError && err.status === 0 ? "Can't reach the server." : "Couldn't save product.");
    } finally {
      setBusy(false);
    }
  };

  const langRow = LANGUAGES.find((l) => l[0] === lang) ?? LANGUAGES[0];
  const chip = statusChip(draft.active);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const price = parseMoney(draft.price);
  const cmp = draft.comparedAt ? parseMoney(draft.comparedAt) : 0;
  const saving = cmp - price;

  const attachedGroups = draft.modifiers.map((id) => modifierLibrary.find((g) => g.id === id)).filter((g): g is ModifierGroup => !!g);
  const attachedTasks = draft.tasks.map((id) => prepLibrary.find((t) => t.id === id)).filter((t): t is PrepTask => !!t);

  const setName = (v: string) => patchDraft({ names: { ...draft.names, [lang]: v } });
  const setDesc = (v: string) => patchDraft({ descriptions: { ...draft.descriptions, [lang]: v } });

  const mediaErrorText = (err: unknown, fallback: string) => {
    const reason = err instanceof ApiError ? err.reason : "";
    return reason || (err instanceof ApiError && err.status === 0 ? "Can't reach the server." : fallback);
  };

  // Persist a new media list immediately (auto-save). Used by remove and reorder.
  const applyMedia = async (next: MediaItem[]) => {
    setUploadError("");
    setMediaBusy(true);
    try {
      await onMediaChange(next);
    } catch (err) {
      setUploadError(mediaErrorText(err, "Couldn't update images."));
    } finally {
      setMediaBusy(false);
    }
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    // Only JPEG/PNG/GIF are accepted by the bucket — reject anything else up front.
    const rejected = files.filter((f) => !ACCEPTED_IMAGE_TYPES.includes(f.type as (typeof ACCEPTED_IMAGE_TYPES)[number]));
    if (rejected.length) {
      setUploadError(`Unsupported file type${rejected.length > 1 ? "s" : ""}: ${rejected.map((f) => f.name).join(", ")}. Use JPEG, PNG, or GIF.`);
      return;
    }
    const token = getManagerToken();
    if (!token) return;
    const businessId = getManagerBusinessId();
    setUploadError("");
    setUploading(true);
    try {
      // Upload each file to the bucket, then auto-save the new image list via
      // PATCH `photoUrls` — no Save button needed.
      const added: MediaItem[] = [];
      for (const f of files) {
        const { key, url } = await uploadBucketImage(token, f, businessId);
        added.push({ id: key, kind: "image", name: f.name, url });
      }
      await onMediaChange(draft.media.concat(added));
    } catch (err) {
      setUploadError(mediaErrorText(err, "Couldn't upload image."));
    } finally {
      setUploading(false);
    }
  };

  const mediaLocked = uploading || mediaBusy;

  // Persists a modifier group and its options to the API: the group metadata via
  // POST/PATCH /modifier-groups, then a diff of the options against the baseline
  // via the /modifier-group-items CRUD (create new, update existing, delete
  // removed). Options carry es/pt as a translations object like products do.
  const saveGroup = async (g: GroupDraft) => {
    const token = getManagerToken();
    if (!token) return;
    const businessId = getManagerBusinessId();

    const single = g.selection === "single";
    const min = single ? (g.required ? 1 : 0) : parseInt(g.min, 10) || 0;
    const max = single ? 1 : Math.max(parseInt(g.max, 10) || 1, min);
    const type = single ? "SINGLE" : "MULTI";
    const groupTranslations = langTranslations(g.names);

    // 1. Group metadata — create (new) or update (existing).
    let groupId = g.mode === "edit" && g.id ? g.id : "";
    if (groupId) {
      await updateModifierGroup(token, groupId, {
        title: g.names.en || "",
        required: g.required,
        type,
        minSelection: min,
        maxSelection: max,
        translations: groupTranslations ?? null,
      }, businessId);
    } else {
      const created = await createModifierGroup(token, {
        title: g.names.en || "",
        required: g.required,
        type,
        minSelection: min,
        maxSelection: max,
        translations: groupTranslations,
      }, businessId);
      groupId = created.id;
    }

    // 2. Options diff against the currently-saved group (baseline).
    const baseline = modifierLibrary.find((x) => x.id === g.id)?.options ?? [];
    const draftIds = new Set(g.options.map((o) => o.id));
    await Promise.all(
      baseline.filter((o) => !draftIds.has(o.id)).map((o) => deleteModifierGroupItem(token, o.id, businessId)),
    );

    const savedOptions: ModifierOption[] = [];
    // Aggregate every Square sync task the item mutations produce into one toast, and
    // remember the update operations so Retry can re-issue them.
    const syncTasks: (SquareCatalogSyncTask | null | undefined)[] = [];
    const updateOps: { itemId: string; body: UpdateModifierGroupItemBody }[] = [];
    for (const o of g.options) {
      const price = Math.round(parseMoney(o.price) * 100);
      const name = o.names.en || "";
      const description = (o.descriptions.en || "").trim() ? o.descriptions.en! : null;
      const translations = optionTranslations(o);
      const thumb = o.thumb ?? null;
      const existing = baseline.find((b) => b.id === o.id);
      if (existing) {
        const body: UpdateModifierGroupItemBody = { name, description, price, translations: translations ?? null };
        // Only send the thumbnail when it changed: a URL to set/replace, null to clear.
        if (thumb !== (existing.thumb ?? null)) {
          body.photoUrl = thumb ? toAbsoluteImageUrl(thumb) : null;
        }
        const saved = await updateModifierGroupItem(token, o.id, body, businessId);
        savedOptions.push({ id: saved.id, names: o.names, descriptions: o.descriptions, price: price / 100, thumb: saved.photo?.url ?? thumb });
        syncTasks.push(...tasksOf(saved));
        updateOps.push({ itemId: o.id, body });
      } else {
        // CREATE has no photoUrl field — create first, then PATCH the thumbnail on.
        const created = await createModifierGroupItem(token, { modifierGroupId: groupId, name, description, price, translations }, businessId);
        syncTasks.push(...tasksOf(created));
        let savedThumb = created.photo?.url ?? null;
        if (thumb) {
          const withPhoto = await updateModifierGroupItem(token, created.id, { photoUrl: toAbsoluteImageUrl(thumb) }, businessId);
          syncTasks.push(...tasksOf(withPhoto));
          savedThumb = withPhoto.photo?.url ?? thumb;
        }
        savedOptions.push({ id: created.id, names: o.names, descriptions: o.descriptions, price: price / 100, thumb: savedThumb });
      }
    }

    // 3. Commit to the local library; attach to the product if it's a new group.
    const norm: ModifierGroup = { id: groupId, names: g.names, selection: g.selection, required: g.required, min, max, options: savedOptions };
    const exists = modifierLibrary.some((x) => x.id === groupId);
    upsertModifierGroup(norm);
    if (!exists) patchDraft({ modifiers: draft.modifiers.concat([groupId]) });
    setGroupEditor(null);

    // 4. Square sync feedback — one toast covering every affected menu.
    if (syncTasks.some(Boolean)) {
      const label = g.names.en || "Modifier group";
      const retrigger = updateOps.length
        ? async () => {
            const out: (SquareCatalogSyncTask | null | undefined)[] = [];
            for (const op of updateOps) {
              out.push(...tasksOf(await updateModifierGroupItem(token, op.itemId, op.body, businessId)));
            }
            return out;
          }
        : undefined;
      trackModifierSync(label, syncTasks, retrigger);
    }
  };

  // The TaskEditor drawer fetches stations and persists the step itself; here we
  // just commit the returned task to the local library and attach new ones.
  const handleTaskSaved = (task: PrepTask, mode: "create" | "edit") => {
    upsertPrepTask(task);
    if (mode === "create") patchDraft({ tasks: draft.tasks.concat([task.id]) });
    setTaskEditor(null);
  };

  return (
    <div style={{ width: "100%", height: "100%", minWidth: 0, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#F1F1F1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {draft.names[lang] || draft.names.en || product.name}
          </span>
          <span style={chip.statusStyle}>
            <span style={chip.dotStyle} />
            {chip.status}
          </span>
        </div>
        <button type="button" className="zp-icon-btn" onClick={onClose} style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, cursor: "pointer" }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="#9B9B9B" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "18px 20px 24px" }}>
        {/* Media */}
        <div style={{ paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <span style={sectionLabel}>Media</span>
            <span style={{ fontSize: 10, color: uploadError ? "#F08A6C" : "#75767C" }}>
              {uploadError || "First item is the main image"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(84px,1fr))", gap: 8 }}>
            {draft.media.map((m, i) => (
              <div key={m.id} style={{ position: "relative", height: 84, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", background: m.url ? "#111" : "linear-gradient(135deg,#2B2B2B,#1E1E1E)", backgroundImage: m.url && m.kind === "image" ? `url(${toAbsoluteImageUrl(m.url)})` : undefined, backgroundSize: "cover", backgroundPosition: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#6E6F74" }}>
                  {m.url ? "" : initials(m.name || product.name)}
                </span>
                {i === 0 && <span style={{ position: "absolute", top: 5, left: 5, padding: "2px 6px", borderRadius: 9999, background: "#FF5C1A", color: "#171717", fontSize: 11, fontWeight: 700, letterSpacing: "0.03em" }}>MAIN</span>}
                {m.kind === "video" && <span style={{ position: "absolute", bottom: 5, left: 5, padding: "2px 6px", borderRadius: 9999, background: "rgba(0,0,0,0.6)", color: "#F1F1F1", fontSize: 11, fontWeight: 600 }}>VIDEO</span>}
                <div style={{ position: "absolute", top: 5, right: 5, display: "flex", gap: 4 }}>
                  {i > 0 && (
                    <button type="button" title="Move first" disabled={mediaLocked} onClick={() => applyMedia([draft.media[i]].concat(draft.media.filter((_, j) => j !== i)))} style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.62)", border: "none", borderRadius: 5, cursor: mediaLocked ? "default" : "pointer", opacity: mediaLocked ? 0.5 : 1, color: "#F1F1F1", fontSize: 11 }}>↑</button>
                  )}
                  <button type="button" title="Remove" disabled={mediaLocked} onClick={() => applyMedia(draft.media.filter((_, j) => j !== i))} style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.62)", border: "none", borderRadius: 5, cursor: mediaLocked ? "default" : "pointer", opacity: mediaLocked ? 0.5 : 1, color: "#F1F1F1", fontSize: 11 }}>×</button>
                </div>
              </div>
            ))}
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, height: 84, background: "#191919", border: "1px dashed rgba(255,255,255,0.16)", borderRadius: 8, cursor: mediaLocked ? "default" : "pointer", opacity: mediaLocked ? 0.6 : 1, color: "#9B9B9B", fontSize: 11 }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>{uploading ? "…" : "+"}</span>
              <span>{uploading ? "Uploading…" : mediaBusy ? "Saving…" : "Add image"}</span>
              <input type="file" multiple accept={ACCEPTED_IMAGE_ACCEPT} onChange={onUpload} disabled={mediaLocked} style={{ display: "none" }} />
            </label>
          </div>
        </div>

        {/* Details */}
        <div style={{ padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <span style={sectionLabel}>Details</span>
            <LangTabsInline current={lang} onSelect={setLang} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={fieldLabel}>Name · {langRow[2]}</div>
              <input className="zp-input" value={draft.names[lang] || ""} onChange={(e) => setName(e.target.value)} placeholder={lang === "en" ? "Product name" : (draft.names.en || "") + " (" + langRow[2] + ")"} style={inputStyle} />
            </div>
            <div>
              <div style={fieldLabel}>Description · {langRow[2]}</div>
              <textarea className="zp-input" value={draft.descriptions[lang] || ""} onChange={(e) => setDesc(e.target.value)} placeholder={lang === "en" ? "Product description" : "Translation for " + langRow[2]} rows={3} style={{ ...inputStyle, height: "auto", padding: "9px 11px", fontSize: 12.5, lineHeight: 1.5, resize: "vertical" }} />
            </div>
            <ToggleRow title="Available for sale" note={draft.active ? "Customers can order this item now." : "Hidden from the menu."} on={draft.active} onToggle={() => patchDraft({ active: !draft.active })} />
            <ToggleRow title="Alert driver on delivery" note={draft.alertDriver ? "Driver gets a handling alert at drop-off." : "No handling alert for this item."} on={draft.alertDriver} onToggle={() => patchDraft({ alertDriver: !draft.alertDriver })} />
          </div>
        </div>

        {/* Product type */}
        <div style={{ padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>Product type</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["single", "combo"] as const).map((t) => (
              <button key={t} type="button" onClick={() => patchDraft({ type: t })} style={typeOptionStyle(draft.type === t)}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{t === "single" ? "Single item" : "Combo"}</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>{t === "single" ? "One product" : "Bundle of items"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ ...sectionLabel, marginBottom: 10 }}>Pricing</div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 10 }}>
            <MoneyField label="Price" value={draft.price} onChange={(v) => patchDraft({ price: v })} onBlur={() => patchDraft({ price: parseMoney(draft.price).toFixed(2) })} />
            <MoneyField label="Compared at" value={draft.comparedAt} onChange={(v) => patchDraft({ comparedAt: v })} onBlur={() => patchDraft({ comparedAt: draft.comparedAt ? parseMoney(draft.comparedAt).toFixed(2) : "" })} />
          </div>
          <div style={{ marginTop: 8, fontSize: 11.5, color: saving > 0 ? "#22C55E" : "#75767C", fontFamily: "var(--font-mono)" }}>
            {saving > 0 ? "Save " + money(saving) + " · " + Math.round((saving / cmp) * 100) + "% off" : "No compare-at discount"}
          </div>
        </div>

        {/* Modifier groups */}
        <div style={{ padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <span style={sectionLabel}>Modifier groups</span>
            <div style={{ display: "flex", gap: 6 }}>
              <Menu width={250} trigger={<button type="button" style={attachBtn}>Attach</button>}>
                {modifierLibrary.filter((g) => draft.modifiers.indexOf(g.id) === -1).map((g) => (
                  <MenuItem key={g.id} onSelect={() => patchDraft({ modifiers: draft.modifiers.concat([g.id]) })} style={pickerRowStyle()}>
                    <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>{i18n(g.names, lang)}</span>
                    <span style={{ fontSize: 10.5, color: "#75767C", fontFamily: "var(--font-mono)" }}>{g.options.length}</span>
                  </MenuItem>
                ))}
                {modifierLibrary.every((g) => draft.modifiers.indexOf(g.id) !== -1) && <div style={{ padding: "8px 6px", fontSize: 11.5, color: "#75767C" }}>All groups attached.</div>}
              </Menu>
              <button type="button" onClick={() => setGroupEditor({ mode: "create", id: null, names: { en: "", es: "", pt: "" }, selection: "single", required: false, min: "0", max: "1", options: [] })} style={newBtn}>New group</button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {attachedGroups.map((g) => (
              <div key={g.id} style={rowCard}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "#F1F1F1" }}>{i18n(g.names, lang)}</div>
                  <div style={{ fontSize: 11, color: "#75767C", marginTop: 3 }}>{groupMeta(g)}</div>
                </div>
                <button type="button" onClick={() => setGroupEditor({ mode: "edit", id: g.id, names: g.names, selection: g.selection, required: g.required, min: String(g.min), max: String(g.max), options: g.options })} style={editLink}>Edit</button>
                <button type="button" title="Detach" onClick={() => patchDraft({ modifiers: draft.modifiers.filter((x) => x !== g.id) })} style={detachBtn}>×</button>
              </div>
            ))}
            {attachedGroups.length === 0 && <div style={{ padding: "4px 0 2px", fontSize: 11.5, color: "#75767C" }}>No modifier groups attached.</div>}
          </div>
        </div>

        {/* Preparation tasks */}
        <div style={{ padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
            <span style={sectionLabel}>Preparation tasks</span>
            <div style={{ display: "flex", gap: 6 }}>
              <Menu width={250} trigger={<button type="button" style={attachBtn}>Attach</button>}>
                {prepLibrary.filter((t) => draft.tasks.indexOf(t.id) === -1).map((t) => (
                  <MenuItem key={t.id} onSelect={() => patchDraft({ tasks: draft.tasks.concat([t.id]) })} style={pickerRowStyle()}>
                    <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>{t.name}</span>
                    <span style={{ fontSize: 10.5, color: "#75767C", fontFamily: "var(--font-mono)" }}>{t.goal}m</span>
                  </MenuItem>
                ))}
                {prepLibrary.every((t) => draft.tasks.indexOf(t.id) !== -1) && <div style={{ padding: "8px 6px", fontSize: 11.5, color: "#75767C" }}>All tasks attached.</div>}
              </Menu>
              <button type="button" onClick={() => setTaskEditor({ mode: "create", id: null, name: "", station: "", goal: "5", comments: false, modifiers: false })} style={newBtn}>New task</button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {attachedTasks.map((t) => (
              <div key={t.id} style={rowCard}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "#F1F1F1" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "#75767C", marginTop: 3 }}>{taskMeta(t)}</div>
                </div>
                <button type="button" onClick={() => setTaskEditor({ mode: "edit", id: t.id, name: t.name, station: t.station, goal: String(t.goal), comments: t.comments, modifiers: t.modifiers })} style={editLink}>Edit</button>
                <button type="button" title="Detach" onClick={() => patchDraft({ tasks: draft.tasks.filter((x) => x !== t.id) })} style={detachBtn}>×</button>
              </div>
            ))}
            {attachedTasks.length === 0 && <div style={{ padding: "4px 0 2px", fontSize: 11.5, color: "#75767C" }}>No preparation tasks yet.</div>}
          </div>
        </div>

        {/* Tax — coming soon */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "18px 0 0" }}>
          <span style={{ ...sectionLabel, color: "#75767C" }}>Tax</span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: "#5B5C61" }}>Coming soon</span>
        </div>
      </div>

      {dirty && (
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", background: "#252525", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: saveError ? "#F87171" : "#9B9B9B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{saveError || "Unsaved changes"}</span>
          <button type="button" onClick={onDiscard} disabled={busy} style={{ height: 32, padding: "0 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 6, cursor: busy ? "default" : "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#C7C8CC", opacity: busy ? 0.5 : 1 }}>Discard</button>
          <button type="button" onClick={handleSave} disabled={busy} style={{ height: 32, padding: "0 16px", background: "#FF5C1A", border: "none", borderRadius: 6, cursor: busy ? "default" : "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717", opacity: busy ? 0.7 : 1 }}>{busy ? "Saving…" : "Save"}</button>
        </div>
      )}

      {groupEditor && <GroupEditor initial={groupEditor} onCancel={() => setGroupEditor(null)} onSave={saveGroup} />}
      {taskEditor && <TaskEditor initial={taskEditor} onCancel={() => setTaskEditor(null)} onSaved={handleTaskSaved} />}
    </div>
  );
}

function LangTabsInline({ current, onSelect }: { current: Lang; onSelect: (l: Lang) => void }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: 2, background: "#191919", borderRadius: 6 }}>
      {LANGUAGES.map((l) => (
        <button key={l[0]} type="button" onClick={() => onSelect(l[0])} style={{ height: 24, padding: "0 10px", borderRadius: 5, border: "none", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, letterSpacing: "0.03em", background: l[0] === current ? "#2F2F2F" : "transparent", color: l[0] === current ? "#F1F1F1" : "#75767C" }}>
          {l[1]}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({ title, note, on, onToggle }: { title: string; note: string; on: boolean; onToggle: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div>
        <div style={{ fontSize: 12.5, color: "#F1F1F1" }}>{title}</div>
        <div style={{ fontSize: 11.5, color: "#75767C", marginTop: 2 }}>{note}</div>
      </div>
      <button type="button" onClick={onToggle} style={switchStyle(on)}>
        <span style={KNOB_STYLE} />
      </button>
    </div>
  );
}

function MoneyField({ label, value, onChange, onBlur }: { label: string; value: string; onChange: (v: string) => void; onBlur: () => void }) {
  return (
    <div>
      <div style={fieldLabel}>{label}</div>
      <div className="zp-field" style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 11px", background: "#191919", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, boxSizing: "border-box" }}>
        <span style={{ fontSize: 12.5, color: "#75767C", fontFamily: "var(--font-mono)" }}>$</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} inputMode="decimal" style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-mono)", fontSize: 13, color: "#F1F1F1" }} />
      </div>
    </div>
  );
}
