"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "../../lib/api";
import { clearManagerSession } from "../../lib/auth";
import {
  ackInventoryAlert, countChecklistItem, createInventoryPlace, createInventoryProduct,
  deleteInventoryStock, floridaDate, getTodayChecklist,
  listInventoryAlerts, listInventoryPlaces, listInventoryProducts, listInventoryStocks,
  openDailyChecklist, resolveInventoryAlert, submitChecklist, transferInventoryStock,
  updateInventoryPlace, updateInventoryProduct, upsertInventoryStock,
} from "../../lib/inventory";
import type {
  InventoryAlert, InventoryChecklistItemResult, InventoryChecklistWithItems,
  InventoryPlace, InventoryPlaceType, InventoryProduct, InventoryStock,
} from "../../lib/inventory";

/**
 * Stock (inventory) screen — ported from the Zappy `Stock.dc.html` design and
 * wired to the web app's inventory API (`/api/inventory`). Manages places,
 * products and per-place stock rows, drives the daily checklist, and surfaces
 * alerts + KPIs.
 */

type Status = "OUT_OF_STOCK" | "BELOW_MIN" | "REFILL_NEEDED" | "OK" | "NONE";
type Tab = "stock" | "products" | "places" | "checklist" | "alerts";

type Form =
  | { kind: "stock"; productId: string; placeId: string; qty: string; min: string; inChecklist: boolean; notifyBelowThreshold: boolean; error: string; busy: boolean }
  | { kind: "adjust"; productId: string; placeId: string; movement: "add" | "remove" | "transfer"; toPlaceId: string; qty: string; error: string; busy: boolean }
  | { kind: "product"; id?: string; name: string; unit: string; minQuantity: string; alertThreshold: string; requiresRefill: boolean; active: boolean; notes: string; error: string; busy: boolean }
  | { kind: "place"; id?: string; name: string; type: InventoryPlaceType; active: boolean; displayOrder: string; notes: string; error: string; busy: boolean };

const PLACE_TYPES: InventoryPlaceType[] = ["FRIDGE", "FREEZER", "SHELF", "PANTRY", "OTHER"];
const ORDER: Record<string, number> = { OUT_OF_STOCK: 3, REFILL_NEEDED: 2, BELOW_MIN: 2, OK: 0, NONE: -1 };

function statusMeta(s: Status): { label: string; color: string; bg: string } {
  switch (s) {
    case "OUT_OF_STOCK": return { label: "Out of stock", color: "#EF4444", bg: "rgba(239,68,68,0.12)" };
    case "BELOW_MIN": return { label: "Below min", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" };
    case "REFILL_NEEDED": return { label: "Refill needed", color: "#FFD600", bg: "rgba(255,214,0,0.12)" };
    case "OK": return { label: "OK", color: "#22C55E", bg: "rgba(34,197,94,0.12)" };
    default: return { label: "Not counted", color: "#75767C", bg: "rgba(255,255,255,0.05)" };
  }
}

function deriveStatus(requiresRefill: boolean, min: number, qty: number): Status {
  if (qty === 0) return "OUT_OF_STOCK";
  if (qty < min) return requiresRefill ? "REFILL_NEEDED" : "BELOW_MIN";
  return "OK";
}

function resultToStatus(r: InventoryChecklistItemResult): Status {
  return r === "PENDING" ? "NONE" : r;
}

const toInt = (s: string) => {
  const n = Number.parseInt(s.trim(), 10);
  return Number.isFinite(n) ? n : NaN;
};

const errText = (e: unknown, fallback: string) =>
  e instanceof ApiError ? (e.status === 0 ? "Can't reach the inventory API." : `${e.message}${e.field ? ` (${e.field})` : ""}`) : fallback;

// ── Shared styles ────────────────────────────────────────────
const inputStyle: CSSProperties = { boxSizing: "border-box", width: "100%", height: 34, padding: "0 11px", background: "#191919", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, fontSize: 12.5, color: "#F1F1F1", fontFamily: "var(--font-body)", outline: "none" };
const monoInputStyle: CSSProperties = { ...inputStyle, fontFamily: "var(--font-mono)", fontSize: 13, textAlign: "right" as const };
const selectStyle: CSSProperties = { ...inputStyle };
const fieldLabel: CSSProperties = { fontSize: 11, color: "#9B9B9B", marginBottom: 5 };
const fieldHint: CSSProperties = { marginTop: 6, fontSize: 11, color: "#75767C", lineHeight: 1.4 };
const kicker: CSSProperties = { fontSize: 10.5, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em" };

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} style={{ boxSizing: "border-box", width: 40, height: 23, borderRadius: 9999, border: "none", padding: 2, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: on ? "flex-end" : "flex-start", background: on ? "#FF5C1A" : "#3A3A3A", transition: "background 140ms ease" }}>
      <span style={{ width: 19, height: 19, borderRadius: 9999, background: "#fff", display: "block" }} />
    </button>
  );
}

function FormError({ msg }: { msg: string }) {
  return <div style={{ padding: "9px 11px", borderRadius: 6, background: "rgba(239,68,68,0.1)", fontSize: 11.5, color: "#F87171", lineHeight: 1.4 }}>{msg}</div>;
}

const spinner: CSSProperties = { width: 16, height: 16, borderRadius: "9999px", boxSizing: "border-box", border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "#FF5C1A", animation: "zspin 0.7s linear infinite" };

export function StockScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("stock");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [places, setPlaces] = useState<InventoryPlace[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [stocks, setStocks] = useState<InventoryStock[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [checklist, setChecklist] = useState<InventoryChecklistWithItems | null>(null);
  const [checkDate, setCheckDate] = useState(() => floridaDate());
  const [checklistBusy, setChecklistBusy] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // Returns true if the error was an auth failure (redirected to login).
  const guardAuth = useCallback((e: unknown): boolean => {
    if (e instanceof ApiError && e.status === 401) {
      clearManagerSession();
      router.replace("/login");
      return true;
    }
    return false;
  }, [router]);

  const load = useCallback(async () => {
    const my = ++reqId.current;
    setLoading(true);
    setError("");
    try {
      const [pl, pr, st, al] = await Promise.all([
        listInventoryPlaces(), listInventoryProducts(), listInventoryStocks(),
        listInventoryAlerts({ status: "OPEN" }),
      ]);
      if (my !== reqId.current) return;
      setPlaces(pl); setProducts(pr); setStocks(st); setAlerts(al);
    } catch (e) {
      if (my !== reqId.current) return;
      if (!guardAuth(e)) setError(errText(e, "Couldn't load inventory."));
    } finally {
      if (my === reqId.current) setLoading(false);
    }
  }, [guardAuth]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Refetch just the stock-derived data after a mutation (keeps KPIs/alerts fresh).
  const reloadStocks = useCallback(async () => {
    try {
      const [st, al] = await Promise.all([
        listInventoryStocks(), listInventoryAlerts({ status: "OPEN" }),
      ]);
      setStocks(st); setAlerts(al);
    } catch { /* surfaced by the caller's flash */ }
  }, []);

  // ── Checklist loading (per selected date) ──────────────────
  const loadChecklist = useCallback(async (date: string) => {
    setChecklistBusy(true);
    try {
      let cl = await getTodayChecklist(date);
      if (!cl) cl = await openDailyChecklist(date);
      setChecklist(cl);
    } catch (e) {
      if (!guardAuth(e)) { flash(errText(e, "Couldn't load the checklist.")); setChecklist(null); }
    } finally {
      setChecklistBusy(false);
    }
  }, [flash, guardAuth]);

  useEffect(() => {
    if (tab !== "checklist") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChecklist(checkDate);
  }, [tab, checkDate, loadChecklist]);

  // ── Derived ────────────────────────────────────────────────
  const productById = useCallback((id: string) => products.find((p) => p.id === id), [products]);
  const placeById = useCallback((id: string) => places.find((p) => p.id === id), [places]);
  const stockMap = useMemo(() => {
    const m = new Map<string, InventoryStock>();
    stocks.forEach((s) => m.set(`${s.productId}:${s.placeId}`, s));
    return m;
  }, [stocks]);
  const trackedPlaceIds = useCallback((productId: string) => stocks.filter((s) => s.productId === productId).map((s) => s.placeId), [stocks]);

  const productRowStatus = useCallback((p: InventoryProduct): Status => {
    let worst: Status = "NONE";
    stocks.filter((s) => s.productId === p.id).forEach((s) => {
      const st = deriveStatus(p.requiresRefill, s.minQuantity, s.currentQuantity);
      if ((ORDER[st] ?? 0) > (ORDER[worst] ?? -1)) worst = st;
    });
    return worst === "NONE" ? "OK" : worst;
  }, [stocks]);

  const kpis = useMemo(() => {
    let out = 0, low = 0, refill = 0;
    products.forEach((p) => {
      if (!stocks.some((s) => s.productId === p.id)) return;
      const st = productRowStatus(p);
      if (st === "OUT_OF_STOCK") out++;
      else if (st === "BELOW_MIN") low++;
      else if (st === "REFILL_NEEDED") refill++;
    });
    return [
      { label: "Out of stock", value: out, sub: "products", color: "#EF4444" },
      { label: "Below min", value: low, sub: "products", color: "#F59E0B" },
      { label: "Refill needed", value: refill, sub: "products", color: "#FFD600" },
      { label: "Open alerts", value: alerts.length, sub: "unresolved", color: "#F1F1F1", dot: "#FF5C1A" },
    ];
  }, [products, stocks, alerts.length, productRowStatus]);

  const q = search.trim().toLowerCase();
  const activePlaces = useMemo(() => places.filter((p) => p.active), [places]);
  const gridCols = `minmax(180px,1fr) repeat(${Math.max(1, activePlaces.length)}, minmax(84px,110px))`;
  const searchVisible = searchOpen || !!search;

  // ── Form helpers ───────────────────────────────────────────
  const patchForm = (patch: Record<string, unknown>) => setForm((f) => (f ? ({ ...f, ...patch, error: "" } as Form) : f));
  const setFormError = (msg: string) => setForm((f) => (f ? ({ ...f, error: msg, busy: false } as Form) : f));

  const openTrackForm = (productId?: string, placeId?: string) => {
    const prod = productId ? productById(productId) : products[0];
    setForm({ kind: "stock", productId: productId || products[0]?.id || "", placeId: placeId || activePlaces[0]?.id || places[0]?.id || "", qty: "", min: String(prod?.minQuantity ?? 0), inChecklist: true, notifyBelowThreshold: false, error: "", busy: false });
  };
  const openAdjustForm = (productId: string, placeId: string) => {
    const otherPlace = activePlaces.find((pl) => pl.id !== placeId);
    setForm({ kind: "adjust", productId, placeId, movement: "add", toPlaceId: otherPlace?.id || placeId, qty: "", error: "", busy: false });
  };
  const openNew = () => {
    // New product/place drawers show only the Name field — the API's other required
    // fields get sensible defaults (unit "un", minQuantity 0, type FRIDGE); everything
    // else is refined afterwards in the edit drawer.
    if (tab === "products") setForm({ kind: "product", name: "", unit: "un", minQuantity: "0", alertThreshold: "", requiresRefill: false, active: true, notes: "", error: "", busy: false });
    else if (tab === "places") setForm({ kind: "place", name: "", type: "FRIDGE", active: true, displayOrder: "", notes: "", error: "", busy: false });
    else openTrackForm();
  };

  // ── Save ───────────────────────────────────────────────────
  const saveForm = async () => {
    if (!form || form.busy) return;
    const f = form;
    setForm({ ...f, busy: true, error: "" } as Form);
    try {
      if (f.kind === "place") {
        if (!f.name.trim()) return setFormError("Give the place a name.");
        const body = { name: f.name.trim(), type: f.type, active: f.active, displayOrder: f.displayOrder.trim() ? toInt(f.displayOrder) : null, notes: f.notes.trim() || null };
        if (f.id) { await updateInventoryPlace(f.id, body); flash("Place updated"); }
        else { await createInventoryPlace(body); flash(`Place created · ${body.name}`); }
        const pl = await listInventoryPlaces(); setPlaces(pl); setForm(null); return;
      }
      if (f.kind === "product") {
        if (!f.name.trim()) return setFormError("Give the product a name.");
        if (!f.unit.trim()) return setFormError("Set a unit (e.g. kg, ea, lb).");
        const min = toInt(f.minQuantity);
        if (Number.isNaN(min) || min < 0) return setFormError("Enter a minimum quantity (whole number).");
        const thr = f.alertThreshold.trim() ? toInt(f.alertThreshold) : null;
        if (thr !== null && (Number.isNaN(thr) || thr < 0)) return setFormError("Alert threshold must be a whole number.");
        const body = { name: f.name.trim(), unit: f.unit.trim(), minQuantity: min, alertThreshold: thr, requiresRefill: f.requiresRefill, active: f.active, notes: f.notes.trim() || null };
        if (f.id) { await updateInventoryProduct(f.id, body); flash("Product updated"); }
        else { await createInventoryProduct(body); flash(`Product created · ${body.name}. Track it at a place to start counting.`); }
        const pr = await listInventoryProducts(); setProducts(pr); setForm(null); return;
      }
      if (f.kind === "stock") {
        const qty = toInt(f.qty);
        const min = toInt(f.min);
        if (Number.isNaN(qty) || qty < 0) return setFormError("Enter a current quantity (whole number).");
        if (Number.isNaN(min) || min < 0) return setFormError("Enter a minimum for this place.");
        await upsertInventoryStock({ placeId: f.placeId, productId: f.productId, currentQuantity: qty, minQuantity: min, includeInChecklist: f.inChecklist, notifyBelowThreshold: f.notifyBelowThreshold });
        await reloadStocks();
        setForm(null);
        setTab("stock");
        flash(`${productById(f.productId)?.name ?? "Product"} tracked at ${placeById(f.placeId)?.name ?? "place"}`);
        return;
      }
      // adjust
      const row = stockMap.get(`${f.productId}:${f.placeId}`);
      const n = toInt(f.qty);
      if (Number.isNaN(n) || n <= 0) return setFormError("Enter a quantity above zero.");
      if (!row) return setFormError("This product is not tracked at that place yet.");
      const prodName = productById(f.productId)?.name ?? "Product";
      if (f.movement === "transfer") {
        if (f.toPlaceId === f.placeId) return setFormError("Pick a different destination place.");
        if (n > row.currentQuantity) return setFormError(`Only ${row.currentQuantity} on hand at ${placeById(f.placeId)?.name ?? "source"}.`);
        await transferInventoryStock({ fromPlaceId: f.placeId, toPlaceId: f.toPlaceId, productId: f.productId, quantity: n });
        flash(`Transferred ${n} ${prodName} → ${placeById(f.toPlaceId)?.name ?? "place"}`);
      } else {
        const nextQty = f.movement === "add" ? row.currentQuantity + n : row.currentQuantity - n;
        if (nextQty < 0) return setFormError(`Only ${row.currentQuantity} on hand — can't remove ${n}.`);
        await upsertInventoryStock({ placeId: f.placeId, productId: f.productId, currentQuantity: nextQty });
        flash(`${f.movement === "add" ? "Added" : "Removed"} ${n} · ${prodName}`);
      }
      await reloadStocks();
      setForm(null);
    } catch (e) {
      setFormError(errText(e, "Couldn't save."));
    }
  };

  const untrackStock = async () => {
    if (!form || form.kind !== "adjust") return;
    setForm({ ...form, busy: true, error: "" });
    try {
      await deleteInventoryStock(form.placeId, form.productId);
      await reloadStocks();
      setForm(null);
      flash("Stopped tracking at this place");
    } catch (e) {
      setFormError(errText(e, "Couldn't remove the stock row."));
    }
  };

  // ── Checklist actions ──────────────────────────────────────
  const countItem = async (itemId: string, raw: string) => {
    if (!checklist) return;
    const n = toInt(raw);
    if (Number.isNaN(n) || n < 0) return;
    try {
      const updated = await countChecklistItem(checklist.id, itemId, { countedQuantity: n });
      setChecklist(updated);
    } catch (e) {
      flash(errText(e, "Couldn't save the count."));
    }
  };
  const doSubmitChecklist = async () => {
    if (!checklist) return;
    setChecklistBusy(true);
    try {
      const updated = await submitChecklist(checklist.id);
      setChecklist(updated);
      flash("Checklist submitted");
      reloadStocks();
    } catch (e) {
      flash(errText(e, "Couldn't submit the checklist."));
    } finally {
      setChecklistBusy(false);
    }
  };

  // ── Alerts actions ─────────────────────────────────────────
  const resolveAlert = async (id: string) => {
    try { await resolveInventoryAlert(id); setAlerts((prev) => prev.filter((a) => a.id !== id)); flash("Alert resolved"); }
    catch (e) { flash(errText(e, "Couldn't resolve the alert.")); }
  };
  const ackAlert = async (id: string) => {
    try { await ackInventoryAlert(id); setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "ACKED" } : a))); flash("Alert acknowledged"); }
    catch (e) { flash(errText(e, "Couldn't acknowledge the alert.")); }
  };

  const shiftDate = (delta: number) => {
    const d = new Date(`${checkDate}T12:00:00`);
    d.setDate(d.getDate() + delta);
    setCheckDate(new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d));
  };

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "stock", label: "Stock levels" },
    { id: "products", label: "Products" },
    { id: "places", label: "Places" },
    { id: "checklist", label: "Daily checklist" },
    { id: "alerts", label: "Alerts", badge: alerts.length || undefined },
  ];
  const newLabel = tab === "products" ? "New product" : tab === "places" ? "New place" : tab === "stock" ? "Track item" : "";
  const visibleProducts = products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q));

  return (
    <div className="zp-stock" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "#202020" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 20px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#F1F1F1", letterSpacing: "-0.2px", flexShrink: 0 }}>Stock</span>
        <div style={{ display: "flex", alignItems: "center", minWidth: 0, overflowX: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 3, background: "#252525", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, flexShrink: 0 }}>
            {TABS.map((t) => (
              <button key={t.id} type="button" className="zp-stab" onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, height: 26, padding: "0 11px", border: "none", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "var(--font-body)", fontSize: 12, transition: "background 120ms cubic-bezier(0.16,1,0.3,1)", background: tab === t.id ? "rgba(255,255,255,0.08)" : "transparent", color: tab === t.id ? "#F1F1F1" : "#8A8B90", fontWeight: tab === t.id ? 500 : 400 }}>
                <span style={{ whiteSpace: "nowrap" }}>{t.label}</span>
                {t.badge != null && <span style={{ padding: "1px 6px", borderRadius: 9999, background: "rgba(255,92,26,0.16)", fontFamily: "var(--font-mono)", fontSize: 10, color: "#FF7B42" }}>{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 8 }} />
        {(tab === "stock" || tab === "products" || tab === "places") && (searchVisible ? (
          <input value={search} autoFocus onChange={(e) => setSearch(e.target.value)} onBlur={() => { if (!search) setSearchOpen(false); }} placeholder={tab === "products" ? "Search products" : tab === "places" ? "Search places" : "Search stock items"} style={{ boxSizing: "border-box", flex: "0 1 200px", minWidth: 140, height: 31, padding: "0 10px", background: "#252525", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, color: "#E8E8E8", outline: "none" }} />
        ) : (
          <button type="button" className="zp-ghost" onClick={() => setSearchOpen(true)} title="Search" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 31, height: 31, flexShrink: 0, background: "#252525", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, cursor: "pointer", color: "#9B9B9B" }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.2" stroke="currentColor" strokeWidth="1.5" /><path d="M9.2 9.2l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        ))}
        {newLabel && (
          <button type="button" className="zp-btn" onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 7, height: 31, padding: "0 12px", background: "#FF5C1A", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717", whiteSpace: "nowrap", flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1.6v8.8M1.6 6h8.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
            <span>{newLabel}</span>
          </button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", padding: "0 20px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {kpis.map((k) => (
          <div key={k.label} style={{ flex: 1, minWidth: 0, padding: "13px 20px 13px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 9999, background: k.dot ?? k.color }} />
              <span style={kicker}>{k.label}</span>
            </div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 23, color: k.color, letterSpacing: "-0.5px" }}>{loading ? "—" : k.value}</span>
              <span style={{ fontSize: 11, color: "#75767C" }}>{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#9B9B9B", fontSize: 12.5 }}><span style={spinner} /> Loading inventory…</div>
      ) : error ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
          <span style={{ fontSize: 12.5, color: "#F87171", textAlign: "center" }}>{error}</span>
          <button type="button" className="zp-ghost" onClick={load} style={{ height: 30, padding: "0 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#C7C8CC" }}>Retry</button>
        </div>
      ) : (
        <>
          {/* ── Stock levels ── */}
          {tab === "stock" && (
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 8, alignItems: "end", padding: "9px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#202020", flexShrink: 0, minWidth: 840, position: "sticky", top: 0, zIndex: 2 }}>
                <div style={kicker}>Inventory product</div>
                {activePlaces.map((p) => (
                  <div key={p.id} style={{ textAlign: "center", minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                  </div>
                ))}
              </div>
              <div>
                {visibleProducts.map((p) => (
                  <div key={p.id} className="zp-srow" style={{ display: "grid", gridTemplateColumns: gridCols, gap: 8, alignItems: "center", padding: "9px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", minWidth: 840 }}>
                    <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                        <span style={{ fontSize: 12.5, color: "#F1F1F1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                        {p.requiresRefill && <span style={{ flexShrink: 0, padding: "1px 6px", borderRadius: 9999, background: "rgba(255,214,0,0.12)", fontSize: 9.5, fontWeight: 600, color: "#FFD600", letterSpacing: "0.02em" }}>REFILL</span>}
                        {!p.active && <span style={{ flexShrink: 0, padding: "1px 6px", borderRadius: 9999, background: "rgba(255,255,255,0.06)", fontSize: 9.5, fontWeight: 600, color: "#75767C" }}>INACTIVE</span>}
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#75767C" }}>min {p.minQuantity} {p.unit}{p.alertThreshold != null ? ` · alert < ${p.alertThreshold}` : ""}</span>
                    </div>
                    {activePlaces.map((pl) => {
                      const row = stockMap.get(`${p.id}:${pl.id}`);
                      if (!row) {
                        return (
                          <div key={pl.id} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <button type="button" className="zp-scell" onClick={() => openTrackForm(p.id, pl.id)} title="Track this product here" style={{ minWidth: 0, width: "100%", height: 28, padding: "0 6px", background: "transparent", border: "1px dashed rgba(255,255,255,0.09)", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12, color: "#4A4B50" }}>+</button>
                          </div>
                        );
                      }
                      const cs = deriveStatus(p.requiresRefill, row.minQuantity, row.currentQuantity);
                      const cm = statusMeta(cs);
                      return (
                        <div key={pl.id} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <button type="button" className="zp-scell" onClick={() => openAdjustForm(p.id, pl.id)} title={`Adjust or transfer · ${cm.label} · place min ${row.minQuantity} ${p.unit}${row.notifyBelowThreshold ? " · threshold alerts on" : ""}`} style={{ minWidth: 0, width: "100%", height: 28, padding: "0 6px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", fontFamily: "var(--font-mono)", fontSize: 12, transition: "background 120ms cubic-bezier(0.16,1,0.3,1), border-color 120ms", ...(cs === "OK" ? { background: "transparent", border: "1px solid transparent", color: "#C7C8CC" } : { background: cm.bg, border: `1px solid ${cm.color}33`, color: cm.color }) }}>{row.currentQuantity}</button>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {visibleProducts.length === 0 && <div style={{ padding: 40, textAlign: "center", fontSize: 12, color: "#75767C" }}>No inventory products yet. Create one, then track it at a place.</div>}
              </div>
            </div>
          )}

          {/* ── Products ── */}
          {tab === "products" && (
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 110px 80px", gap: 10, alignItems: "center", padding: "9px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#202020", flexShrink: 0, position: "sticky", top: 0, zIndex: 2 }}>
                <div style={kicker}>Inventory product</div>
                <div style={{ ...kicker, textAlign: "right" }}>Min</div>
                <div style={{ ...kicker, textAlign: "right" }}>Alert &lt;</div>
                <div style={{ ...kicker, textAlign: "right" }}>Places</div>
              </div>
              <div>
                {visibleProducts.map((p) => (
                  <div key={p.id} className="zp-srow" onClick={() => setForm({ kind: "product", id: p.id, name: p.name, unit: p.unit, minQuantity: String(p.minQuantity), alertThreshold: p.alertThreshold != null ? String(p.alertThreshold) : "", requiresRefill: p.requiresRefill, active: p.active, notes: p.notes ?? "", error: "", busy: false })} title="Edit product" style={{ display: "grid", gridTemplateColumns: "1fr 90px 110px 80px", gap: 10, alignItems: "center", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", opacity: p.active ? 1 : 0.6 }}>
                    <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 12.5, color: "#F1F1F1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                      {p.requiresRefill && <span style={{ flexShrink: 0, padding: "1px 6px", borderRadius: 9999, background: "rgba(255,214,0,0.12)", fontSize: 9.5, fontWeight: 600, color: "#FFD600" }}>REFILL</span>}
                    </div>
                    <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "#C7C8CC" }}>{p.minQuantity} {p.unit}</div>
                    <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "#9B9B9B" }}>{p.alertThreshold != null ? `${p.alertThreshold} ${p.unit}` : "—"}</div>
                    <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "#75767C" }}>{trackedPlaceIds(p.id).length}</div>
                  </div>
                ))}
                {visibleProducts.length === 0 && <div style={{ padding: 40, textAlign: "center", fontSize: 12, color: "#75767C" }}>No inventory products match.</div>}
              </div>
            </div>
          )}

          {/* ── Places ── */}
          {tab === "places" && (
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 90px 90px", gap: 10, alignItems: "center", padding: "9px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#202020", flexShrink: 0, position: "sticky", top: 0, zIndex: 2 }}>
                <div style={kicker}>Inventory place</div>
                <div style={kicker}>Type</div>
                <div style={{ ...kicker, textAlign: "right" }}>Items</div>
                <div style={{ ...kicker, textAlign: "right" }}>Flagged</div>
              </div>
              <div>
                {places.filter((pl) => !q || pl.name.toLowerCase().includes(q)).map((pl) => {
                  const rows = stocks.filter((s) => s.placeId === pl.id);
                  const flagged = rows.filter((s) => { const p = productById(s.productId); return p && deriveStatus(p.requiresRefill, s.minQuantity, s.currentQuantity) !== "OK"; }).length;
                  return (
                    <div key={pl.id} className="zp-srow" onClick={() => setForm({ kind: "place", id: pl.id, name: pl.name, type: pl.type, active: pl.active, displayOrder: pl.displayOrder != null ? String(pl.displayOrder) : "", notes: pl.notes ?? "", error: "", busy: false })} title="Edit place" style={{ display: "grid", gridTemplateColumns: "1fr 110px 90px 90px", gap: 10, alignItems: "center", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", opacity: pl.active ? 1 : 0.6 }}>
                      <div style={{ minWidth: 0, fontSize: 12.5, color: "#F1F1F1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pl.name}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "#9B9B9B" }}>{pl.type}</div>
                      <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "#C7C8CC" }}>{rows.length}</div>
                      <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: flagged ? "#F59E0B" : "#5C5D62" }}>{flagged || "—"}</div>
                    </div>
                  );
                })}
                {places.filter((pl) => !q || pl.name.toLowerCase().includes(q)).length === 0 && <div style={{ padding: 40, textAlign: "center", fontSize: 12, color: "#75767C" }}>No places yet.</div>}
              </div>
            </div>
          )}

          {/* ── Daily checklist ── */}
          {tab === "checklist" && (
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button type="button" className="zp-ghost" onClick={() => shiftDate(-1)} title="Previous day" style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, cursor: "pointer", color: "#9B9B9B" }}>‹</button>
                  <input type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value || floridaDate())} style={{ height: 28, padding: "0 8px", background: "#252525", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 12, color: "#E8E8E8", outline: "none", colorScheme: "dark" }} />
                  <button type="button" className="zp-ghost" onClick={() => shiftDate(1)} title="Next day" style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, cursor: "pointer", color: "#9B9B9B" }}>›</button>
                </div>
                {checklist && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 22, padding: "0 9px", borderRadius: 9999, background: checklist.status === "OPEN" ? "rgba(255,214,0,0.1)" : "rgba(34,197,94,0.12)", fontSize: 10.5, fontWeight: 600, color: checklist.status === "OPEN" ? "#FFD600" : "#22C55E" }}>
                    <span style={{ width: 5, height: 5, borderRadius: 9999, background: "currentColor" }} />{checklist.status}
                  </span>
                )}
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#75767C" }}>{checklist ? `${checklist.items.filter((i) => i.countedQuantity != null).length}/${checklist.items.length} counted` : ""}</span>
                <div style={{ flex: 1, minWidth: 12 }} />
                {checklist && checklist.status === "OPEN" && (
                  <button type="button" className="zp-btn" onClick={doSubmitChecklist} disabled={checklistBusy} style={{ height: 30, padding: "0 14px", background: "#FF5C1A", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717" }}>{checklistBusy ? "Submitting…" : "Submit checklist"}</button>
                )}
              </div>

              {checklistBusy && !checklist ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#9B9B9B", fontSize: 12.5 }}><span style={spinner} /> Loading checklist…</div>
              ) : !checklist || checklist.items.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", fontSize: 12, color: "#75767C" }}>No checklist items for this date. Add stock rows with &ldquo;Include in daily checklist&rdquo; enabled.</div>
              ) : (
                <div>
                  {activePlaces.filter((pl) => checklist.items.some((it) => it.placeId === pl.id)).map((pl) => (
                    <div key={pl.id}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "#1C1C1C", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 1 }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, color: "#F1F1F1" }}>{pl.name}</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "#75767C" }}>{pl.type}</span>
                      </div>
                      {checklist.items.filter((it) => it.placeId === pl.id).map((it) => {
                        const m = statusMeta(resultToStatus(it.result));
                        const readonly = checklist.status !== "OPEN";
                        return (
                          <div key={it.id} className="zp-srow" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 110px 96px 120px", gap: 12, alignItems: "center", padding: "9px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ minWidth: 0, fontSize: 12.5, color: "#F1F1F1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.productName}</div>
                            <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "#75767C" }}>min {it.expectedMinQuantity}</div>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <input
                                defaultValue={it.countedQuantity != null ? String(it.countedQuantity) : ""}
                                key={`${it.id}:${it.countedQuantity ?? ""}`}
                                disabled={readonly}
                                placeholder="—"
                                inputMode="numeric"
                                onBlur={(e) => { if (!readonly && e.target.value.trim() !== "" && toInt(e.target.value) !== it.countedQuantity) countItem(it.id, e.target.value); }}
                                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                                style={{ boxSizing: "border-box", width: 80, height: 30, padding: "0 10px", background: readonly ? "transparent" : "#252525", border: `1px solid ${readonly ? "transparent" : "rgba(255,255,255,0.09)"}`, borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 12.5, color: "#F1F1F1", textAlign: "right", outline: "none" }}
                              />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", height: 20, padding: "0 9px", borderRadius: 9999, fontSize: 11, fontWeight: 500, background: m.bg, color: m.color }}>{it.result === "PENDING" ? "Pending" : m.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Alerts ── */}
          {tab === "alerts" && (
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "96px minmax(100px,1fr) 104px 92px 78px 150px", gap: 8, alignItems: "center", padding: "9px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#202020", flexShrink: 0, position: "sticky", top: 0, zIndex: 2 }}>
                <div style={kicker}>Type</div>
                <div style={kicker}>Item</div>
                <div style={kicker}>Place</div>
                <div style={kicker}>Severity</div>
                <div style={kicker}>Status</div>
                <div />
              </div>
              <div>
                {alerts.map((a) => {
                  const tone = a.type === "REFILL" ? { c: "#FFD600", b: "rgba(255,214,0,0.12)" } : a.type === "THRESHOLD" ? { c: "#F59E0B", b: "rgba(245,158,11,0.12)" } : { c: "#EF4444", b: "rgba(239,68,68,0.12)" };
                  return (
                    <div key={a.id} className="zp-srow" style={{ display: "grid", gridTemplateColumns: "96px minmax(100px,1fr) 104px 92px 78px 150px", gap: 8, alignItems: "center", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div><span style={{ display: "inline-block", padding: "2px 9px", borderRadius: 9999, background: tone.b, fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500, color: tone.c }}>{a.type.replace("_", " ")}</span></div>
                      <div style={{ minWidth: 0, fontSize: 12.5, color: "#F1F1F1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={a.message}>{a.productName}</div>
                      <div style={{ minWidth: 0, fontSize: 12, color: "#9B9B9B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.placeName}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#9B9B9B" }}>{a.severity}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: a.status === "OPEN" ? "#F59E0B" : "#75767C" }}>{a.status}</div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                        {a.status === "OPEN" && <button type="button" className="zp-ghost" onClick={() => ackAlert(a.id)} style={{ height: 26, padding: "0 10px", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9999, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11, color: "#9B9B9B" }}>Ack</button>}
                        <button type="button" className="zp-ghost" onClick={() => resolveAlert(a.id)} style={{ height: 26, padding: "0 10px", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9999, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11, color: "#9B9B9B" }}>Resolve</button>
                      </div>
                    </div>
                  );
                })}
                {alerts.length === 0 && <div style={{ padding: 40, textAlign: "center", fontSize: 12, color: "#75767C" }}>No open alerts.</div>}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Drawer (forms) ── */}
      {form && (
        <div className="zp-drawer-overlay" onClick={() => setForm(null)} style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", justifyContent: "flex-end", background: "rgba(0,0,0,0.45)" }}>
          <div className="zp-drawer-panel" onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: "94vw", height: "100%", display: "flex", flexDirection: "column", background: "#202020", borderLeft: "1px solid rgba(255,255,255,0.1)", boxShadow: "-8px 0 24px rgba(0,0,0,0.35)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
              <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#F1F1F1" }}>{drawerTitle(form)}</span>
              <button type="button" onClick={() => setForm(null)} style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, cursor: "pointer", flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="#9B9B9B" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto" }}>
              {form.kind === "adjust" && (
                <AdjustBody form={form} products={products} places={activePlaces} stockMap={stockMap} placeName={(id) => placeById(id)?.name ?? id} onPatch={patchForm} />
              )}
              {form.kind === "stock" && (
                <StockFormBody form={form} products={products} places={activePlaces} onPatch={patchForm} />
              )}
              {form.kind === "place" && (
                <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <label style={{ display: "block" }}><div style={fieldLabel}>Name</div><input value={form.name} onChange={(e) => patchForm({ name: e.target.value })} placeholder="e.g. Walk-in fridge" className="zp-input" style={inputStyle} autoFocus /></label>
                  {form.id && (
                    <>
                      <div><div style={fieldLabel}>Type</div><select value={form.type} onChange={(e) => patchForm({ type: e.target.value as InventoryPlaceType })} className="zp-input" style={selectStyle}>{PLACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                      <label style={{ display: "block" }}><div style={fieldLabel}>Display order</div><input value={form.displayOrder} onChange={(e) => patchForm({ displayOrder: e.target.value })} placeholder="Optional" className="zp-input" style={monoInputStyle} /></label>
                      <label style={{ display: "block" }}><div style={fieldLabel}>Notes</div><input value={form.notes} onChange={(e) => patchForm({ notes: e.target.value })} placeholder="Optional" className="zp-input" style={inputStyle} /></label>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ minWidth: 0 }}><div style={{ fontSize: 12.5, color: "#F1F1F1" }}>Active</div><div style={{ fontSize: 11.5, color: "#75767C", marginTop: 2, lineHeight: 1.4 }}>Inactive places are hidden from the stock matrix.</div></div>
                        <Toggle on={form.active} onToggle={() => patchForm({ active: !form.active })} />
                      </div>
                    </>
                  )}
                  {form.error && <FormError msg={form.error} />}
                </div>
              )}
              {form.kind === "product" && (
                <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <label style={{ display: "block" }}><div style={fieldLabel}>Name</div><input value={form.name} onChange={(e) => patchForm({ name: e.target.value })} placeholder="e.g. Brioche buns" className="zp-input" style={inputStyle} autoFocus /></label>
                  {form.id && (
                    <>
                      <label style={{ display: "block" }}><div style={fieldLabel}>Unit</div><input value={form.unit} onChange={(e) => patchForm({ unit: e.target.value })} placeholder="e.g. kg, ea, lb" className="zp-input" style={inputStyle} /></label>
                      <label style={{ display: "block" }}><div style={fieldLabel}>Minimum quantity</div><input value={form.minQuantity} onChange={(e) => patchForm({ minQuantity: e.target.value })} placeholder="0" className="zp-input" style={monoInputStyle} /><div style={fieldHint}>Default minimum applied to new stock rows.</div></label>
                      <label style={{ display: "block" }}><div style={fieldLabel}>Alert threshold</div><input value={form.alertThreshold} onChange={(e) => patchForm({ alertThreshold: e.target.value })} placeholder="Optional" className="zp-input" style={monoInputStyle} /><div style={fieldHint}>Opens a THRESHOLD alert when a place drops below this.</div></label>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ minWidth: 0 }}><div style={{ fontSize: 12.5, color: "#F1F1F1" }}>Requires refill</div><div style={{ fontSize: 11.5, color: "#75767C", marginTop: 2, lineHeight: 1.4 }}>Below-min counts raise a REFILL flag instead of BELOW_MIN.</div></div>
                        <Toggle on={form.requiresRefill} onToggle={() => patchForm({ requiresRefill: !form.requiresRefill })} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ minWidth: 0 }}><div style={{ fontSize: 12.5, color: "#F1F1F1" }}>Active</div><div style={{ fontSize: 11.5, color: "#75767C", marginTop: 2, lineHeight: 1.4 }}>Inactive products stay hidden from new counts.</div></div>
                        <Toggle on={form.active} onToggle={() => patchForm({ active: !form.active })} />
                      </div>
                    </>
                  )}
                  {form.error && <FormError msg={form.error} />}
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
              {form.kind === "adjust" && stockMap.has(`${form.productId}:${form.placeId}`) && (
                <button type="button" onClick={untrackStock} disabled={form.busy} style={{ height: 32, padding: "0 12px", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#F87171" }}>Stop tracking</button>
              )}
              <div style={{ flex: 1 }} />
              <button type="button" className="zp-ghost" onClick={() => setForm(null)} style={{ height: 32, padding: "0 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#9B9B9B" }}>Cancel</button>
              <button type="button" className="zp-btn" onClick={saveForm} disabled={form.busy} style={{ height: 32, padding: "0 16px", background: "#FF5C1A", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717" }}>{form.busy ? "Saving…" : saveLabel(form)}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="zp-toast" style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 80, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#2F2F2F", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
          <span style={{ width: 6, height: 6, borderRadius: 9999, background: "#FF5C1A" }} />
          <span style={{ fontSize: 12.5, color: "#F1F1F1" }}>{toast}</span>
        </div>
      )}
    </div>
  );
}

function drawerTitle(f: Form): string {
  if (f.kind === "adjust") return "Adjust stock";
  if (f.kind === "product") return f.id ? "Edit inventory product" : "New inventory product";
  if (f.kind === "place") return f.id ? "Edit inventory place" : "New inventory place";
  return "Track product at a place";
}
function saveLabel(f: Form): string {
  if (f.kind === "adjust") return f.movement === "transfer" ? "Transfer" : f.movement === "add" ? "Add stock" : "Remove stock";
  if ((f.kind === "product" || f.kind === "place") && f.id) return "Save changes";
  return "Create";
}

function StockFormBody({ form, products, places, onPatch }: { form: Extract<Form, { kind: "stock" }>; products: InventoryProduct[]; places: InventoryPlace[]; onPatch: (patch: Record<string, unknown>) => void }) {
  const prod = products.find((p) => p.id === form.productId);
  return (
    <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div><div style={fieldLabel}>Inventory product</div><select value={form.productId} onChange={(e) => { const np = products.find((p) => p.id === e.target.value); onPatch({ productId: e.target.value, min: String(np?.minQuantity ?? 0) }); }} className="zp-input" style={selectStyle}>{products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}</select></div>
      <div><div style={fieldLabel}>Inventory place</div><select value={form.placeId} onChange={(e) => onPatch({ placeId: e.target.value })} className="zp-input" style={selectStyle}>{places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <label style={{ display: "block" }}><div style={fieldLabel}>Current quantity</div><input value={form.qty} onChange={(e) => onPatch({ qty: e.target.value })} placeholder="0" className="zp-input" style={monoInputStyle} /><div style={fieldHint}>In {prod?.unit ?? "units"}.</div></label>
      <label style={{ display: "block" }}><div style={fieldLabel}>Minimum at this place</div><input value={form.min} onChange={(e) => onPatch({ min: e.target.value })} placeholder="0" className="zp-input" style={monoInputStyle} /><div style={fieldHint}>Product default is {prod?.minQuantity ?? 0} {prod?.unit ?? ""}.</div></label>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}><div style={{ fontSize: 12.5, color: "#F1F1F1" }}>Include in daily checklist</div><div style={{ fontSize: 11.5, color: "#75767C", marginTop: 2, lineHeight: 1.4 }}>Appears in the morning count for this place.</div></div>
        <Toggle on={form.inChecklist} onToggle={() => onPatch({ inChecklist: !form.inChecklist })} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}><div style={{ fontSize: 12.5, color: "#F1F1F1" }}>Notify below alert threshold</div><div style={{ fontSize: 11.5, color: "#75767C", marginTop: 2, lineHeight: 1.4 }}>Opens a THRESHOLD alert under {prod?.alertThreshold ?? 0} {prod?.unit ?? ""}.</div></div>
        <Toggle on={form.notifyBelowThreshold} onToggle={() => onPatch({ notifyBelowThreshold: !form.notifyBelowThreshold })} />
      </div>
      {form.error && <FormError msg={form.error} />}
    </div>
  );
}

function AdjustBody({ form, products, places, stockMap, placeName, onPatch }: {
  form: Extract<Form, { kind: "adjust" }>; products: InventoryProduct[]; places: InventoryPlace[];
  stockMap: Map<string, InventoryStock>; placeName: (id: string) => string; onPatch: (patch: Record<string, unknown>) => void;
}) {
  const prod = products.find((p) => p.id === form.productId);
  const row = stockMap.get(`${form.productId}:${form.placeId}`);
  const trackedProducts = products.filter((p) => products.length && stockMapHasProduct(stockMap, p.id));
  const trackedPlaces = places.filter((pl) => stockMap.has(`${form.productId}:${pl.id}`));
  const n = Number.parseInt(form.qty.trim(), 10);
  const valid = Number.isFinite(n) && n > 0 && !!row;
  const next = valid && row ? (form.movement === "add" ? row.currentQuantity + n : form.movement === "remove" ? row.currentQuantity - n : row.currentQuantity - n) : null;
  const bad = valid && next != null && next < 0;

  return (
    <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div><div style={fieldLabel}>Inventory product</div><select value={form.productId} onChange={(e) => { const first = places.find((pl) => stockMap.has(`${e.target.value}:${pl.id}`)); onPatch({ productId: e.target.value, placeId: first?.id ?? form.placeId }); }} className="zp-input" style={selectStyle}>{trackedProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <div><div style={fieldLabel}>Place</div><select value={form.placeId} onChange={(e) => onPatch({ placeId: e.target.value })} className="zp-input" style={selectStyle}>{trackedPlaces.map((pl) => <option key={pl.id} value={pl.id}>{pl.name}</option>)}</select></div>
      <div>
        <div style={fieldLabel}>Movement</div>
        <div style={{ display: "flex", gap: 6 }}>
          {([{ id: "add", label: "Add" }, { id: "remove", label: "Remove" }, { id: "transfer", label: "Transfer" }] as const).map((o) => (
            <button key={o.id} type="button" onClick={() => onPatch({ movement: o.id })} style={{ flex: 1, padding: "9px 10px", borderRadius: 7, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, ...(form.movement === o.id ? { background: "rgba(255,92,26,0.12)", border: "1px solid rgba(255,92,26,0.5)", color: "#FF7A44" } : { background: "#191919", border: "1px solid rgba(255,255,255,0.08)", color: "#C7C8CC" }) }}>{o.label}</button>
          ))}
        </div>
      </div>
      {form.movement === "transfer" && (
        <div><div style={fieldLabel}>To place</div><select value={form.toPlaceId} onChange={(e) => onPatch({ toPlaceId: e.target.value })} className="zp-input" style={selectStyle}>{places.filter((pl) => pl.id !== form.placeId).map((pl) => <option key={pl.id} value={pl.id}>{pl.name}</option>)}</select></div>
      )}
      <label style={{ display: "block" }}>
        <div style={fieldLabel}>Quantity</div>
        <input value={form.qty} onChange={(e) => onPatch({ qty: e.target.value })} placeholder="0" className="zp-input" style={monoInputStyle} />
        <div style={{ ...fieldHint, color: bad ? "#F87171" : "#75767C" }}>
          {row ? `On hand: ${row.currentQuantity} ${prod?.unit ?? ""}${valid ? ` → ${next} ${prod?.unit ?? ""}` : ""}${form.movement === "transfer" && valid ? ` · ${placeName(form.toPlaceId)} +${n}` : ""}` : "Not tracked at this place."}
        </div>
      </label>
      {form.error && <FormError msg={form.error} />}
    </div>
  );
}

function stockMapHasProduct(stockMap: Map<string, InventoryStock>, productId: string): boolean {
  for (const key of stockMap.keys()) if (key.startsWith(`${productId}:`)) return true;
  return false;
}
