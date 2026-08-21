"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_TIMEZONE, ApiError, getFeedback } from "../../lib/api";
import type { FeedbackAnalytics, FeedbackScore } from "../../lib/api";
import { clearManagerSession, getManagerBusinessId, getManagerToken } from "../../lib/auth";
import { addDays, bucketColor, dayEndISO, dayStartISO, resolveRange, startOfDay } from "./data";
import { RangePicker } from "./RangePicker";
import type { RangeValue } from "./RangePicker";

const navBtnStyle = { width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, cursor: "pointer" } as const;
const spinner = { width: 18, height: 18, borderRadius: "9999px", boxSizing: "border-box", border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "#FF5C1A", animation: "zspin 0.7s linear infinite" } as const;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "good", label: "Good" },
  { id: "medium", label: "Medium" },
  { id: "bad", label: "Bad" },
];

const QUESTIONS: [string, keyof Pick<FeedbackScore, "productQuality" | "temperature" | "deliverySpeed" | "serviceExperience">][] = [
  ["Product quality", "productQuality"],
  ["Temperature (warm/fresh)", "temperature"],
  ["Delivery speed", "deliverySpeed"],
  ["Service experience", "serviceExperience"],
];

type Bucket = "good" | "medium" | "bad";
function sentimentBucket(s: FeedbackScore["sentiment"]): Bucket {
  return s === "POSITIVE" ? "good" : s === "NEGATIVE" ? "bad" : "medium";
}

function Dots({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ width: 6, height: 6, borderRadius: 9999, background: n <= value ? color : "rgba(255,255,255,0.12)" }} />
      ))}
    </div>
  );
}

export function ReviewsDrawer({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [rangeValue, setRangeValue] = useState<RangeValue>({ rangeId: "30d", customStart: null, customEnd: null });
  const [filter, setFilter] = useState("all");
  const [fb, setFb] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const reqId = useRef(0);

  const range = resolveRange(rangeValue.rangeId, rangeValue.customStart, rangeValue.customEnd, "30d");
  const end = startOfDay(range.end);
  const start = addDays(end, -(range.days - 1));
  const startISO = dayStartISO(start);
  const endISO = dayEndISO(end);

  useEffect(() => {
    const token = getManagerToken();
    const businessId = getManagerBusinessId();
    if (!token) {
      router.replace("/login");
      return;
    }
    const my = ++reqId.current;
    /* eslint-disable react-hooks/set-state-in-effect */
    setError("");
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    getFeedback(token, { startDate: startISO, endDate: endISO, timezone: APP_TIMEZONE, businessId })
      .then((res) => {
        if (my !== reqId.current) return;
        setFb(res);
      })
      .catch((err) => {
        if (my !== reqId.current) return;
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
          return;
        }
        setError(err instanceof ApiError && err.status === 0 ? "Can't reach the server." : "Couldn't load reviews.");
      })
      .finally(() => {
        if (my === reqId.current) setLoading(false);
      });
  }, [startISO, endISO, reload, router]);

  const all = fb?.scores ?? [];
  const list = filter === "all" ? all : all.filter((r) => sentimentBucket(r.sentiment) === filter);
  const total = fb?.summary.quantityOfFeedback ?? 0;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div className="zp-drawer-overlay" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div className="zp-drawer-panel" style={{ position: "relative", width: 460, maxWidth: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#212121", borderLeft: "1px solid rgba(255,255,255,0.09)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#F1F1F1", letterSpacing: "-0.2px" }}>Reviews</div>
            <div style={{ fontSize: 11.5, color: "#9B9B9B", marginTop: 4 }}>{list.length} of {total.toLocaleString("en-US")} reviews</div>
          </div>
          <button type="button" className="zp-cal-nav" onClick={onClose} style={navBtnStyle}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="#9B9B9B" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button key={f.id} type="button" onClick={() => setFilter(f.id)} style={{ height: 28, padding: "0 12px", borderRadius: 9999, cursor: "pointer", border: "1px solid " + (active ? "transparent" : "rgba(255,255,255,0.09)"), background: active ? "rgba(255,92,26,0.14)" : "transparent", color: active ? "#FF5C1A" : "#E8E8E8", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: active ? 600 : 400 }}>
                  {f.label}
                </button>
              );
            })}
          </div>
          <RangePicker value={rangeValue} defRange="30d" onChange={setRangeValue} />
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "4px 20px 20px" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "48px 0", color: "#9B9B9B", fontSize: 12.5 }}>
              <span style={spinner} /> Loading reviews…
            </div>
          )}
          {!loading && error && (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <div style={{ fontSize: 12.5, color: "#F87171", marginBottom: 12 }}>{error}</div>
              <button type="button" onClick={() => setReload((x) => x + 1)} style={{ height: 32, padding: "0 14px", background: "#FF5C1A", border: "none", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717", cursor: "pointer" }}>Try again</button>
            </div>
          )}
          {!loading && !error && list.length === 0 && (
            <div style={{ padding: "48px 0", textAlign: "center", fontSize: 11.5, color: "#9B9B9B" }}>No reviews in this date range.</div>
          )}
          {!loading && !error && list.map((r) => {
            const bucket = sentimentBucket(r.sentiment);
            const c = bucketColor(bucket);
            const name = r.customerName?.trim() || "Guest";
            const items = QUESTIONS.map(([label, key]) => [label, r[key]] as const).filter((x): x is [string, number] => x[1] != null);
            const date = new Date(r.createdAt);
            return (
              <div key={r.id} style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9999, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#2F2F2F", fontSize: 12.5, fontWeight: 600, color: "#E8E8E8" }}>
                    {name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#F1F1F1" }}>{name}</div>
                    <div style={{ fontSize: 10.5, color: "#9B9B9B", fontFamily: "var(--font-mono)", marginTop: 2 }}>#{r.orderNumber ?? r.orderId.slice(0, 6)} · {Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: c, background: "rgba(255,255,255,0.04)", border: "1px solid " + c + "33", borderRadius: 6, padding: "4px 9px", lineHeight: 1 }}>{r.score.toFixed(1)}</div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "14px 0 9px", paddingBottom: 9, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 11.5, color: "#9B9B9B" }}>How was your overall experience?</span>
                  <Dots value={r.score} color={c} />
                </div>
                {items.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
                    {items.map(([label, value]) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 12.5, color: "#E8E8E8" }}>{label}</span>
                        <Dots value={value} color={c} />
                      </div>
                    ))}
                  </div>
                )}

                {r.comment && (
                  <div style={{ marginTop: 12, padding: "10px 12px", background: "#191919", borderRadius: 6, fontSize: 12.5, lineHeight: 1.5, color: "#E8E8E8" }}>{r.comment}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
