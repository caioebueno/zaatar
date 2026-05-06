"use client";

import Button from "@/app/components/Button";
import { useMemo, useState } from "react";

type ProductOption = {
  id: string;
  name: string;
  itemType: "PRODUCT" | "COMBO";
  visible: boolean;
};

type FeedbackSettings = {
  id: string;
  active: boolean;
  rewardProductId: string | null;
  rewardQuantity: number;
  updatedAt: string;
};

type ApiError = {
  error?: string;
  field?: string;
};

type Props = {
  products: ProductOption[];
  initialSettings: FeedbackSettings;
};

function formatError(payload: ApiError | null, fallback: string): string {
  if (!payload?.error) return fallback;
  return payload.field ? `${payload.error}: ${payload.field}` : payload.error;
}

export default function FeedbackSettingsManager({ products, initialSettings }: Props) {
  const [settings, setSettings] = useState<FeedbackSettings>(initialSettings);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) => {
      return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    });
  }, [products, search]);

  const selectedProduct = products.find((p) => p.id === settings.rewardProductId) ?? null;

  async function saveSettings() {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/feedback-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active: settings.active,
          rewardProductId: settings.rewardProductId,
          rewardQuantity: settings.rewardQuantity,
        }),
      });

      const payload = (await response.json()) as FeedbackSettings | ApiError;

      if (!response.ok) {
        setErrorMessage(
          formatError(payload as ApiError, "Unable to save feedback settings."),
        );
        return;
      }

      setSettings(payload as FeedbackSettings);
      setSuccessMessage("Feedback settings updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save feedback settings.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-6 py-8">
      <header className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Feedback</p>
        <h1 className="mt-2 text-2xl font-black text-[#111827]">Feedback Settings</h1>
        <p className="mt-2 text-sm text-[#4B5563]">
          Configure how feedback rewards are issued (for example, which product is gifted).
        </p>
      </header>

      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#111827]">Reward active</span>
            <button
              type="button"
              onClick={() =>
                setSettings((current) => ({
                  ...current,
                  active: !current.active,
                }))
              }
              className={`w-fit rounded-full px-4 py-2 text-sm font-semibold transition ${
                settings.active
                  ? "bg-[#E8F6EA] text-[#1F5B39]"
                  : "bg-[#F3F4F6] text-[#4B5563]"
              }`}
            >
              {settings.active ? "Active" : "Inactive"}
            </button>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#111827]">Reward quantity</span>
            <input
              type="number"
              min={1}
              max={50}
              value={settings.rewardQuantity}
              onChange={(event) => {
                const next = Number(event.target.value);
                setSettings((current) => ({
                  ...current,
                  rewardQuantity: Number.isInteger(next) && next > 0 ? next : 1,
                }));
              }}
              className="h-11 rounded-xl border border-[#D1D5DB] px-3 text-sm"
            />
          </label>
        </div>

        <div className="mt-6">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#111827]">Search reward product</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product name or id"
              className="h-11 rounded-xl border border-[#D1D5DB] px-3 text-sm"
            />
          </label>
        </div>

        <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-[#E5E7EB]">
          {filteredProducts.length === 0 ? (
            <div className="p-4 text-sm text-[#6B7280]">No products found.</div>
          ) : (
            filteredProducts.map((product) => {
              const selected = settings.rewardProductId === product.id;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() =>
                    setSettings((current) => ({
                      ...current,
                      rewardProductId: selected ? null : product.id,
                    }))
                  }
                  className={`flex w-full items-center justify-between border-b border-[#EEF0F2] px-4 py-3 text-left text-sm transition last:border-b-0 ${
                    selected ? "bg-[#F2FAF2]" : "bg-white hover:bg-[#F9FAFB]"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#111827]">{product.name}</span>
                    <span className="text-xs text-[#6B7280]">{product.id}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#4B5563]">
                    {product.itemType}
                    {!product.visible ? " • Hidden" : ""}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 text-sm text-[#4B5563]">
          Selected reward product: {selectedProduct ? selectedProduct.name : "None"}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button
            type="button"
            onClick={() => void saveSettings()}
            className="bg-brandBackground px-6 py-2 text-white"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save settings"}
          </Button>
          {successMessage ? <span className="text-sm text-[#166534]">{successMessage}</span> : null}
          {errorMessage ? <span className="text-sm text-[#B91C1C]">{errorMessage}</span> : null}
        </div>
      </section>
    </main>
  );
}
