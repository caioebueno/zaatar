"use client";

import Button from "@/app/components/Button";
import { useMemo, useState } from "react";

type PromotionRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  active: boolean;
  expireAt: string | null;
  validWeekdays: Weekday[];
  productIds: string[];
};

type ProductOption = {
  id: string;
  name: string;
  itemType: "PRODUCT" | "COMBO";
  visible: boolean;
};

type Props = {
  initialPromotions: PromotionRecord[];
  products: ProductOption[];
};

type ApiError = {
  error?: string;
  field?: string;
};

type EditorMode = "create" | "edit";

type EditorState = {
  id: string;
  name: string;
  active: boolean;
  expireAtInput: string;
  validWeekdays: Weekday[];
  productIds: string[];
};

type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

const WEEKDAY_OPTIONS: { value: Weekday; label: string }[] = [
  { value: "MONDAY", label: "Mon" },
  { value: "TUESDAY", label: "Tue" },
  { value: "WEDNESDAY", label: "Wed" },
  { value: "THURSDAY", label: "Thu" },
  { value: "FRIDAY", label: "Fri" },
  { value: "SATURDAY", label: "Sat" },
  { value: "SUNDAY", label: "Sun" },
];

function toEditorState(promotion: PromotionRecord): EditorState {
  return {
    id: promotion.id,
    name: promotion.name,
    active: promotion.active,
    expireAtInput: toDateTimeLocalInput(promotion.expireAt),
    validWeekdays: [...promotion.validWeekdays],
    productIds: [...promotion.productIds],
  };
}

function createEmptyEditorState(): EditorState {
  return {
    id: "",
    name: "",
    active: true,
    expireAtInput: "",
    validWeekdays: [],
    productIds: [],
  };
}

function toDateTimeLocalInput(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoOrNull(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) return null;

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Expire at must be a valid date");
  }

  return date.toISOString();
}

function sortPromotions(promotions: PromotionRecord[]) {
  return [...promotions].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function formatDate(value: string | null): string {
  if (!value) return "No expiry";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatError(payload: ApiError | null, fallback: string): string {
  if (!payload?.error) return fallback;
  return payload.field ? `${payload.error}: ${payload.field}` : payload.error;
}

export default function PromotionManager({ initialPromotions, products }: Props) {
  const [promotions, setPromotions] = useState<PromotionRecord[]>(
    sortPromotions(initialPromotions),
  );
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<EditorMode>("create");
  const [editor, setEditor] = useState<EditorState>(createEmptyEditorState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const visiblePromotions = useMemo(() => {
    if (!normalizedQuery) return promotions;

    return promotions.filter((promotion) => {
      return (
        promotion.id.toLowerCase().includes(normalizedQuery) ||
        promotion.name.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [promotions, normalizedQuery]);

  const normalizedProductSearch = productSearch.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (!normalizedProductSearch) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(normalizedProductSearch) ||
        product.id.toLowerCase().includes(normalizedProductSearch)
      );
    });
  }, [products, normalizedProductSearch]);

  const selectedProductsCount = editor.productIds.length;

  function startCreate() {
    setMode("create");
    setEditingId(null);
    setEditor(createEmptyEditorState());
    setProductSearch("");
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function startEdit(promotion: PromotionRecord) {
    setMode("edit");
    setEditingId(promotion.id);
    setEditor(toEditorState(promotion));
    setProductSearch("");
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function toggleWeekday(weekday: Weekday) {
    setEditor((current) => {
      const exists = current.validWeekdays.includes(weekday);
      const validWeekdays = exists
        ? current.validWeekdays.filter((item) => item !== weekday)
        : [...current.validWeekdays, weekday];

      return { ...current, validWeekdays };
    });
  }

  function toggleProduct(productId: string) {
    setEditor((current) => {
      const exists = current.productIds.includes(productId);
      const productIds = exists
        ? current.productIds.filter((id) => id !== productId)
        : [...current.productIds, productId];

      return { ...current, productIds };
    });
  }

  function updateField<K extends keyof EditorState>(field: K, value: EditorState[K]) {
    setEditor((current) => ({ ...current, [field]: value }));
  }

  async function refreshPromotions() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/exclusive-promotions", {
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as
        | PromotionRecord[]
        | ApiError
        | null;

      if (!response.ok) {
        throw new Error(
          formatError(payload as ApiError | null, "Unable to load promotions."),
        );
      }

      setPromotions(sortPromotions(payload as PromotionRecord[]));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load promotions.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const name = editor.name.trim();
      if (!name) {
        throw new Error("Name is required");
      }

      const expireAt = toIsoOrNull(editor.expireAtInput);

      const body = {
        name,
        active: editor.active,
        expireAt,
        validWeekdays: editor.validWeekdays,
        productIds: editor.productIds,
      };

      setLoading(true);

      if (mode === "edit" && !editingId) {
        throw new Error("Promotion id is missing.");
      }

      const response = await fetch(
        mode === "create"
          ? "/api/exclusive-promotions"
          : `/api/exclusive-promotions/${editingId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | PromotionRecord
        | ApiError
        | null;

      if (!response.ok) {
        throw new Error(
          formatError(payload as ApiError | null, "Unable to save promotion."),
        );
      }

      const savedPromotion = payload as PromotionRecord;
      setPromotions((current) => {
        const existingIndex = current.findIndex((item) => item.id === savedPromotion.id);

        if (existingIndex === -1) {
          return sortPromotions([...current, savedPromotion]);
        }

        const next = [...current];
        next[existingIndex] = savedPromotion;
        return sortPromotions(next);
      });

      setMode("edit");
      setEditingId(savedPromotion.id);
      setEditor(toEditorState(savedPromotion));
      setSuccessMessage(
        mode === "create"
          ? "Promotion created successfully."
          : "Promotion updated successfully.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save promotion.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function removePromotion(promotionId: string) {
    const confirmed = globalThis.confirm(
      "Delete this promotion? This action cannot be undone.",
    );
    if (!confirmed) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/exclusive-promotions/${promotionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiError | null;
        throw new Error(
          formatError(payload, "Unable to delete promotion."),
        );
      }

      setPromotions((current) => current.filter((item) => item.id !== promotionId));

      if (editingId === promotionId) {
        startCreate();
      }

      setSuccessMessage("Promotion deleted.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete promotion.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f9f9f6_0%,#eff4f1_100%)] px-4 py-6 text-[#122220] md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
        <section className="rounded-3xl border border-[#d9e2dd] bg-white/90 p-5 shadow-[0_24px_80px_rgba(20,40,38,0.08)] md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f706c]">
                Promotions
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] md:text-4xl">
                Exclusive Promotion Manager
              </h1>
              <p className="mt-2 text-sm font-medium text-[#5c6b67]">
                Create, edit, and schedule product-locked promotions for menu links.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  void refreshPromotions();
                }}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-xl"
                onClick={startCreate}
                disabled={loading}
              >
                New Promotion
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a7974]">
                Search
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by id or name"
                className="h-11 rounded-xl border border-[#d4ddda] bg-[#f8faf8] px-3 text-sm font-medium outline-none"
              />
            </label>

            <div className="rounded-xl border border-[#d4ddda] bg-[#f8faf8] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a7974]">
                Total
              </p>
              <p className="mt-1 text-2xl font-black">{promotions.length}</p>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-3xl border border-[#d9e2dd] bg-white shadow-[0_20px_60px_rgba(20,40,38,0.06)]">
            <div className="border-b border-[#e4ebe8] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#6a7974]">
              Promotion List
            </div>

            <div className="max-h-[70vh] overflow-auto">
              {visiblePromotions.length === 0 ? (
                <div className="px-5 py-8 text-sm font-medium text-[#5f706c]">
                  No promotions found.
                </div>
              ) : (
                <ul>
                  {visiblePromotions.map((promotion) => {
                    const selected = editingId === promotion.id && mode === "edit";

                    return (
                      <li
                        key={promotion.id}
                        className={`border-b border-[#edf2f0] px-5 py-4 transition ${
                          selected ? "bg-[#f2f8f5]" : "bg-white"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold text-[#132623]">
                              {promotion.name}
                            </p>
                            <p className="mt-1 truncate text-xs font-medium text-[#6f7d79]">
                              {promotion.id}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                  promotion.active
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-zinc-200 text-zinc-700"
                                }`}
                              >
                                {promotion.active ? "Active" : "Inactive"}
                              </span>
                              <span className="rounded-full bg-[#ecf2ee] px-2 py-1 text-xs font-semibold text-[#3e5a54]">
                                {promotion.productIds.length} products
                              </span>
                              <span className="rounded-full bg-[#ecf2ee] px-2 py-1 text-xs font-semibold text-[#3e5a54]">
                                {promotion.validWeekdays.length} weekdays
                              </span>
                            </div>
                            <p className="mt-2 text-xs font-medium text-[#6f7d79]">
                              Expires: {formatDate(promotion.expireAt)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-lg px-3 py-1.5 text-xs"
                              onClick={() => startEdit(promotion)}
                              disabled={loading}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="rounded-lg border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                              onClick={() => {
                                void removePromotion(promotion.id);
                              }}
                              disabled={loading}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#d9e2dd] bg-white p-5 shadow-[0_20px_60px_rgba(20,40,38,0.06)] md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#687773]">
                  {mode === "create" ? "Create" : "Edit"}
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.02em] text-[#122220]">
                  {mode === "create" ? "New Promotion" : "Promotion Details"}
                </h2>
              </div>

              {mode === "edit" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg px-3 py-1.5 text-xs"
                  onClick={startCreate}
                  disabled={loading}
                >
                  Clear
                </Button>
              ) : null}
            </div>

            <div className="mt-5 space-y-4">
              {mode === "edit" ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#687773]">
                    Promotion Id
                  </span>
                  <input
                    value={editor.id}
                    readOnly
                    className="h-11 rounded-xl border border-[#d4ddda] bg-[#eef3f0] px-3 text-sm font-medium text-[#5f706c]"
                  />
                </label>
              ) : null}

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#687773]">
                  Name
                </span>
                <input
                  value={editor.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Friday Pizza Special"
                  className="h-11 rounded-xl border border-[#d4ddda] bg-[#f8faf8] px-3 text-sm font-medium outline-none"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#687773]">
                  Expire At
                </span>
                <input
                  type="datetime-local"
                  value={editor.expireAtInput}
                  onChange={(event) => updateField("expireAtInput", event.target.value)}
                  className="h-11 rounded-xl border border-[#d4ddda] bg-[#f8faf8] px-3 text-sm font-medium outline-none"
                />
              </label>

              <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#1d312d]">
                <input
                  type="checkbox"
                  checked={editor.active}
                  onChange={(event) => updateField("active", event.target.checked)}
                  className="h-4 w-4 rounded border-[#bac8c2]"
                />
                Promotion active
              </label>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#687773]">
                  Valid Weekdays
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {WEEKDAY_OPTIONS.map((weekday) => {
                    const selected = editor.validWeekdays.includes(weekday.value);

                    return (
                      <button
                        key={weekday.value}
                        type="button"
                        onClick={() => toggleWeekday(weekday.value)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          selected
                            ? "border-[#1f5b4f] bg-[#e2f2eb] text-[#1f5b4f]"
                            : "border-[#d2dcda] bg-white text-[#4d615c]"
                        }`}
                      >
                        {weekday.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#687773]">
                    Products
                  </p>
                  <p className="text-xs font-semibold text-[#4f625d]">
                    {selectedProductsCount} selected
                  </p>
                </div>

                <input
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  placeholder="Search products"
                  className="mt-2 h-10 w-full rounded-xl border border-[#d4ddda] bg-[#f8faf8] px-3 text-sm font-medium outline-none"
                />

                <div className="mt-2 max-h-[300px] overflow-auto rounded-xl border border-[#e1e8e4] bg-[#fbfcfb]">
                  {filteredProducts.length === 0 ? (
                    <p className="px-3 py-4 text-sm font-medium text-[#657570]">
                      No products found.
                    </p>
                  ) : (
                    <ul>
                      {filteredProducts.map((product) => {
                        const selected = editor.productIds.includes(product.id);

                        return (
                          <li
                            key={product.id}
                            className="border-b border-[#edf2f0] px-3 py-2 last:border-b-0"
                          >
                            <label className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleProduct(product.id)}
                                className="h-4 w-4 rounded border-[#bac8c2]"
                              />
                              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#1c302c]">
                                {product.name}
                              </span>
                              <span className="rounded-full bg-[#edf3ef] px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-[#50635f]">
                                {product.itemType}
                              </span>
                              {!product.visible ? (
                                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-zinc-600">
                                  Hidden
                                </span>
                              ) : null}
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  void submit();
                }}
                disabled={loading}
              >
                {loading ? "Saving..." : mode === "create" ? "Create" : "Save changes"}
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => updateField("productIds", [])}
                disabled={loading || editor.productIds.length === 0}
              >
                Clear products
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
