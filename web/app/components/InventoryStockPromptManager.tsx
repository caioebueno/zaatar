"use client";

import Button from "@/app/components/Button";
import { useEffect, useState } from "react";

type InventoryPlace = {
  id: string;
  name: string;
  type: "FRIDGE" | "FREEZER" | "SHELF" | "PANTRY" | "OTHER";
  active: boolean;
  displayOrder: number | null;
};

type InventoryStock = {
  id: string;
  placeId: string;
  productId: string;
  placeName: string;
  productName: string;
  currentQuantity: number;
  includeInChecklist: boolean;
  lastCheckedAt: string | null;
  lastCheckedBy: string | null;
};

type InventoryErrorResponse = {
  error?: string;
  field?: string;
  reason?: string;
  id?: string;
};

function stockKey(placeId: string, productId: string) {
  return `${placeId}:${productId}`;
}

function formatInventoryError(
  payload: InventoryErrorResponse | null,
  fallback: string,
) {
  if (!payload?.error) {
    return fallback;
  }

  const detail = payload.field ?? payload.reason ?? payload.id;
  return detail ? `${payload.error}: ${detail}` : payload.error;
}

export default function InventoryStockPromptManager() {
  const [places, setPlaces] = useState<InventoryPlace[]>([]);
  const [stocks, setStocks] = useState<InventoryStock[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingKeys, setPendingKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void loadData(true);
  }, []);

  async function loadData(initial = false) {
    if (initial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setErrorMessage(null);

    try {
      const [placesResponse, stocksResponse] = await Promise.all([
        fetch("/api/inventory/places", { cache: "no-store" }),
        fetch("/api/inventory/stocks", { cache: "no-store" }),
      ]);

      const [placesPayload, stocksPayload] = (await Promise.all([
        placesResponse.json(),
        stocksResponse.json(),
      ])) as [InventoryPlace[] | InventoryErrorResponse, InventoryStock[] | InventoryErrorResponse];

      if (!placesResponse.ok) {
        throw new Error(
          formatInventoryError(
            placesPayload as InventoryErrorResponse,
            "Unable to load inventory places.",
          ),
        );
      }

      if (!stocksResponse.ok) {
        throw new Error(
          formatInventoryError(
            stocksPayload as InventoryErrorResponse,
            "Unable to load inventory stocks.",
          ),
        );
      }

      setPlaces(placesPayload as InventoryPlace[]);
      setStocks(stocksPayload as InventoryStock[]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load inventory data.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  async function handleToggle(stock: InventoryStock, nextValue: boolean) {
    const key = stockKey(stock.placeId, stock.productId);
    const previousStocks = stocks;

    setPendingKeys((current) => ({ ...current, [key]: true }));
    setErrorMessage(null);
    setStocks((current) =>
      current.map((item) =>
        item.placeId === stock.placeId && item.productId === stock.productId
          ? { ...item, includeInChecklist: nextValue }
          : item,
      ),
    );

    try {
      const response = await fetch("/api/inventory/stocks/prompt", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placeId: stock.placeId,
          productId: stock.productId,
          includeInChecklist: nextValue,
          actorId: null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | InventoryStock
        | InventoryErrorResponse
        | null;

      if (!response.ok) {
        throw new Error(
          formatInventoryError(payload as InventoryErrorResponse | null, "Unable to update checklist prompt."),
        );
      }

      const updatedStock = payload as InventoryStock;
      setStocks((current) =>
        current.map((item) =>
          item.placeId === updatedStock.placeId &&
          item.productId === updatedStock.productId
            ? updatedStock
            : item,
        ),
      );
    } catch (error) {
      setStocks(previousStocks);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update checklist prompt.",
      );
    } finally {
      setPendingKeys((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredStocks = stocks.filter((stock) => {
    if (selectedPlaceId !== "all" && stock.placeId !== selectedPlaceId) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return (
      stock.productName.toLowerCase().includes(normalizedSearch) ||
      stock.placeName.toLowerCase().includes(normalizedSearch)
    );
  });

  const includedCount = filteredStocks.filter(
    (stock) => stock.includeInChecklist,
  ).length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f5ef_0%,#eef3ef_100%)] px-6 py-8 text-text md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[28px] border border-black/5 bg-white/90 shadow-[0_24px_80px_rgba(20,40,38,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6d7d79]">
                Inventory Admin
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#102321] md:text-5xl">
                Checklist Prompt Control
              </h1>
              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-[#5d6866] md:text-base">
                Choose which stock rows should appear when the daily inventory checklist
                is created. Each toggle updates the live `product + place` stock pairing.
              </p>
            </div>

            <div className="grid min-w-full gap-3 md:min-w-[340px] md:grid-cols-2">
              <div className="rounded-2xl bg-[#142826] px-5 py-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  Visible in checklist
                </p>
                <p className="mt-2 text-3xl font-black">{includedCount}</p>
              </div>
              <div className="rounded-2xl bg-[#edf2ef] px-5 py-4 text-[#142826]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64706d]">
                  Hidden from checklist
                </p>
                <p className="mt-2 text-3xl font-black">
                  {Math.max(filteredStocks.length - includedCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-black/5 bg-white/90 p-6 shadow-[0_18px_60px_rgba(20,40,38,0.06)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#687471]">
                  Place
                </span>
                <select
                  className="h-12 rounded-2xl border border-[#d6dfdb] bg-[#f8faf8] px-4 text-sm font-semibold text-[#142826] outline-none"
                  value={selectedPlaceId}
                  onChange={(event) => setSelectedPlaceId(event.target.value)}
                >
                  <option value="all">All places</option>
                  {places.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#687471]">
                  Search
                </span>
                <input
                  className="h-12 rounded-2xl border border-[#d6dfdb] bg-[#f8faf8] px-4 text-sm font-medium text-[#142826] outline-none placeholder:text-[#93a09c]"
                  placeholder="Find by product or place"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-2xl px-5 text-sm"
              onClick={() => void loadData(false)}
              disabled={isRefreshing || isLoading}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-[#efc5c4] bg-[#fff0ef] px-4 py-3 text-sm font-semibold text-[#9b342d]">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="py-16 text-center text-sm font-semibold text-[#667370]">
              Loading stock rows...
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[24px] border border-[#e1e8e4]">
              <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_160px] gap-4 bg-[#f3f6f4] px-6 py-4 text-xs font-bold uppercase tracking-[0.16em] text-[#6c7774] md:grid">
                <span>Product</span>
                <span>Place</span>
                <span>Quantity</span>
                <span>Checklist Prompt</span>
              </div>

              {filteredStocks.length === 0 ? (
                <div className="px-6 py-14 text-center text-sm font-semibold text-[#667370]">
                  No stock rows match the current filters.
                </div>
              ) : (
                filteredStocks.map((stock) => {
                  const key = stockKey(stock.placeId, stock.productId);
                  const isPending = pendingKeys[key] === true;

                  return (
                    <div
                      key={key}
                      className="grid gap-4 border-t border-[#edf1ee] px-6 py-5 first:border-t-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_120px_160px] md:items-center"
                    >
                      <div>
                        <p className="text-base font-bold text-[#142826]">
                          {stock.productName}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[#8a9792]">
                          {stock.productId}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[#203330]">
                          {stock.placeName}
                        </p>
                        <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[#8a9792]">
                          {stock.placeId}
                        </p>
                      </div>

                      <div className="text-sm font-bold text-[#142826]">
                        {stock.currentQuantity}
                      </div>

                      <label className="inline-flex items-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={stock.includeInChecklist}
                          aria-label={`Toggle checklist prompt for ${stock.productName} at ${stock.placeName}`}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                            stock.includeInChecklist ? "bg-[#1d6b5f]" : "bg-[#c5cfca]"
                          } ${isPending ? "opacity-60" : ""}`}
                          onClick={() =>
                            void handleToggle(stock, !stock.includeInChecklist)
                          }
                          disabled={isPending}
                        >
                          <span
                            className={`absolute h-6 w-6 rounded-full bg-white shadow transition ${
                              stock.includeInChecklist ? "translate-x-7" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className="text-sm font-semibold text-[#304440]">
                          {isPending
                            ? "Saving..."
                            : stock.includeInChecklist
                              ? "Included"
                              : "Hidden"}
                        </span>
                      </label>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
