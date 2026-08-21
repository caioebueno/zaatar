"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { APP_TIMEZONE, ApiError, listOrdersV1 } from "../../lib/api";
import type { OrderListItem } from "../../lib/api";
import { clearManagerSession, getManagerBusinessId, getManagerToken } from "../../lib/auth";
import { addDays, formatCreatedAt, isoDate, moneyFromCents, orderLabel, paymentStatus, resolveRange, startOfDay, typeLabel } from "./data";
import { paymentBadge, typeBadge } from "./badges";
import { DateRangePicker } from "./DateRangePicker";
import type { RangeValue } from "./DateRangePicker";
import { OrderDetail } from "./OrderDetail";

type Col = { key: string; label: string; w: string; mono?: boolean; color?: string; right?: boolean };

const COLS_FULL: Col[] = [
  { key: "id", label: "Order", w: "68px", mono: true, color: "#FF5C1A" },
  { key: "customer", label: "Customer", w: "minmax(96px,1.2fr)" },
  { key: "type", label: "Type", w: "minmax(72px,0.7fr)" },
  { key: "payment", label: "Payment", w: "112px" },
  { key: "createdAt", label: "Created at", w: "minmax(96px,0.9fr)", mono: true, color: "#9B9B9B" },
  { key: "total", label: "Total", w: "80px", mono: true, right: true },
];

const COLS_SPLIT: Col[] = [
  { key: "id", label: "Order", w: "60px", mono: true, color: "#FF5C1A" },
  { key: "customer", label: "Customer", w: "minmax(64px,1fr)" },
  { key: "payment", label: "Payment", w: "104px" },
  { key: "total", label: "Total", w: "64px", mono: true, right: true },
];

const PAGE_SIZE = 50;
const TIMEZONE = APP_TIMEZONE;

const spinner: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: "9999px",
  boxSizing: "border-box",
  border: "2px solid rgba(255,255,255,0.15)",
  borderTopColor: "#FF5C1A",
  animation: "zspin 0.7s linear infinite",
};

function cellText(o: OrderListItem, key: string): string {
  switch (key) {
    case "id":
      return orderLabel(o);
    case "customer":
      return o.customer?.name?.trim() || "Guest";
    case "createdAt":
      return formatCreatedAt(o.createdAt);
    case "total":
      return moneyFromCents(o.totalCents);
    default:
      return "";
  }
}

export function OrdersScreen() {
  const router = useRouter();

  const [items, setItems] = useState<OrderListItem[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rangeValue, setRangeValue] = useState<RangeValue>({ rangeId: "30d", customStart: null, customEnd: null });

  const reqId = useRef(0);
  const fetchingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const range = resolveRange(rangeValue.rangeId, rangeValue.customStart, rangeValue.customEnd);
  const end = startOfDay(range.end);
  const from = isoDate(addDays(end, -(range.days - 1)));
  const to = isoDate(end);

  const load = useCallback(
    async (pageToLoad: number, reset: boolean) => {
      const token = getManagerToken();
      const businessId = getManagerBusinessId();
      if (!token) {
        router.replace("/login");
        return;
      }
      const myReq = reset ? ++reqId.current : reqId.current;
      fetchingRef.current = true;
      if (reset) {
        setLoading(true);
        setSelected(null);
      } else {
        setLoadingMore(true);
      }
      setError("");
      try {
        const res = await listOrdersV1(token, {
          page: pageToLoad,
          pageSize: PAGE_SIZE,
          from,
          to,
          timezone: TIMEZONE,
          includeCanceled: true,
          businessId,
        });
        if (myReq !== reqId.current) return;
        setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
        setHasNext(res.hasNextPage);
        if (reset) scrollRef.current?.scrollTo({ top: 0 });
      } catch (err) {
        if (myReq !== reqId.current) return;
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
          return;
        }
        setError(err instanceof ApiError && err.status === 0 ? "Can't reach the server." : "Couldn't load orders.");
        if (reset) setItems([]);
      } finally {
        if (myReq === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
          fetchingRef.current = false;
        }
      }
    },
    [from, to, router],
  );

  // Reset + load page 1 whenever the date range changes. `load` sets a loading
  // flag synchronously before the async fetch — intentional for a data effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(1, true);
  }, [load]);

  const nextPage = Math.ceil(items.length / PAGE_SIZE) + 1;
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 320 && hasNext && !fetchingRef.current) {
      load(nextPage, false);
    }
  };

  const q = search.trim().toLowerCase();
  const visible = q
    ? items.filter(
        (o) =>
          (o.number ?? "").toLowerCase().includes(q) ||
          (o.customer?.name ?? "").toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q),
      )
    : items;

  const selectedOrder = selected ? items.find((o) => o.id === selected) ?? null : null;
  const split = !!selectedOrder;
  const cols = split ? COLS_SPLIT : COLS_FULL;
  const gridTemplate = cols.map((c) => c.w).join(" ");

  const cellStyle = (c: Col): CSSProperties => ({
    fontSize: 12.5,
    color: c.color || "#E8E8E8",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textAlign: c.right ? "right" : "left",
    fontFamily: c.mono ? "var(--font-mono)" : "var(--font-body)",
  });

  const showEmpty = !loading && !error && visible.length === 0;

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#F1F1F1", letterSpacing: "-0.2px" }}>Orders</div>
        <DateRangePicker value={rangeValue} onChange={setRangeValue} />
        <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#2F2F2F", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, padding: "0 10px", height: 32, width: 220, flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <circle cx="6.2" cy="6.2" r="4.4" stroke="#9B9B9B" strokeWidth="1.4" />
            <path d="M9.6 9.6L12.2 12.2" stroke="#9B9B9B" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, customer"
            style={{ background: "transparent", border: "none", color: "#F1F1F1", fontSize: 12.5, fontFamily: "var(--font-body)", width: "100%", outline: "none" }}
          />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: 8, alignItems: "center", padding: "0 14px", height: 38, background: "#202020", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
            {cols.map((c) => (
              <div key={c.key} style={{ fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: c.right ? "right" : "left", whiteSpace: "nowrap" }}>
                {c.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div ref={scrollRef} onScroll={onScroll} style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "56px 0", color: "#9B9B9B", fontSize: 12.5 }}>
                <span style={spinner} /> Loading orders…
              </div>
            )}

            {!loading && error && (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <div style={{ fontSize: 12.5, color: "#F87171", marginBottom: 12 }}>{error}</div>
                <button
                  type="button"
                  onClick={() => load(1, true)}
                  style={{ height: 32, padding: "0 14px", background: "#FF5C1A", border: "none", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717", cursor: "pointer" }}
                >
                  Try again
                </button>
              </div>
            )}

            {showEmpty && (
              <div style={{ padding: "56px 0", textAlign: "center", fontSize: 11.5, color: "#9B9B9B" }}>
                {q ? "No orders match your search." : "No orders in this range."}
              </div>
            )}

            {visible.map((o) => {
              const isSel = selectedOrder?.id === o.id;
              return (
                <div
                  key={o.id}
                  className="zp-row"
                  onClick={() => setSelected(isSel ? null : o.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: gridTemplate,
                    gap: 8,
                    alignItems: "center",
                    padding: "0 14px",
                    height: 46,
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    background: isSel ? "rgba(255,92,26,0.10)" : "transparent",
                    boxShadow: isSel ? "inset 2px 0 0 #FF5C1A" : "none",
                  }}
                >
                  {cols.map((c) => {
                    if (c.key === "type" || c.key === "payment") {
                      const label = c.key === "type" ? typeLabel(o.orderType) : paymentStatus(o.payments, o.totalCents);
                      const bd = c.key === "type" ? typeBadge(label) : paymentBadge(label);
                      return (
                        <div key={c.key} style={{ minWidth: 0 }}>
                          <span style={bd.badgeStyle}>
                            <span style={bd.dotStyle} />
                            {label}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={c.key} style={cellStyle(c)}>
                        {cellText(o, c.key)}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {loadingMore && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px 0", color: "#75767C", fontSize: 11.5 }}>
                <span style={{ ...spinner, width: 14, height: 14 }} /> Loading more…
              </div>
            )}
          </div>
        </div>

        {selectedOrder && <OrderDetail order={selectedOrder} onClose={() => setSelected(null)} />}
      </div>
    </>
  );
}
