"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ApiError, createCategory, detachCategoryFromMenu, createMenu as apiCreateMenu, createProduct, listMenus, updateMenu, createProgressiveDiscount, listProducts, listProgressiveDiscounts, menuPreviewUrl, toAbsoluteImageUrl, updateCategory, updateProduct, updateProgressiveDiscount } from "../../lib/api";
import type { ApiCategory, ApiProduct, CreateProductBody, ProgressiveDiscount, SquareCatalogSyncTask, UpdateProductBody } from "../../lib/api";
import { clearManagerSession, getManagerBusinessId, getManagerToken } from "../../lib/auth";
import { clone, initials, money, parseMoney, statusChip, thumbStyle } from "./data";
import type { FlatProduct, Lang, MediaItem, Menu, ModifierGroup, PrepTask, ProductDraft } from "./data";
import { UNCATEGORIZED, categoryNameById, centsToDollars, deriveModifierLibrary, mapProductToDraft, prepLibraryFromLookup, sectionOf, sectionTitles } from "./mapping";
import { ProductDetail } from "./ProductDetail";
import { ProductCreator } from "./ProductCreator";
import type { CreatorDraft } from "./ProductCreator";
import { Popover } from "../_components/Popover";
import { Menu as ActionMenu, MenuItem } from "../_components/Menu";
import { SquareSyncToasts, useSquareSync } from "./SyncToast";
import { ProgressiveDiscountPanel, draftFromDiscount, pdSummary, stepsToInput } from "./ProgressiveDiscountPanel";
import { ProgressiveDiscountPicker } from "./ProgressiveDiscountPicker";
import { comboIssues } from "./ComboComposition";
import type { DiscountDraft } from "./ProgressiveDiscountPanel";

function baseDraftFromFlat(p: FlatProduct): ProductDraft {
  return {
    names: { en: p.rawName, es: "", pt: "" },
    descriptions: { en: p.rawDescription, es: "", pt: "" },
    active: p.rawActive,
    alertDriver: p.rawAlertDriver,
    type: "single",
    media: [],
    price: p.rawPrice.toFixed(2),
    comparedAt: p.rawComparedAt > p.rawPrice ? p.rawComparedAt.toFixed(2) : "",
    modifiers: [],
    tasks: [],
    taxes: [],
    comboFixed: [],
    comboSlots: [],
  };
}

const spinner: CSSProperties = { width: 18, height: 18, borderRadius: "9999px", boxSizing: "border-box", border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "#FF5C1A", animation: "zspin 0.7s linear infinite" };
const rowMenuItemStyle: CSSProperties = { display: "flex", alignItems: "center", width: "100%", height: 30, padding: "0 8px", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#F1F1F1", textAlign: "left" };

export function ProductsScreen() {
  const router = useRouter();
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reqId = useRef(0);
  const panelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionReorderDirty = useRef(false);
  const latestSectionOrder = useRef<string[] | null>(null);
  const draggedSectionTitle = useRef<string | null>(null);
  const productReorderDirty = useRef(false);
  const latestProductOrder = useRef<string[] | null>(null);
  const draggedProduct = useRef<{ id: string; section: string } | null>(null);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  // Detail-panel enter/exit animation: closed → entering → open → exiting → closed.
  const [panelPhase, setPanelPhase] = useState<"closed" | "entering" | "open" | "exiting">("closed");
  const [edits, setEdits] = useState<Record<string, ProductDraft>>({});
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [baseline, setBaseline] = useState<ProductDraft | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [sectionMoves, setSectionMoves] = useState<Record<string, string>>({});
  const [detached, setDetached] = useState<Record<string, boolean>>({});
  const [order, setOrder] = useState<string[] | null>(null);
  const [productOrder, setProductOrder] = useState<Record<string, string[]>>({});

  // Real menus from GET /menus. "Active" is the API's `isDefault` — the menu the
  // storefront serves. `currentMenu` is the one being viewed/edited here; empty
  // until the menus load, which makes the first product fetch use the default.
  const [menus, setMenus] = useState<Menu[]>([]);
  const [currentMenu, setCurrentMenu] = useState("");
  const [activeMenu, setActiveMenu] = useState("");
  const [menuPickerOpen, setMenuPickerOpen] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [menuBusy, setMenuBusy] = useState(false);
  const [menuError, setMenuError] = useState("");

  // "Add section": attach a section from another menu, or create a new one.
  const [allCategories, setAllCategories] = useState<ApiCategory[]>([]);
  const [secPickerOpen, setSecPickerOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [sectionBusy, setSectionBusy] = useState(false);
  const [sectionError, setSectionError] = useState("");

  const [reorderOpen, setReorderOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [prodReorder, setProdReorder] = useState<string | null>(null);
  const [prodDragIndex, setProdDragIndex] = useState<number | null>(null);
  const [addPicker, setAddPicker] = useState<string | null>(null);
  const [addSearch, setAddSearch] = useState("");
  const [creator, setCreator] = useState<CreatorDraft | null>(null);

  const [modifierLibrary, setModifierLibrary] = useState<ModifierGroup[]>([]);
  const [prepLibrary, setPrepLibrary] = useState<PrepTask[]>([]);

  // ── Square catalog sync (toast-driven, poll-based) ───────
  const { toasts, track: trackSquareSync, trackMany: trackSquareSyncMany, retry: retrySquareSync, dismiss: dismissSquareSync } = useSquareSync();

  // ── Fetch real products + categories ─────────────────────
  const load = useCallback(() => {
    const token = getManagerToken();
    const businessId = getManagerBusinessId();
    if (!token) {
      router.replace("/login");
      return;
    }
    const my = ++reqId.current;
    setLoading(true);
    setError("");
    listProducts(token, businessId, currentMenu || null)
      .then((res) => {
        if (my !== reqId.current) return;
        const products = Array.isArray(res?.products) ? res.products : [];
        setApiProducts(products);
        setCategories(res?.lookup?.categories ?? []);
        setAllCategories(res?.lookup?.allCategories ?? res?.lookup?.categories ?? []);
        setModifierLibrary(deriveModifierLibrary(products));
        setPrepLibrary(prepLibraryFromLookup(res?.lookup?.preparationSteps ?? []));
      })
      .catch((err) => {
        if (my !== reqId.current) return;
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
          return;
        }
        setError(err instanceof ApiError && err.status === 0 ? "Can't reach the server." : "Couldn't load products.");
      })
      .finally(() => {
        if (my === reqId.current) setLoading(false);
      });
  }, [router, currentMenu]);

  // ── Fetch menus once; start on the storefront's (default) menu ──
  useEffect(() => {
    const token = getManagerToken();
    if (!token) return;
    listMenus(token, getManagerBusinessId())
      .then((list) => {
        const items = Array.isArray(list) ? list : [];
        setMenus(items.map((m) => ({ id: m.id, name: m.name, progressiveDiscountId: m.progressiveDiscountId ?? null })));
        const def = items.find((m) => m.isDefault) ?? items[0];
        if (def) {
          setActiveMenu(def.id);
          setCurrentMenu((cur) => cur || def.id);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
        }
      });
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // ── Derived ──────────────────────────────────────────────
  const productById = useMemo(() => new Map(apiProducts.map((p) => [p.id, p])), [apiProducts]);
  const catNames = useMemo(() => categoryNameById(categories), [categories]);

  const flat: FlatProduct[] = useMemo(() => {
    const out: FlatProduct[] = [];
    const overlay = (id: string, rawName: string, rawPrice: number, rawComparedAt: number, rawActive: boolean, rawAlertDriver: boolean, rawDescription: string, section: string, basePhotoUrl: string | null) => {
      const e = edits[id];
      out.push({
        id,
        section: sectionMoves[id] || section,
        rawName, rawPrice, rawComparedAt, rawActive, rawAlertDriver, rawDescription,
        name: e ? e.names.en || rawName : rawName,
        price: e ? parseMoney(e.price) : rawPrice,
        comparedAt: e ? (e.comparedAt ? parseMoney(e.comparedAt) : 0) : rawComparedAt,
        active: e ? e.active : rawActive,
        description: e ? e.descriptions.en || rawDescription : rawDescription,
        photoUrl: e ? e.media.find((m) => m.url)?.url ?? null : basePhotoUrl,
      });
    };
    apiProducts.forEach((p) => {
      // Products whose categories all belong to other menus get an empty
      // section: hidden from the list, but still offered by "Add product".
      const section = sectionOf(p, catNames) ?? "";
      overlay(p.id, p.name, centsToDollars(p.price), centsToDollars(p.comparedAtPrice), p.visible, p.alertDriver, p.description ?? "", section, p.photos?.[0]?.url ?? null);
    });
    return out;
  }, [apiProducts, catNames, edits, sectionMoves]);

  const q = search.trim().toLowerCase();
  const visible = flat
    .filter((p) => p.section !== "" && !detached[p.id])
    .filter((p) => !q || p.name.toLowerCase().includes(q) || p.section.toLowerCase().includes(q));
  const selectedProduct = selected ? flat.find((p) => p.id === selected) ?? null : null;
  const split = !!(selectedProduct && draft);

  const titles = sectionTitles(categories, apiProducts);
  const sectionOrder = order ? order.filter((t) => titles.includes(t)).concat(titles.filter((t) => !order.includes(t))) : titles;

  const productOrderFor = (title: string, ids: string[]) => {
    const saved = productOrder[title];
    if (!saved) return ids;
    const kept = saved.filter((id) => ids.includes(id));
    return kept.concat(ids.filter((id) => !kept.includes(id)));
  };

  // Sections on other menus, with how many products each holds (any menu).
  const attachableSections = useMemo(() => {
    const onMenu = new Set(categories.map((c) => c.id));
    const perCategory = new Map<string, number>();
    apiProducts.forEach((p) => {
      new Set([p.categoryId, ...(p.categoryIds ?? [])].filter((id): id is string => !!id)).forEach((id) => perCategory.set(id, (perCategory.get(id) ?? 0) + 1));
    });
    return allCategories.filter((c) => !onMenu.has(c.id)).map((cat) => ({ cat, count: perCategory.get(cat.id) ?? 0 }));
  }, [allCategories, categories, apiProducts]);
  const counts: Record<string, number> = {};
  flat.forEach((p) => { if (p.section) counts[p.section] = (counts[p.section] || 0) + 1; });

  // ── Mutations ────────────────────────────────────────────
  const draftForProduct = (p: FlatProduct): ProductDraft => {
    const real = productById.get(p.id);
    return real ? mapProductToDraft(real) : baseDraftFromFlat(p);
  };
  // Switching between products while open keeps the panel; a fresh open animates in
  // (start at width/opacity 0, then promote to "open" next frame so the transition runs).
  const beginPanelEnter = () => {
    const wasOpen = panelPhase === "open";
    if (panelTimer.current) { clearTimeout(panelTimer.current); panelTimer.current = null; }
    setPanelPhase(wasOpen ? "open" : "entering");
    if (wasOpen) return;
    const promote = () => {
      if (enterTimer.current) { clearTimeout(enterTimer.current); enterTimer.current = null; }
      setPanelPhase((ph) => (ph === "entering" ? "open" : ph));
    };
    enterTimer.current = setTimeout(promote, 40);
    requestAnimationFrame(() => requestAnimationFrame(promote));
  };
  const openProduct = (p: FlatProduct) => {
    const d = edits[p.id] ? clone(edits[p.id]) : draftForProduct(p);
    setSelected(p.id);
    setDraft(d);
    setBaseline(clone(d));
    setLang("en");
    beginPanelEnter();
  };
  // ── Progressive discount ───────────────────────────────────────────────────
  // Each menu points at zero or one ladder (`Menu.progressiveDiscountId`), and
  // the storefront offers it unless the ladder is completed (see
  // `web/src/getProgressiveDiscount.ts`). Several menus may share a ladder.
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [pdPickerOpen, setPdPickerOpen] = useState(false);
  const [pdCatalog, setPdCatalog] = useState<ProgressiveDiscount[]>([]);
  const [pdOpenId, setPdOpenId] = useState<string | null>(null);
  const [pdDraft, setPdDraft] = useState<DiscountDraft>({ completed: false, steps: [] });
  const [pdLoading, setPdLoading] = useState(false);
  const [pdError, setPdError] = useState("");
  const [pdBusy, setPdBusy] = useState(false);
  const [pdSaving, setPdSaving] = useState(false);
  const [pdSaveError, setPdSaveError] = useState("");
  const [pdReload, setPdReload] = useState(0);

  // The ladder attached to the menu being edited (none is allowed). It may be
  // completed, in which case customers aren't offered it.
  const pdAttachedId = menus.find((m) => m.id === currentMenu)?.progressiveDiscountId ?? null;
  const pdActive = pdAttachedId ? pdCatalog.find((d) => d.id === pdAttachedId) ?? null : null;
  const pdLive = !!pdActive && !pdActive.completed;
  const pdEditing = pdOpenId ? pdCatalog.find((d) => d.id === pdOpenId) ?? null : null;

  const pdAuth = (): { businessId: string | null; token: string } | null => {
    const token = getManagerToken();
    if (!token) {
      router.replace("/login");
      return null;
    }
    return { token, businessId: getManagerBusinessId() };
  };

  const pdOnError = (err: unknown, fallback: string): string => {
    if (err instanceof ApiError && err.status === 401) {
      clearManagerSession();
      router.replace("/login");
      return "";
    }
    if (err instanceof ApiError && err.status === 0) return "Can't reach the server.";
    const field = err instanceof ApiError ? err.field : undefined;
    return field ? `The API rejected ${field}.` : fallback;
  };

  // Loads on mount (the toolbar button shows this menu's ladder), and again
  // whenever the picker opens or on retry.
  useEffect(() => {
    const token = getManagerToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    /* eslint-disable react-hooks/set-state-in-effect */
    setPdLoading(true);
    setPdError("");
    /* eslint-enable react-hooks/set-state-in-effect */
    let alive = true;
    listProgressiveDiscounts(token, getManagerBusinessId())
      .then((res) => { if (alive) setPdCatalog(res); })
      .catch((err) => { if (alive) setPdError(pdOnError(err, "Couldn't load progressive discounts.")); })
      .finally(() => { if (alive) setPdLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdPickerOpen, pdReload, router]);

  const openPd = (id: string) => {
    const found = pdCatalog.find((d) => d.id === id);
    if (!found) return;
    closeDetail();
    setPdOpenId(id);
    setPdDraft(draftFromDiscount(found));
    setPdSaveError("");
    setPdPickerOpen(false);
  };

  /** Point the current menu at `id` (or nothing), then refresh menus' attachments. */
  const attachPd = (auth: { businessId: string | null; token: string }, id: string | null) =>
    updateMenu(auth.token, currentMenu, { progressiveDiscountId: id }, auth.businessId).then((m) => {
      setMenus((prev) => prev.map((x) => (x.id === m.id ? { ...x, progressiveDiscountId: m.progressiveDiscountId ?? null } : x)));
    });

  const refreshPd = (auth: { businessId: string | null; token: string }) =>
    listProgressiveDiscounts(auth.token, auth.businessId).then((res) => {
      setPdCatalog(res);
      const refreshed = res.find((d) => d.id === pdOpenId);
      if (refreshed) setPdDraft(draftFromDiscount(refreshed));
      return res;
    });

  /** Run `id` on this menu. A completed ladder is reopened, or it would stay hidden. */
  const activatePd = (id: string) => {
    const auth = pdAuth();
    if (!auth || !currentMenu) return;
    setPdBusy(true);
    setPdError("");
    const target = pdCatalog.find((d) => d.id === id);
    Promise.all([
      attachPd(auth, id),
      ...(target?.completed ? [updateProgressiveDiscount(auth.token, id, { completed: false }, auth.businessId)] : []),
    ])
      .then(() => refreshPd(auth))
      .catch((err) => setPdError(pdOnError(err, "Couldn't attach that discount.")))
      .finally(() => setPdBusy(false));
  };

  /** This menu stops running a ladder; other menus keep theirs. */
  const deactivatePd = () => {
    const auth = pdAuth();
    if (!auth || !currentMenu) return;
    setPdBusy(true);
    setPdError("");
    attachPd(auth, null)
      .then(() => refreshPd(auth))
      .catch((err) => setPdError(pdOnError(err, "Couldn't detach the discount.")))
      .finally(() => setPdBusy(false));
  };

  const createPd = () => {
    const auth = pdAuth();
    if (!auth || !currentMenu) return;
    setPdBusy(true);
    setPdError("");
    // Same starting ladder the design seeds a new discount with ($25 → 5% off),
    // attached to the menu it was created from.
    createProgressiveDiscount(auth.token, { completed: false, steps: [{ type: "PERCENTAGEDISCOUNT", amount: 2500, discount: 5 }] }, auth.businessId)
      .then((created) =>
        attachPd(auth, created.id)
          .then(() => listProgressiveDiscounts(auth.token, auth.businessId))
          .then((res) => {
            setPdCatalog(res);
            closeDetail();
            setPdOpenId(created.id);
            setPdDraft(draftFromDiscount(res.find((d) => d.id === created.id) ?? created));
            setPdPickerOpen(false);
          }),
      )
      .catch((err) => setPdError(pdOnError(err, "Couldn't create a progressive discount.")))
      .finally(() => setPdBusy(false));
  };

  const saveProgressiveDiscount = () => {
    const auth = pdAuth();
    if (!auth || !pdEditing) return;
    const steps = stepsToInput(pdDraft.steps);
    // The API requires at least one step, so a ladder emptied to nothing can only
    // be expressed by completing it — say so instead of failing with a 400.
    if (steps.length === 0) {
      setPdSaveError("Add at least one step — the API can't store an empty ladder.");
      return;
    }
    setPdSaving(true);
    setPdSaveError("");
    updateProgressiveDiscount(auth.token, pdEditing.id, { completed: pdDraft.completed, steps }, auth.businessId)
      .then((saved) => {
        setPdCatalog((prev) => prev.map((d) => (d.id === saved.id ? saved : d)));
        setPdDraft(draftFromDiscount(saved));
      })
      .catch((err) => setPdSaveError(pdOnError(err, "Couldn't save the progressive discount.")))
      .finally(() => setPdSaving(false));
  };

  // Animate out, then unmount the panel + clear the draft once the transition finishes.
  // Everything a combo can bundle: the live product list minus the combo itself.
  const comboOptions = useMemo(
    () =>
      flat
        .filter((p) => p.id !== selected)
        .map((p) => ({ id: p.id, name: p.name, price: p.price, section: p.section })),
    [flat, selected],
  );

  const closeDetail = () => {
    setPanelPhase((ph) => (ph === "closed" ? ph : "exiting"));
    if (panelTimer.current) clearTimeout(panelTimer.current);
    panelTimer.current = setTimeout(() => {
      panelTimer.current = null;
      setSelected(null);
      setDraft(null);
      setBaseline(null);
      setPanelPhase("closed");
    }, 260);
  };
  useEffect(() => () => {
    if (panelTimer.current) clearTimeout(panelTimer.current);
    if (enterTimer.current) clearTimeout(enterTimer.current);
  }, []);
  const patchDraft = (patch: Partial<ProductDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  // Surfaces the Square sync toast for modifier-item updates (see ProductDetail.saveGroup).
  const trackModifierSync = (label: string, tasks: (SquareCatalogSyncTask | null | undefined)[], retrigger?: () => Promise<(SquareCatalogSyncTask | null | undefined)[]>) => {
    trackSquareSyncMany(label, tasks, { noun: "Modifier", retrigger });
  };
  // Images auto-save: adding, removing, or reordering media persists immediately
  // via PATCH `photoUrls` (the whole list is replaced) rather than waiting for
  // the Save button. Draft/baseline/edits and the source photos are updated
  // optimistically and rolled back if the request fails.
  const saveMedia = async (nextMedia: MediaItem[]) => {
    if (!selected || !draft) return;
    const token = getManagerToken();
    const businessId = getManagerBusinessId();
    if (!token) {
      router.replace("/login");
      return;
    }
    const prevDraftMedia = draft.media;
    const prevBaseMedia = baseline?.media ?? [];
    setDraft((d) => (d ? { ...d, media: nextMedia } : d));
    setBaseline((bl) => (bl ? { ...bl, media: nextMedia } : bl));
    // Upload full, host-qualified URLs (the API's `photoUrls` requires http(s)).
    // We keep paths in local state, but absolutize when sending to the API.
    const photoUrls = nextMedia.map((m) => m.url).filter((u): u is string => !!u).map(toAbsoluteImageUrl);
    const productId = selected;
    let updated;
    try {
      updated = await updateProduct(token, productId, { photoUrls }, businessId);
    } catch (err) {
      setDraft((d) => (d ? { ...d, media: prevDraftMedia } : d));
      setBaseline((bl) => (bl ? { ...bl, media: prevBaseMedia } : bl));
      if (err instanceof ApiError && err.status === 401) {
        clearManagerSession();
        router.replace("/login");
        return;
      }
      throw err;
    }
    if (updated.squareSyncTask) {
      trackSquareSync(draft.names.en || "Product", updated.squareSyncTask, () =>
        updateProduct(token, productId, { photoUrls }, businessId).then((u) => u.squareSyncTask),
      );
    }
    // Reflect the saved list in the list-row thumbnail source: keep any existing
    // text edit but swap its media, and update the underlying product photos so
    // untouched rows refresh too.
    setEdits((prev) => (prev[selected] ? { ...prev, [selected]: { ...prev[selected], media: nextMedia } } : prev));
    const photos = nextMedia.filter((m) => m.url).map((m) => ({ id: m.id, name: m.name, url: m.url as string }));
    setApiProducts((prev) => prev.map((p) => (p.id === selected ? { ...p, photos } : p)));
  };
  const saveDraft = async () => {
    if (!selected || !draft) return;
    const token = getManagerToken();
    const businessId = getManagerBusinessId();
    if (!token) {
      router.replace("/login");
      return;
    }
    // Send es/pt translations in { locale: { title, description } } form. Include a
    // locale when it has content now, or had content before (so clears are persisted).
    const translations: Record<string, { title: string; description: string }> = {};
    (["es", "pt"] as const).forEach((loc) => {
      const title = draft.names[loc] || "";
      const description = draft.descriptions[loc] || "";
      const hadBefore = !!((baseline?.names[loc] || "").trim() || (baseline?.descriptions[loc] || "").trim());
      if (title.trim() || description.trim() || hadBefore) {
        translations[loc] = { title, description };
      }
    });
    const body: UpdateProductBody = {
      name: draft.names.en || "",
      description: (draft.descriptions.en || "").trim() ? draft.descriptions.en : null,
      visible: draft.active,
      alertDriver: draft.alertDriver,
      itemType: draft.type === "combo" ? "COMBO" : "PRODUCT",
      price: Math.round(parseMoney(draft.price) * 100),
      comparedAtPrice: draft.comparedAt ? Math.round(parseMoney(draft.comparedAt) * 100) : null,
      preparationStepIds: draft.tasks,
      // Full modifier-group list (attach/detach replaces the whole array).
      modifierGroupIds: draft.modifiers,
    };
    if (draft.type === "combo") {
      const problems = comboIssues(draft);
      if (problems.length > 0) throw new Error(problems[0]);
      // Both lists REPLACE what the product has; dollars become cents.
      body.comboSlots = draft.comboSlots.map((slot, slotIndex) => {
        const translations: Record<string, { title: string }> = {};
        (["es", "pt"] as const).forEach((loc) => {
          const title = slot.names[loc]?.trim();
          if (title) translations[loc] = { title };
        });
        return {
          name: (slot.names.en ?? "").trim(),
          minSelect: Math.max(0, Math.round(parseMoney(slot.min))),
          maxSelect: Math.max(1, Math.round(parseMoney(slot.max))),
          allowDuplicates: slot.allowDuplicates,
          sortIndex: slotIndex + 1,
          ...(Object.keys(translations).length ? { translations } : {}),
          options: slot.products.map((sp, optionIndex) => ({
            productId: sp.productId,
            extraPrice: Math.round(parseMoney(sp.extra) * 100),
            sortIndex: optionIndex + 1,
          })),
        };
      });
      body.products = draft.comboFixed.map((f, i) => ({
        productId: f.productId,
        quantity: Math.max(1, f.quantity),
        sortIndex: i + 1,
      }));
    } else if (baseline?.type === "combo") {
      // Switching a combo back to a single item: clear what it used to bundle.
      body.comboSlots = [];
      body.products = [];
    }
    if (Object.keys(translations).length) body.translations = translations;
    // Images are auto-saved on add/remove/reorder (see saveMedia), so the Save
    // button only persists text/price fields.
    const productId = selected;
    let updated;
    try {
      updated = await updateProduct(token, productId, body, businessId);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearManagerSession();
        router.replace("/login");
        return;
      }
      throw err;
    }
    // Persisted — commit locally so the row + detail reflect the saved state.
    const saved = clone(draft);
    setEdits((prev) => ({ ...prev, [productId]: saved }));
    setBaseline(saved);
    // Square-connected businesses get a background sync task — track it in a toast.
    if (updated.squareSyncTask) {
      trackSquareSync(draft.names.en || "Product", updated.squareSyncTask, () =>
        updateProduct(token, productId, body, businessId).then((u) => u.squareSyncTask),
      );
    }
  };
  const discardDraft = () => setBaseline((bl) => { if (bl) setDraft(clone(bl)); return bl; });

  // Availability toggle from the list row. Optimistic: flip locally, PATCH
  // `visible`, and roll back if the write fails — an item left on sale after the
  // manager switched it off is worse than a chip that visibly snaps back.
  // Baseline moves with the draft so the open panel doesn't show a stale Save.
  const commitActive = (p: FlatProduct, next: boolean) => {
    const applyActive = (value: boolean) => {
      setEdits((prev) => {
        const d = prev[p.id] ? clone(prev[p.id]) : draftForProduct(p);
        d.active = value;
        return { ...prev, [p.id]: d };
      });
      if (selected === p.id) {
        setDraft((d) => (d ? { ...d, active: value } : d));
        setBaseline((b) => (b ? { ...b, active: value } : b));
      }
    };
    applyActive(next);
    const token = getManagerToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const businessId = getManagerBusinessId();
    updateProduct(token, p.id, { visible: next }, businessId).catch((err) => {
      if (err instanceof ApiError && err.status === 401) {
        clearManagerSession();
        router.replace("/login");
        return;
      }
      applyActive(p.active);
    });
  };

  // Removes a product from its section list (still re-attachable via "Add product").
  const catIdForSection = (title: string) => categories.find((c) => c.name === title)?.id ?? null;
  // Attach/detach + reorder all go through PATCH /products/:id. Fire-and-forget:
  // the local view already reflects the change; on failure we only care about 401.
  const patchProductCategory = (productId: string, body: UpdateProductBody) => {
    const token = getManagerToken();
    if (!token) return;
    const businessId = getManagerBusinessId();
    updateProduct(token, productId, body, businessId).catch((err) => {
      if (err instanceof ApiError && err.status === 401) {
        clearManagerSession();
        router.replace("/login");
      }
    });
  };
  // "Add product to section" = move the product into that section's category.
  // A product can sit in sections on several menus. Edits here only replace
  // its section on the current menu; links to other menus' sections are kept.
  const otherMenuCategoryIds = (productId: string): string[] => {
    const real = productById.get(productId);
    const ids = [real?.categoryId, ...(real?.categoryIds ?? [])].filter((id): id is string => !!id && !catNames[id]);
    return Array.from(new Set(ids));
  };
  const attachProductToSection = (productId: string, sectionTitle: string) => {
    const catId = catIdForSection(sectionTitle);
    if (!catId) return; // Uncategorized/custom sections have no category.
    patchProductCategory(productId, { categoryId: catId, categoryIds: [catId, ...otherMenuCategoryIds(productId)] });
  };
  // "Detach from section" removes the product from this menu's sections; with
  // no other menu holding it, it ends up Uncategorized.
  const detachProduct = (p: FlatProduct) => {
    setDetached((prev) => ({ ...prev, [p.id]: true }));
    if (selected === p.id) closeDetail();
    const others = otherMenuCategoryIds(p.id);
    patchProductCategory(p.id, { categoryId: others[0] ?? null, categoryIds: others });
  };

  /** PATCH /categories/:id { menuId } — append an existing section to this menu. */
  const attachSection = (cat: ApiCategory) => {
    const token = getManagerToken();
    if (!token || !currentMenu || sectionBusy) return;
    setSectionBusy(true);
    setSectionError("");
    updateCategory(token, cat.id, { menuId: currentMenu }, getManagerBusinessId())
      .then(() => {
        setCategories((prev) => (prev.some((c) => c.id === cat.id) ? prev : [...prev, cat]));
        setSecPickerOpen(false);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
          return;
        }
        setSectionError("Couldn't attach the section.");
      })
      .finally(() => setSectionBusy(false));
  };

  /**
   * Takes a section off the current menu. Its products leave this menu's list
   * too (unless another section here also holds them) but stay on any other
   * menu, and the section shows up under "Attach existing" again.
   */
  const detachSection = (title: string) => {
    const cat = categories.find((c) => c.name === title);
    const token = getManagerToken();
    if (!cat || !token || !currentMenu || sectionBusy) return;
    setSectionBusy(true);
    setSectionError("");
    setAddPicker(null);
    detachCategoryFromMenu(token, cat.id, currentMenu, getManagerBusinessId())
      .then(() => {
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
        // Local "moved into this section" overrides would otherwise keep those
        // products listed under a section that is gone.
        setSectionMoves((prev) => Object.fromEntries(Object.entries(prev).filter(([, t]) => t !== title)));
        if (selectedProduct?.section === title) closeDetail();
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
          return;
        }
        setSectionError(`Couldn't detach "${title}".`);
      })
      .finally(() => setSectionBusy(false));
  };

  /**
   * POST /categories on this menu. A name matching an existing section (any
   * menu, case-insensitive) attaches that one instead of creating a duplicate.
   */
  const createSection = () => {
    const name = newSectionName.trim();
    const token = getManagerToken();
    if (!name || !token || !currentMenu || sectionBusy) return;
    const lower = name.toLowerCase();
    if (categories.some((c) => c.name.toLowerCase() === lower)) {
      setSectionError("That section is already on this menu.");
      return;
    }
    const existing = allCategories.find((c) => c.name.toLowerCase() === lower);
    if (existing) {
      setNewSectionName("");
      attachSection(existing);
      return;
    }
    setSectionBusy(true);
    setSectionError("");
    createCategory(token, { name, menuId: currentMenu }, getManagerBusinessId())
      .then((created) => {
        const cat: ApiCategory = { id: created.id, name: created.name, menuIndex: created.menuIndex ?? null };
        setCategories((prev) => [...prev, cat]);
        setAllCategories((prev) => [...prev, cat]);
        setNewSectionName("");
        setSecPickerOpen(false);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
          return;
        }
        setSectionError("Couldn't create the section.");
      })
      .finally(() => setSectionBusy(false));
  };

  const upsertModifierGroup = (g: ModifierGroup) => setModifierLibrary((prev) => (prev.some((x) => x.id === g.id) ? prev.map((x) => (x.id === g.id ? g : x)) : [...prev, g]));
  const upsertPrepTask = (t: PrepTask) => setPrepLibrary((prev) => (prev.some((x) => x.id === t.id) ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t]));

  const moveSection = (from: number, to: number) => {
    if (from === to || from == null || to == null) return;
    const next = sectionOrder.slice();
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setOrder(next);
    setDragIndex(to);
    sectionReorderDirty.current = true;
    latestSectionOrder.current = next;
  };
  // Persist a section move with a single PATCH: the API reindexes the rest of
  // the menu itself. menuIndex is the moved section's 1-based position among the
  // category sections in the new order. Non-category sections (Uncategorized /
  // custom) have no menu membership and are skipped.
  const persistMovedSection = (orderTitles: string[], movedTitle: string) => {
    const token = getManagerToken();
    if (!token) return;
    const businessId = getManagerBusinessId();
    const catByName = new Map(categories.map((c) => [c.name, c]));
    const cat = catByName.get(movedTitle);
    if (!cat) return;
    const pos = orderTitles.filter((t) => catByName.has(t)).indexOf(movedTitle);
    if (pos < 0) return;
    updateCategory(token, cat.id, { menuIndex: pos + 1, ...(currentMenu ? { menuId: currentMenu } : {}) }, businessId).catch((err) => {
      if (err instanceof ApiError && err.status === 401) {
        clearManagerSession();
        router.replace("/login");
      }
    });
  };
  // Persist after a drag completes (and as a fallback when the panel closes).
  // Uses refs so it reads the final order, not a stale render closure.
  const finishSectionReorder = () => {
    if (sectionReorderDirty.current && latestSectionOrder.current && draggedSectionTitle.current) {
      sectionReorderDirty.current = false;
      persistMovedSection(latestSectionOrder.current, draggedSectionTitle.current);
      draggedSectionTitle.current = null;
    }
  };
  const moveProduct = (title: string, ids: string[], from: number, to: number) => {
    if (from === to || from == null || to == null) return;
    const next = productOrderFor(title, ids).slice();
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setProductOrder((prev) => ({ ...prev, [title]: next }));
    setProdDragIndex(to);
    productReorderDirty.current = true;
    latestProductOrder.current = next;
  };
  // Persist a product move with a single PATCH: the API reindexes the rest of the
  // category. categoryIndex is the moved product's 1-based position within the
  // section's order. Sections without a category (Uncategorized/custom) are skipped.
  const persistMovedProduct = (sectionTitle: string, orderedIds: string[], productId: string) => {
    const token = getManagerToken();
    if (!token) return;
    const businessId = getManagerBusinessId();
    const cat = categories.find((c) => c.name === sectionTitle);
    if (!cat) return;
    const pos = orderedIds.indexOf(productId);
    if (pos < 0) return;
    updateProduct(token, productId, { categoryId: cat.id, categoryIndex: pos + 1 }, businessId).catch((err) => {
      if (err instanceof ApiError && err.status === 401) {
        clearManagerSession();
        router.replace("/login");
      }
    });
  };
  const finishProductReorder = () => {
    const moved = draggedProduct.current;
    if (productReorderDirty.current && latestProductOrder.current && moved) {
      productReorderDirty.current = false;
      persistMovedProduct(moved.section, latestProductOrder.current, moved.id);
      draggedProduct.current = null;
    }
  };

  // Switching menus refetches the catalog scoped to it (see `load`). Local
  // section/product order is per-menu, so it is dropped.
  const switchMenu = (id: string) => {
    setMenuPickerOpen(false);
    if (id === currentMenu) return;
    closeDetail();
    setOrder(null);
    setProductOrder({});
    setCurrentMenu(id);
  };

  /** POST /menus, then switch to the new (empty) menu. */
  const createMenu = () => {
    const name = newMenuName.trim();
    const token = getManagerToken();
    if (!name || menuBusy || !token) return;
    setMenuBusy(true);
    setMenuError("");
    apiCreateMenu(token, name, getManagerBusinessId())
      .then((m) => {
        setMenus((prev) => [...prev, { id: m.id, name: m.name, progressiveDiscountId: m.progressiveDiscountId ?? null }]);
        setNewMenuName("");
        switchMenu(m.id);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
          return;
        }
        setMenuError(err instanceof ApiError && err.status === 409 ? "A menu with that id already exists." : "Couldn't create the menu.");
      })
      .finally(() => setMenuBusy(false));
  };

  /** PATCH /menus/:id { isDefault: true } — the storefront then serves this menu. */
  const makeActive = (id: string) => {
    const token = getManagerToken();
    if (!token || menuBusy) return;
    setMenuBusy(true);
    setMenuError("");
    updateMenu(token, id, { isDefault: true }, getManagerBusinessId())
      .then(() => setActiveMenu(id))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
          return;
        }
        setMenuError("Couldn't change the active menu.");
      })
      .finally(() => setMenuBusy(false));
  };

  /**
   * Creates the product through `POST /products` and opens it. The row only
   * appears once the API confirms it, so nothing here is a local-only product.
   */
  const submitCreate = async (c: CreatorDraft) => {
    const name = (c.names.en || "").trim();
    if (!name) return;
    const token = getManagerToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const businessId = getManagerBusinessId();
    const price = parseMoney(c.price);
    const cmp = c.comparedAt ? parseMoney(c.comparedAt) : 0;
    const categoryId = catIdForSection(c.section);

    // Locale keys are `title`/`description` — what the storefront reads.
    const translations: Record<string, { description?: string; title: string }> = {};
    (["es", "pt"] as const).forEach((loc) => {
      const title = (c.names[loc] || "").trim();
      const description = (c.descriptions[loc] || "").trim();
      if (title || description) translations[loc] = { title, ...(description ? { description } : {}) };
    });

    const body: CreateProductBody = {
      name,
      description: (c.descriptions.en || "").trim() || null,
      price: Math.round(price * 100),
      comparedAtPrice: cmp > 0 ? Math.round(cmp * 100) : null,
      visible: c.active,
      alertDriver: false,
      itemType: c.type === "combo" ? "COMBO" : "PRODUCT",
      ...(categoryId ? { categoryId, categoryIds: [categoryId] } : {}),
      ...(Object.keys(translations).length ? { translations } : {}),
    };

    setCreateError("");
    setCreating(true);
    let created: ApiProduct & { squareSyncTask?: SquareCatalogSyncTask | null };
    try {
      created = await createProduct(token, body, businessId);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearManagerSession();
        router.replace("/login");
        return;
      }
      const field = err instanceof ApiError ? err.field : undefined;
      setCreateError(
        err instanceof ApiError && err.status === 0
          ? "Can't reach the server."
          : field
            ? `The API rejected ${field}.`
            : "Couldn't create the product.",
      );
      return;
    } finally {
      setCreating(false);
    }

    const d = mapProductToDraft(created);
    setApiProducts((prev) => [...prev, created]);
    // Square-connected businesses sync the new product in the background.
    if (created.squareSyncTask) trackSquareSync(name, created.squareSyncTask);
    setProductOrder((prev) => ({ ...prev, [c.section]: [created.id, ...((prev[c.section] || []).filter((x) => x !== created.id))] }));
    setCreator(null);
    setAddPicker(null);
    setAddSearch("");
    setSelected(created.id);
    setDraft(clone(d));
    setBaseline(clone(d));
    setLang("en");
    beginPanelEnter();
  };

  const currentMenuObj = menus.find((m) => m.id === currentMenu) || menus[0];
  const previewUrl = currentMenu ? menuPreviewUrl(currentMenu) : null;
  const grid = split ? "minmax(0,1fr) 76px 84px 30px" : "minmax(0,1fr) 96px 88px 96px 30px";
  const headerCells = split ? ["Product", "Price", "Status"] : ["Product", "Compared at", "Price", "Status"];
  const rightCols = split ? [1, 2] : [2, 3];

  const orderedSections = sectionOrder
    .map((t) => {
      const inSec = visible.filter((p) => p.section === t);
      const secOrder = productOrderFor(t, inSec.map((p) => p.id));
      const ordered = secOrder.map((id) => inSec.find((p) => p.id === id)).filter((p): p is FlatProduct => !!p);
      return { title: t, products: ordered };
    })
    // Empty sections stay visible (so new/attached ones show) except while searching.
    .filter((s) => s.products.length > 0 || !q);

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Popover
            open={menuPickerOpen}
            onOpenChange={(o) => { setMenuPickerOpen(o); if (o) setReorderOpen(false); }}
            align="start"
            sideOffset={8}
            contentStyle={{ width: 288, padding: 8 }}
            trigger={
              <button type="button" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 34, padding: "0 8px 0 0", background: "transparent", border: "none", cursor: "pointer", maxWidth: "100%" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#F1F1F1", letterSpacing: "-0.2px" }}>{currentMenuObj?.name ?? "Menu"}</span>
                {currentMenuObj?.id === activeMenu && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 9999, background: "rgba(34,197,94,0.12)", color: "#22C55E", fontSize: 11, fontWeight: 600 }}>
                    <span style={{ width: 5, height: 5, borderRadius: 9999, background: "#22C55E" }} />Active
                  </span>
                )}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}><path d="M1 1l4 4 4-4" stroke="#9B9B9B" strokeWidth="1.4" strokeLinecap="round" /></svg>
              </button>
            }
          >
            <div style={{ padding: "4px 6px 8px", fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Menus</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {menus.map((m) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px 0 4px", height: 34, borderRadius: 6, background: m.id === currentMenu ? "rgba(255,255,255,0.06)" : "transparent" }}>
                  <button type="button" onClick={() => switchMenu(m.id)} style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8, height: 34, background: "transparent", border: "none", padding: "0 6px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: 9999, flexShrink: 0, background: m.id === activeMenu ? "#22C55E" : "rgba(255,255,255,0.18)" }} />
                    <span style={{ flex: 1, minWidth: 0, textAlign: "left", fontSize: 12.5, color: "#F1F1F1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                  </button>
                  {m.id === activeMenu ? (
                    <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 600, color: "#22C55E" }}>Active</span>
                  ) : (
                    <button type="button" disabled={menuBusy} onClick={() => makeActive(m.id)} style={{ flexShrink: 0, height: 22, padding: "0 8px", background: "transparent", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 9999, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11, color: "#C7C8CC" }}>Set active</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 2px 2px" }}>
              <input value={newMenuName} onChange={(e) => setNewMenuName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createMenu(); }} placeholder="New menu name" style={{ flex: 1, minWidth: 0, height: 30, padding: "0 10px", background: "#252525", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, color: "#E8E8E8", outline: "none" }} />
              <button type="button" disabled={menuBusy} onClick={createMenu} style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 6, border: "none", cursor: menuBusy ? "default" : "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, background: newMenuName.trim() ? "#FF5C1A" : "rgba(255,255,255,0.07)", color: newMenuName.trim() ? "#171717" : "#75767C", opacity: menuBusy ? 0.6 : 1 }}>{menuBusy ? "Saving…" : "Create"}</button>
            </div>
            {menuError && <div style={{ padding: "6px 4px 2px", fontSize: 11.5, color: "#F87171" }}>{menuError}</div>}
          </Popover>
        </div>

        <div style={{ flexShrink: 0 }}>
          <Popover
            open={pdPickerOpen}
            onOpenChange={setPdPickerOpen}
            align="end"
            sideOffset={8}
            contentStyle={{ width: 326, padding: 8 }}
            trigger={
              <button
                type="button"
                title={pdActive ? `Progressive discount ${pdActive.id} · ${pdSummary(pdActive)}${pdActive.completed ? " · completed, not offered" : ""}` : "No progressive discount attached to this menu"}
                style={{
                  height: 30, maxWidth: 200, display: "inline-flex", alignItems: "center", gap: 7, padding: "0 10px", borderRadius: 6, cursor: "pointer",
                  border: "1px solid " + (pdLive ? "rgba(255,92,26,0.4)" : "rgba(255,255,255,0.09)"),
                  background: pdLive ? "rgba(255,92,26,0.12)" : "#252525",
                  color: pdLive ? "#FF5C1A" : "#C7C8CC",
                  fontFamily: "var(--font-body)", fontSize: 12.5, whiteSpace: "nowrap",
                }}
              >
                <svg width="12" height="13" viewBox="0 0 12 13" fill="none" style={{ flexShrink: 0 }}><path d="M7 1L2 7.4h3L4.6 12 10 5.4H6.7L7 1z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {!pdActive && <span>{pdCatalog.length > 0 ? "No discount" : "Add discount"}</span>}
                {pdActive?.completed && <span>Completed</span>}
                {pdLive && pdActive && (
                  <span style={{ padding: "1px 7px", borderRadius: 9999, background: "rgba(255,92,26,0.18)", color: "#FF5C1A", fontSize: 10.5, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{pdActive.steps.length}</span>
                )}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}><path d="M1 1l4 4 4-4" stroke="#9B9B9B" strokeWidth="1.4" strokeLinecap="round" /></svg>
              </button>
            }
          >
            <ProgressiveDiscountPicker
              catalog={pdCatalog}
              active={pdActive}
              currentMenuId={currentMenu}
              menuName={(id) => menus.find((m) => m.id === id)?.name ?? id}
              loading={pdLoading}
              error={pdError}
              busy={pdBusy}
              onEdit={openPd}
              onActivate={activatePd}
              onDeactivate={deactivatePd}
              onCreate={createPd}
              onRetry={() => setPdReload((x) => x + 1)}
            />
          </Popover>
        </div>

        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products" style={{ width: 200, height: 30, padding: "0 10px", background: "#252525", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, color: "#E8E8E8", flexShrink: 0, outline: "none" }} />
        {/* Opens the customer menu (web project) on this menu, in a new tab. */}
        <button
          type="button"
          title={previewUrl ? "Preview menu" : "Set NEXT_PUBLIC_MENU_BASE_URL to preview the menu"}
          aria-label="Preview menu"
          disabled={!previewUrl}
          onClick={() => previewUrl && window.open(previewUrl, "_blank", "noopener")}
          style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, padding: 0, background: "transparent", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 6, cursor: previewUrl ? "pointer" : "default", opacity: previewUrl ? 1 : 0.5, color: "#E8E8E8" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
        </button>

        <div style={{ flexShrink: 0 }}>
          <Popover
            open={secPickerOpen}
            onOpenChange={(o) => { setSecPickerOpen(o); setSectionError(""); if (o) { setReorderOpen(false); setMenuPickerOpen(false); } }}
            align="end"
            sideOffset={8}
            contentStyle={{ width: 272, padding: 8 }}
            trigger={
              <button type="button" disabled={!currentMenu} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 30, padding: "0 11px", background: secPickerOpen ? "#2F2F2F" : "#252525", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, color: "#E8E8E8", cursor: currentMenu ? "pointer" : "default", opacity: currentMenu ? 1 : 0.5 }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                <span>Add section</span>
              </button>
            }
          >
            <div style={{ padding: "4px 6px 8px", fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Attach existing</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: 220, overflow: "auto" }}>
              {attachableSections.map(({ cat, count }) => (
                <button key={cat.id} type="button" className="zp-menuitem" disabled={sectionBusy} onClick={() => attachSection(cat)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", height: 34, padding: "0 8px", borderRadius: 6, border: "none", background: "transparent", cursor: sectionBusy ? "default" : "pointer", fontFamily: "var(--font-body)", textAlign: "left" }}>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, color: "#F1F1F1" }}>{cat.name}</span>
                  <span style={{ flexShrink: 0, fontSize: 10.5, color: "#75767C", fontFamily: "var(--font-mono)" }}>{count} products</span>
                  <span style={{ flexShrink: 0, fontSize: 11, color: "#FF7A44", fontWeight: 600 }}>Attach</span>
                </button>
              ))}
              {attachableSections.length === 0 && (
                <div style={{ padding: "6px 8px 4px", fontSize: 12, color: "#75767C" }}>All sections are on this menu.</div>
              )}
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "8px 0" }} />
            <div style={{ padding: "0 6px 8px", fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em" }}>New section</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 2px 2px" }}>
              <input value={newSectionName} onChange={(e) => { setNewSectionName(e.target.value); setSectionError(""); }} onKeyDown={(e) => { if (e.key === "Enter") createSection(); }} placeholder="Section name" style={{ flex: 1, minWidth: 0, height: 30, padding: "0 10px", background: "#191919", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, color: "#F1F1F1", outline: "none" }} />
              <button type="button" disabled={sectionBusy} onClick={createSection} style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 6, border: "none", cursor: sectionBusy ? "default" : "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, background: newSectionName.trim() ? "#FF5C1A" : "rgba(255,255,255,0.07)", color: newSectionName.trim() ? "#FFFFFF" : "#75767C", opacity: sectionBusy ? 0.6 : 1 }}>{sectionBusy ? "Saving…" : "Create"}</button>
            </div>
            {sectionError && <div style={{ padding: "6px 4px 2px", fontSize: 11.5, color: "#F87171" }}>{sectionError}</div>}
          </Popover>
        </div>

        <div style={{ flexShrink: 0 }}>
          <Popover
            open={reorderOpen}
            onOpenChange={(o) => { setReorderOpen(o); setDragIndex(null); if (o) { setProdReorder(null); } else { finishSectionReorder(); } }}
            align="end"
            sideOffset={8}
            contentStyle={{ width: 236, padding: 8 }}
            trigger={
              <button type="button" style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 30, padding: "0 11px", background: reorderOpen ? "#2F2F2F" : "#252525", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, color: "#E8E8E8", cursor: "pointer" }}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 2h9M1 5.5h9M1 9h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                <span>Reorder sections</span>
              </button>
            }
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "4px 6px 8px" }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Section order</span>
              <button type="button" onClick={() => { setReorderOpen(false); finishSectionReorder(); }} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11.5, color: "#75767C" }}>Done</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {sectionOrder.map((title, i) => (
                <div
                  key={title}
                  draggable
                  onDragStart={(e) => { if (e.dataTransfer) e.dataTransfer.effectAllowed = "move"; setDragIndex(i); draggedSectionTitle.current = title; }}
                  onDragOver={(e) => { e.preventDefault(); if (dragIndex !== null && dragIndex !== i) moveSection(dragIndex, i); }}
                  onDragEnd={(e) => { e.preventDefault(); setDragIndex(null); finishSectionReorder(); }}
                  onDrop={(e) => { e.preventDefault(); setDragIndex(null); finishSectionReorder(); }}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", borderRadius: 6, cursor: "grab", userSelect: "none", background: dragIndex === i ? "rgba(255,92,26,0.12)" : "#252525", border: "1px solid " + (dragIndex === i ? "rgba(255,92,26,0.35)" : "transparent") }}
                >
                  <DragDots />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "#F1F1F1" }}>{title}</span>
                  <span style={{ fontSize: 10.5, color: "#75767C", fontFamily: "var(--font-mono)" }}>{counts[title] || 0}</span>
                </div>
              ))}
            </div>
          </Popover>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: grid, gap: 8, alignItems: "center", padding: "0 14px", height: 38, background: "#202020", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
            {headerCells.map((label, i) => (
              <div key={label} style={{ fontSize: 10, fontWeight: 600, color: "#75767C", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: rightCols.includes(i) ? "right" : "left", minWidth: 0 }}>{label}</div>
            ))}
          </div>

          <div style={{ flex: 1, overflow: "auto" }}>
            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "56px 0", color: "#9B9B9B", fontSize: 12.5 }}>
                <span style={spinner} /> Loading products…
              </div>
            )}
            {!loading && error && (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <div style={{ fontSize: 12.5, color: "#F87171", marginBottom: 12 }}>{error}</div>
                <button type="button" onClick={load} style={{ height: 32, padding: "0 14px", background: "#FF5C1A", border: "none", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717", cursor: "pointer" }}>Try again</button>
              </div>
            )}
            {/* Detach failures surface here; the Add-section popover shows its own. */}
            {!loading && !error && sectionError && !secPickerOpen && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 14px", background: "rgba(248,113,113,0.08)", borderBottom: "1px solid rgba(248,113,113,0.2)", fontSize: 12, color: "#F87171" }}>
                <span>{sectionError}</span>
                <button type="button" onClick={() => setSectionError("")} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11.5, color: "#9B9B9B" }}>Dismiss</button>
              </div>
            )}
            {!loading && !error && orderedSections.map((sec) => {
              const ids = sec.products.map((p) => p.id);
              const aq = addSearch.trim().toLowerCase();
              const attachable = flat.filter((p) => p.section !== sec.title || detached[p.id]).filter((p) => !aq || p.name.toLowerCase().includes(aq)).slice(0, 40);
              return (
                <div key={sec.title}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px", height: 46, background: "#1C1C1C", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: addPicker === sec.title || prodReorder === sec.title ? 30 : 2 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12, color: "#F1F1F1", letterSpacing: "0.01em" }}>{sec.title}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 10.5, color: "#75767C", fontFamily: "var(--font-mono)" }}>{sec.products.length} {sec.products.length === 1 ? "item" : "items"}</span>

                    {/* Detach section from this menu — last in the row (order 2), per the design.
                        Uncategorized is not a real section, so it has none. */}
                    {sec.title !== UNCATEGORIZED && (
                      <button type="button" className="zp-secbtn" title="Detach section from menu" disabled={sectionBusy} onClick={() => detachSection(sec.title)} style={{ order: 2, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, height: 26, padding: "0 8px", borderRadius: 6, border: "none", background: "transparent", cursor: sectionBusy ? "default" : "pointer", fontFamily: "var(--font-body)", fontSize: 11.5, color: "#75767C" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18.84 12.25 1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="m5.17 11.75-1.71 1.71a5 5 0 0 0 7.07 7.07l1.71-1.71" /><path d="M8 2v3" /><path d="M2 8h3" /><path d="M16 22v-3" /><path d="M22 16h-3" /></svg>
                        <span>Detach</span>
                      </button>
                    )}

                    {/* Add product */}
                    <div style={{ flexShrink: 0, marginRight: 2 }}>
                      <Popover
                        open={addPicker === sec.title}
                        onOpenChange={(o) => { setAddPicker(o ? sec.title : null); setAddSearch(""); if (o) { setProdReorder(null); setReorderOpen(false); } }}
                        align="end"
                        sideOffset={8}
                        contentStyle={{ width: 308, padding: 0, borderRadius: 12, overflow: "hidden" }}
                        trigger={
                          <button type="button" className="zp-secbtn" style={secBtnStyle(addPicker === sec.title)}>
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1.5v8M1.5 5.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            <span>Add product</span>
                          </button>
                        }
                      >
                        <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, color: "#F1F1F1" }}>Add to {sec.title}</div>
                          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 10px", background: "#252525", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 7 }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><circle cx="5.2" cy="5.2" r="3.6" stroke="#75767C" strokeWidth="1.3" /><path d="M8 8l2.4 2.4" stroke="#75767C" strokeWidth="1.3" strokeLinecap="round" /></svg>
                            <input className="zp-bare" value={addSearch} onChange={(e) => setAddSearch(e.target.value)} placeholder="Search products to attach" style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#E8E8E8" }} />
                          </div>
                        </div>
                        <div style={{ maxHeight: 236, overflow: "auto", padding: 6 }}>
                          {attachable.map((p) => (
                            <button key={p.id} type="button" className="zp-attachrow" onClick={() => { setSectionMoves((prev) => ({ ...prev, [p.id]: sec.title })); setDetached((prev) => { const nd = { ...prev }; delete nd[p.id]; return nd; }); attachProductToSection(p.id, sec.title); setAddPicker(null); setAddSearch(""); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "7px 8px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                              <ProductThumb url={p.photoUrl} name={p.name} size={30} radius={6} />
                              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, color: "#F1F1F1" }}>{p.name}</span>
                                <span style={{ fontSize: 11, color: "#75767C" }}>{p.section} · {money(p.price)}</span>
                              </span>
                              <span style={{ flexShrink: 0, fontSize: 11, color: "#75767C" }}>Attach</span>
                            </button>
                          ))}
                          {attachable.length === 0 && <div style={{ padding: "14px 8px", textAlign: "center", fontSize: 11.5, color: "#75767C" }}>No other products match.</div>}
                        </div>
                        <div style={{ padding: 8, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                          <button type="button" onClick={() => { setCreator({ section: sec.title, names: { en: "", es: "", pt: "" }, descriptions: { en: "", es: "", pt: "" }, type: "single", price: "", comparedAt: "", active: true }); setAddPicker(null); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, height: 34, background: "#FF5C1A", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717" }}>
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1.5v8M1.5 5.5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                            <span>Create new product</span>
                          </button>
                        </div>
                      </Popover>
                    </div>

                    {/* Reorder products */}
                    <div style={{ flexShrink: 0 }}>
                      <Popover
                        open={prodReorder === sec.title}
                        onOpenChange={(o) => { setProdReorder(o ? sec.title : null); setProdDragIndex(null); if (o) setReorderOpen(false); else finishProductReorder(); }}
                        align="end"
                        sideOffset={8}
                        contentStyle={{ width: 252, padding: 8 }}
                        trigger={
                          <button type="button" className="zp-secbtn" title="Reorder products" style={secBtnStyle(prodReorder === sec.title)}>
                            <svg width="10" height="10" viewBox="0 0 11 11" fill="none"><path d="M1 2h9M1 5.5h9M1 9h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                            <span>Reorder</span>
                          </button>
                        }
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "4px 6px 8px" }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Product order</span>
                          <button type="button" onClick={() => { setProdReorder(null); finishProductReorder(); }} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11.5, color: "#75767C" }}>Done</button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 260, overflow: "auto" }}>
                          {sec.products.map((p, i) => (
                            <div
                              key={p.id}
                              draggable
                              onDragStart={(e) => { if (e.dataTransfer) e.dataTransfer.effectAllowed = "move"; setProdDragIndex(i); draggedProduct.current = { id: p.id, section: sec.title }; }}
                              onDragOver={(e) => { e.preventDefault(); if (prodDragIndex !== null && prodDragIndex !== i) moveProduct(sec.title, ids, prodDragIndex, i); }}
                              onDragEnd={(e) => { e.preventDefault(); setProdDragIndex(null); finishProductReorder(); }}
                              onDrop={(e) => { e.preventDefault(); setProdDragIndex(null); finishProductReorder(); }}
                              style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", borderRadius: 6, cursor: "grab", userSelect: "none", background: prodDragIndex === i && prodReorder === sec.title ? "rgba(255,92,26,0.12)" : "#252525", border: "1px solid " + (prodDragIndex === i && prodReorder === sec.title ? "rgba(255,92,26,0.35)" : "transparent") }}
                            >
                              <DragDots />
                              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, color: "#F1F1F1" }}>{p.name}</span>
                              <span style={{ fontSize: 10.5, color: "#75767C", fontFamily: "var(--font-mono)" }}>{money(p.price)}</span>
                            </div>
                          ))}
                        </div>
                      </Popover>
                    </div>
                  </div>

                  {/* Product rows */}
                  {sec.products.map((p) => {
                    const chip = statusChip(p.active);
                    const isSel = selectedProduct?.id === p.id;
                    return (
                      <div key={p.id} className="zp-prow" onClick={() => openProduct(p)} style={{ display: "grid", gridTemplateColumns: grid, gap: 8, alignItems: "center", padding: "0 14px", height: 48, cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)", minWidth: 0, background: isSel ? "rgba(255,92,26,0.07)" : "transparent", opacity: p.active ? 1 : 0.62 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          <ProductThumb url={p.photoUrl} name={p.name} size={34} radius={7} />
                          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "#F1F1F1" }}>{p.name}</span>
                        </div>
                        {!split && (
                          <div style={{ fontSize: 12.5, color: "#75767C", fontFamily: "var(--font-mono)", textDecoration: "line-through" }}>{p.comparedAt > p.price ? money(p.comparedAt) : ""}</div>
                        )}
                        <div style={{ fontSize: 12.5, color: "#E8E8E8", fontFamily: "var(--font-mono)", textAlign: "right" }}>{money(p.price)}</div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button type="button" title={p.active ? "Set inactive" : "Set active"} onClick={(e) => { e.stopPropagation(); commitActive(p, !p.active); }} style={{ ...chip.statusStyle, border: "1px solid transparent", cursor: "pointer", fontFamily: "var(--font-body)", padding: "3px 9px" }}>
                            <span style={chip.dotStyle} />
                            {chip.status}
                          </button>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                          <ActionMenu
                            align="end"
                            sideOffset={6}
                            contentStyle={{ width: 184, padding: 5 }}
                            trigger={
                              <button type="button" className="zp-rowmenu" title="Options" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, background: "transparent", border: "none", borderRadius: 6, padding: 0, cursor: "pointer", color: "#75767C" }}>
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor"><circle cx="6.5" cy="2.2" r="1.15" /><circle cx="6.5" cy="6.5" r="1.15" /><circle cx="6.5" cy="10.8" r="1.15" /></svg>
                              </button>
                            }
                          >
                            <MenuItem onSelect={() => openProduct(p)} style={rowMenuItemStyle}>Edit product</MenuItem>
                            <MenuItem onSelect={() => commitActive(p, !p.active)} style={rowMenuItemStyle}>{p.active ? "Set inactive" : "Set active"}</MenuItem>
                            <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 2px" }} />
                            <MenuItem onSelect={() => detachProduct(p)} style={{ ...rowMenuItemStyle, color: "#FF5C1A" }}>Detach from section</MenuItem>
                          </ActionMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {!loading && !error && orderedSections.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", fontSize: 11.5, color: "#75767C" }}>
                {q ? "No products match this search." : sectionOrder.length === 0 ? "This menu has no sections yet. Use Add section to create or attach one." : "No products yet."}
              </div>
            )}
          </div>
        </div>

        {pdEditing && (
          <div
            style={{
              width: "40%", minWidth: 360, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden",
              borderLeft: "1px solid rgba(255,255,255,0.07)", background: "#202020",
            }}
          >
            <ProgressiveDiscountPanel
              discount={pdEditing}
              draft={pdDraft}
              loading={false}
              error=""
              saving={pdSaving}
              saveError={pdSaveError}
              onPatch={(next) => { setPdDraft(next); setPdSaveError(""); }}
              onSave={saveProgressiveDiscount}
              onDiscard={() => { setPdDraft(draftFromDiscount(pdEditing)); setPdSaveError(""); }}
              onClose={() => setPdOpenId(null)}
              onRetry={() => setPdReload((x) => x + 1)}
            />
          </div>
        )}

        {selectedProduct && draft && baseline && (
          <div
            style={{
              width: panelPhase === "open" ? "40%" : "0%",
              minWidth: panelPhase === "open" ? 330 : 0,
              opacity: panelPhase === "open" ? 1 : 0,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
              background: "#202020",
              transition: "width 300ms cubic-bezier(0.16,1,0.3,1), min-width 300ms cubic-bezier(0.16,1,0.3,1), opacity 200ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <div style={{ width: "100%", minWidth: 330, height: "100%", display: "flex", flexDirection: "column" }}>
              <ProductDetail
                product={selectedProduct}
                draft={draft}
                baseline={baseline}
                lang={lang}
                modifierLibrary={modifierLibrary}
                prepLibrary={prepLibrary}
                comboOptions={comboOptions}
                setLang={setLang}
                patchDraft={patchDraft}
                onMediaChange={saveMedia}
                onSave={saveDraft}
                onDiscard={discardDraft}
                onClose={closeDetail}
                upsertModifierGroup={upsertModifierGroup}
                upsertPrepTask={upsertPrepTask}
                trackModifierSync={trackModifierSync}
              />
            </div>
          </div>
        )}
      </div>

      {creator && (
        <ProductCreator busy={creating} error={createError} initial={creator} sections={sectionOrder} onCancel={() => setCreator(null)} onSave={submitCreate} />
      )}

      <SquareSyncToasts toasts={toasts} onRetry={retrySquareSync} onDismiss={dismissSquareSync} />
    </>
  );
}

function ProductThumb({ url, name, size, radius }: { url: string | null; name: string; size: number; radius: number }) {
  if (url) {
    return (
      <span style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, overflow: "hidden", display: "block", background: "#2F2F2F", border: "1px solid rgba(255,255,255,0.07)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={toAbsoluteImageUrl(url)} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </span>
    );
  }
  return <span style={thumbStyle(size, radius)}>{initials(name)}</span>;
}

function secBtnStyle(active: boolean): CSSProperties {
  return { display: "inline-flex", alignItems: "center", gap: 6, height: 30, padding: "0 8px", background: "transparent", border: "none", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12, cursor: "pointer", color: active ? "#F1F1F1" : "#9B9B9B" };
}

function DragDots() {
  return (
    <svg width="9" height="12" viewBox="0 0 9 12" fill="none" style={{ flexShrink: 0 }}>
      {[2, 6, 10].map((cy) => (
        <g key={cy}>
          <circle cx="2" cy={cy} r="1" fill="#75767C" />
          <circle cx="7" cy={cy} r="1" fill="#75767C" />
        </g>
      ))}
    </svg>
  );
}
