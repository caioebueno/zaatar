"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_TIMEZONE, ApiError, getAverageTicket, getNewCustomers, getOrderQuantity, getRevenue, hasChannelBreakdown, hasRevenueComponents } from "../../lib/api";
import type { BarChartAnalytics, BarChartParams, ChannelBreakdown, RevenueBreakdown, WebsitePaymentBreakdown } from "../../lib/api";
import { clearManagerSession, getManagerBusinessId, getManagerToken } from "../../lib/auth";
import { METRICS, addDays, buckets, deltaPill, fmt, labelFor, resolveCompare, resolveRange, series, startOfDay } from "./data";
import type { CompareValue, MetricFormat } from "./data";
import { RangePicker } from "./RangePicker";
import type { RangeValue } from "./RangePicker";
import { CompareControl } from "./CompareControl";
import { Select } from "../_components/Select";

const H = 240;

const spinner = { width: 18, height: 18, borderRadius: "9999px", boxSizing: "border-box", border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "#FF5C1A", animation: "zspin 0.7s linear infinite" } as const;

/** Metrics backed by a real bar-chart analytics endpoint. `unit` scales the API value (cents→dollars). */
const API_METRICS: Record<string, { fetch: (token: string, params: BarChartParams) => Promise<BarChartAnalytics>; format: MetricFormat; stackByChannel?: boolean; unit: number }> = {
  orders: { fetch: getOrderQuantity, format: "count", unit: 1, stackByChannel: true },
  revenue: { fetch: getRevenue, format: "currency", unit: 1 / 100, stackByChannel: true },
  customers: { fetch: getNewCustomers, format: "count", unit: 1 },
  ticket: { fetch: getAverageTicket, format: "currency", unit: 1 / 100 },
};

/**
 * Revenue and order quantity split each bar by where the order came from.
 * Listed base-first — our own site sits at the bottom of the stack — and
 * rendered top-down by reversing.
 *
 * Hues are fixed per channel and never cycled. Checked with the palette
 * validator against this screen's dark surface: worst adjacent pair ΔE 14.4
 * (deuteranopia), well above the 8 floor. Square keeps the neutral gray so the
 * three ordering channels carry the saturated hues, and the teal avoids reusing
 * the status green of the delta pills.
 */
const CHANNEL_PARTS: { color: string; hoverColor: string; id: keyof ChannelBreakdown; label: string }[] = [
  { id: "website", label: "Website", color: "#FF5C1A", hoverColor: "#FF7B42" },
  { id: "doordash", label: "DoorDash", color: "#FFD600", hoverColor: "#FFE24D" },
  { id: "uberEats", label: "Uber Eats", color: "#2DD4BF", hoverColor: "#5FE0D1" },
  { id: "square", label: "Square", color: "#8A8B90", hoverColor: "#A2A3A8" },
];

/**
 * On revenue, the Website channel is split further by how the order was paid.
 * Card keeps the Website orange so the channel still reads as one block; cash
 * is its lighter tint. Zelle is not in the design and only shows when non-zero.
 */
const WEBSITE_PAYMENT_PARTS: { color: string; hoverColor: string; id: keyof WebsitePaymentBreakdown; label: string }[] = [
  { id: "card", label: "Card", color: "#FF5C1A", hoverColor: "#FF7B42" },
  { id: "cash", label: "Cash", color: "#FF9E6B", hoverColor: "#FFB58C" },
  { id: "zelle", label: "Zelle", color: "#C2410C", hoverColor: "#DC5A1F" },
  { id: "unknown", label: "Unknown", color: "#6B6B6B", hoverColor: "#8A8A8A" },
];

/**
 * Revenue still reports what makes up the total. The bars stack by channel, so
 * these are surfaced in the hover tooltip only — and without colour dots, which
 * would imply they were segments of the bar.
 */
const REVENUE_COMPONENTS: { id: keyof RevenueBreakdown; label: string }[] = [
  { id: "sales", label: "Sales" },
  { id: "tax", label: "Tax" },
  { id: "tip", label: "Tips" },
  { id: "deliveryFee", label: "Delivery fee" },
];

type Component = { label: string; value: number };
/** A channel slice of a bar. `sub` (revenue Website only) replaces it in the stack with its payment split. */
type Segment = { color: string; hoverColor: string; id: string; label: string; value: number; sub?: Segment[] | null };

const nonEmpty = (segments: Segment[]): Segment[] | null => (segments.length > 0 ? segments : null);
type PartTotal = { color: string; id: string; label: string; share: number; total: number; sub?: { id: string; label: string; color: string; total: number }[] | null };
type Bar = { label: string; value: number; compare: number | null; segments: Segment[] | null; components: Component[] | null; weekday: string | null };

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Weekday initial for a `YYYY-MM-DD` bucket key. Parsed from its parts rather
 * than `new Date(key)`, which reads the string as UTC midnight and lands on the
 * previous day in any western timezone.
 */
function weekdayInitial(key: string): string | null {
  const [year, month, day] = key.split("-").map(Number);
  if (!year || !month || !day) return null;
  return WEEKDAY_INITIALS[new Date(year, month - 1, day).getDay()] ?? null;
}
type ChartModel = {
  bars: Bar[];
  total: number;
  compareTotal: number | null;
  deltaPct: number | null;
  max: number;
  format: MetricFormat;
  goodUp: boolean;
  hasCompare: boolean;
  labelStep: number;
  /** Per-part totals for the legend summary — revenue only, null for every other metric. */
  parts: PartTotal[] | null;
};

function dayStartISO(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
}
function dayEndISO(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
}

export function MetricSection() {
  const router = useRouter();
  const [metricId, setMetricId] = useState("orders");
  const [compareVal, setCompareVal] = useState<CompareValue>({ on: true, start: null });
  const [rangeValue, setRangeValue] = useState<RangeValue>({ rangeId: "7d", customStart: null, customEnd: null });
  const [hover, setHover] = useState<number | null>(null);

  const [data, setData] = useState<BarChartAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [reload, setReload] = useState(0);
  const reqId = useRef(0);

  const metric = METRICS.find((m) => m.id === metricId) ?? METRICS[0];
  const apiMeta = API_METRICS[metric.id];
  const isApi = !!apiMeta;
  const range = resolveRange(rangeValue.rangeId, rangeValue.customStart, rangeValue.customEnd, "7d");
  const rc = resolveCompare(compareVal, range.days, range.end);
  const hasCompare = rc.on;

  const end = startOfDay(range.end);
  const start = addDays(end, -(range.days - 1));
  const startISO = dayStartISO(start);
  const endISO = dayEndISO(end);
  const compareStartISO = hasCompare ? dayStartISO(rc.start) : "";

  // Reset cached data when switching between different API metrics so we never
  // show one metric's data while another loads.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
  }, [metric.id]);

  useEffect(() => {
    if (!apiMeta) return;
    const token = getManagerToken();
    const businessId = getManagerBusinessId();
    if (!token) {
      router.replace("/login");
      return;
    }
    const my = ++reqId.current;
    /* eslint-disable react-hooks/set-state-in-effect */
    setErrorMsg("");
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    apiMeta
      .fetch(token, { startDate: startISO, endDate: endISO, compareStartDate: compareStartISO || undefined, timezone: APP_TIMEZONE, businessId })
      .then((res) => {
        if (my !== reqId.current) return;
        setData(res);
      })
      .catch((err) => {
        if (my !== reqId.current) return;
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
          return;
        }
        setErrorMsg(err instanceof ApiError && err.status === 0 ? "Can't reach the server." : `Couldn't load ${metric.label.toLowerCase()}.`);
      })
      .finally(() => {
        if (my === reqId.current) setLoading(false);
      });
  }, [apiMeta, metric.label, startISO, endISO, compareStartISO, reload, router]);

  // ── Build the chart model (real API for orders/revenue, mock otherwise) ──
  let model: ChartModel | null = null;
  let showLoading = false;
  let error = "";

  if (isApi) {
    if (loading || !data) {
      if (errorMsg && !loading) error = errorMsg;
      else showLoading = true;
    } else {
      const u = apiMeta.unit;
      const cmpVals = hasCompare ? data.buckets.map((b) => (b.compareValue ?? 0) * u) : [];
      // Only revenue and order quantity carry a channel split; the others fall
      // back to the plain single-colour bar.
      const channelData = apiMeta.stackByChannel && hasChannelBreakdown(data) ? data : null;
      const revenueData = hasRevenueComponents(data) ? data : null;
      // Payment sub-split of the Website channel, revenue only.
      const paymentSplit = (wp: WebsitePaymentBreakdown | undefined): Segment[] | null =>
        wp ? nonEmpty(WEBSITE_PAYMENT_PARTS.map((p) => ({ ...p, value: (wp[p.id] ?? 0) * u })).filter((seg) => seg.value > 0)) : null;
      const grandTotal = data.summary.total * u;
      model = {
        bars: data.buckets.map((b, i) => {
          const row = channelData?.buckets[i];
          return {
            label: b.label,
            weekday: weekdayInitial(b.key),
            value: b.value * u,
            compare: hasCompare ? (b.compareValue ?? 0) * u : null,
            // Zero channels are dropped rather than floored to 1px — a day with
            // no DoorDash orders must not show a DoorDash sliver. A day with no
            // value at all keeps `null` so it falls back to the plain 2px stub.
            segments: row
              ? nonEmpty(
                  CHANNEL_PARTS.map((p) => ({
                    ...p,
                    value: row.channels[p.id] * u,
                    sub: p.id === "website" ? paymentSplit(revenueData?.buckets[i]?.websitePayments) : null,
                  })).filter((seg) => seg.value > 0),
                )
              : null,
            components: revenueData?.buckets[i]
              ? REVENUE_COMPONENTS.map((c) => ({ label: c.label, value: revenueData.buckets[i]![c.id] * u }))
              : null,
          };
        }),
        parts: channelData
          ? CHANNEL_PARTS.map((p) => ({
              id: p.id,
              label: p.label,
              color: p.color,
              total: channelData.summary.channels[p.id] * u,
              share: grandTotal > 0 ? (channelData.summary.channels[p.id] * u) / grandTotal : 0,
              sub:
                p.id === "website"
                  ? paymentSplit(revenueData?.summary.websitePayments)?.map((seg) => ({ id: seg.id, label: seg.label, color: seg.color, total: seg.value })) ?? null
                  : null,
            }))
          : null,
        total: grandTotal,
        compareTotal: hasCompare && data.comparison ? data.comparison.total * u : null,
        deltaPct: hasCompare ? data.comparison?.deltaPercentage ?? null : null,
        max: Math.max(data.summary.maxBucketValue * u, ...cmpVals, 0) * 1.08 || 1,
        format: apiMeta.format,
        goodUp: metric.goodUp,
        hasCompare: hasCompare && !!data.comparison,
        labelStep: Math.max(1, Math.ceil(data.buckets.length / 14)),
      };
    }
  } else {
    const { count, span } = buckets(range.days);
    const cur = series(metric, range.days, 1.7);
    const cmp = hasCompare ? series(metric, range.days, rc.seed).map((v) => v * rc.factor) : [];
    const agg = (arr: number[]) => (metric.agg === "sum" ? arr.reduce((a, b) => a + b, 0) : arr.reduce((a, b) => a + b, 0) / arr.length);
    const total = agg(cur);
    const compareTotal = hasCompare ? agg(cmp) : null;
    model = {
      bars: cur.map((v, i) => ({ label: labelFor(i, count, span, end), weekday: null, value: v, compare: hasCompare ? cmp[i] : null, segments: null, components: null })),
      parts: null,
      total,
      compareTotal,
      deltaPct: hasCompare && compareTotal ? ((total - compareTotal) / compareTotal) * 100 : null,
      max: Math.max(...cur, ...(hasCompare ? cmp : [0])) * 1.08 || 1,
      format: metric.format,
      goodUp: metric.goodUp,
      hasCompare,
      labelStep: 1, // mock labels are already thinned by labelFor()
    };
  }

  const count = model ? model.bars.length : 0;
  const gap = count <= 14 ? 10 : count <= 20 ? 8 : 4;
  const barW = count <= 14 ? (model?.hasCompare ? 16 : 26) : count <= 20 ? 12 : 8;
  const yTicks = model ? [3, 2, 1, 0].map((k) => fmt((model!.max * k) / 3, model!.format)) : [];
  const good = model && model.deltaPct != null ? (model.goodUp ? model.deltaPct >= 0 : model.deltaPct <= 0) : true;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <Select
          value={metricId}
          onValueChange={(v) => { setMetricId(v); setHover(null); }}
          ariaLabel="Metric"
          options={METRICS.map((m) => ({ value: m.id, label: m.label }))}
          triggerStyle={{ fontWeight: 500 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RangePicker value={rangeValue} defRange="7d" onChange={(v) => { setRangeValue(v); setHover(null); }} />
          <CompareControl value={compareVal} days={range.days} primaryEnd={range.end} onChange={(v) => { setCompareVal(v); setHover(null); }} />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 16, margin: "24px 0 4px" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, whiteSpace: "nowrap" }}>
            {metric.label} · {range.label}
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 36, color: "#F1F1F2", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {model ? fmt(model.total, model.format) : "—"}
          </div>
        </div>
        {model && model.hasCompare && model.deltaPct != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 4 }}>
            <span style={deltaPill(good)}>{(model.deltaPct >= 0 ? "+" : "") + model.deltaPct.toFixed(1) + "%"}</span>
            {model.compareTotal != null && <span style={{ fontSize: 11.5, color: "#9B9B9B", whiteSpace: "nowrap" }}>vs {fmt(model.compareTotal, model.format)} in {rc.label}</span>}
          </div>
        )}
      </div>

      {showLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, height: H + 30, color: "#9B9B9B", fontSize: 12.5 }}>
          <span style={spinner} /> Loading {metric.label.toLowerCase()}…
        </div>
      )}

      {error && (
        <div style={{ height: H + 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ fontSize: 12.5, color: "#F87171" }}>{error}</div>
          <button type="button" onClick={() => setReload((x) => x + 1)} style={{ height: 32, padding: "0 14px", background: "#FF5C1A", border: "none", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717", cursor: "pointer" }}>Try again</button>
        </div>
      )}

      {model && (
        <>
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <div style={{ width: 56, height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 2 }}>
              {yTicks.map((t, i) => (<span key={i} style={{ fontSize: 10.5, color: "#9B9B9B", fontFamily: "var(--font-mono)", lineHeight: 1 }}>{t}</span>))}
            </div>
            <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
              <div style={{ position: "absolute", inset: 0, height: H, display: "flex", flexDirection: "column", justifyContent: "space-between", pointerEvents: "none" }}>
                {yTicks.map((_, i) => (<div key={i} style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />))}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap, height: H, position: "relative" }}>
                {model.bars.map((b, i) => {
                  const hovered = hover === i;
                  const h = Math.max(2, (b.value / model!.max) * H);
                  const ch = model!.hasCompare ? Math.max(2, ((b.compare ?? 0) / model!.max) * H) : 0;
                  return (
                    <div key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                      style={{ flex: 1, minWidth: 0, height: H, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 3, borderRadius: 4, background: hovered ? "rgba(255,255,255,0.04)" : "transparent" }}>
                      {model!.hasCompare && <div style={{ width: barW, maxWidth: "45%", height: ch, background: "#3D3E42", borderRadius: "3px 3px 0 0" }} />}
                      <div style={{ width: barW, maxWidth: model!.hasCompare ? "45%" : "80%", height: h, background: b.segments ? "transparent" : hovered ? "#FF7B42" : "#FF5C1A", borderRadius: "3px 3px 0 0", overflow: "hidden", display: b.segments ? "flex" : "block", flexDirection: "column", transition: "background 120ms cubic-bezier(0.16,1,0.3,1)" }}>
                        {/* Reversed so the first part (Website) lands at the base of the stack;
                            a channel with a payment split is drawn as its sub-segments. */}
                        {b.segments?.flatMap((seg) => seg.sub ?? [seg]).reverse().map((seg) => (
                          <div key={seg.id} style={{ height: Math.max(1, h * (seg.value / (b.value || 1))), background: hovered ? seg.hoverColor : seg.color, transition: "background 120ms cubic-bezier(0.16,1,0.3,1)" }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap, marginTop: 8 }}>
                {model.bars.map((b, i) => {
                  const show = i % model!.labelStep === 0 || i === count - 1;
                  return (
                    <div key={i} style={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: 10.5, color: hover === i ? "#F1F1F1" : "#9B9B9B", fontFamily: "var(--font-mono)", whiteSpace: "nowrap", overflow: "hidden" }}>
                      {/* Weekday sits above the date so it costs no horizontal
                          room — these labels already thin out on long ranges. */}
                      {show && b.weekday && (
                        <div style={{ fontSize: 9.5, lineHeight: 1.4, color: hover === i ? "#C7C8CC" : "#6E6F75" }}>{b.weekday}</div>
                      )}
                      {show ? b.label : ""}
                    </div>
                  );
                })}
              </div>
              {hover != null && model.bars[hover] && (
                <div style={{ position: "absolute", bottom: H + 12, left: ((hover + 0.5) / count) * 100 + "%", transform: "translateX(-50%)", background: "#0D0D0F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10 }}>
                  <div style={{ fontSize: 10.5, color: "#9B9B9B", fontFamily: "var(--font-mono)", marginBottom: 6 }}>{model.bars[hover].label || "Day " + (hover + 1)}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, fontSize: 12.5, color: "#F1F1F2" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: "#FF5C1A" }} />
                      {model.bars[hover].segments ? `Total ${metric.label.toLowerCase()}` : metric.label}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{fmt(model.bars[hover].value, model.format)}</span>
                  </div>
                  {model.bars[hover].segments?.map((seg) => (
                    <div key={seg.id}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, fontSize: 11.5, color: "#B4B5BA", marginTop: 4 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          {/* A split channel has no colour of its own — its sub-rows carry it. */}
                          <span style={{ width: 7, height: 7, borderRadius: 2, background: seg.sub ? "transparent" : seg.color }} />{seg.label}
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", color: "#F1F1F2" }}>{fmt(seg.value, model!.format)}</span>
                      </div>
                      {seg.sub?.map((sub) => (
                        <div key={sub.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, fontSize: 11, color: "#9B9B9B", marginTop: 3, paddingLeft: 14 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ width: 6, height: 6, borderRadius: 2, background: sub.color }} />{sub.label}
                          </span>
                          <span style={{ fontFamily: "var(--font-mono)", color: "#C9C9C9" }}>{fmt(sub.value, model!.format)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {/* What the revenue is made of, under a rule so it reads as a
                      second cut of the same total rather than more channels. */}
                  {model.bars[hover].components && (
                    <>
                      <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "8px 0 6px" }} />
                      {model.bars[hover].components!.map((c) => (
                        <div key={c.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, fontSize: 11.5, color: "#9A9BA1", marginTop: 3 }}>
                          <span>{c.label}</span>
                          <span style={{ fontFamily: "var(--font-mono)", color: "#C7C8CC" }}>{fmt(c.value, model!.format)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {model.hasCompare && model.bars[hover].compare != null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#9A9BA1", marginTop: model.bars[hover].components ? 8 : 4 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: "#3D3E42" }} />{fmt(model.bars[hover].compare ?? 0, model.format) + " · " + rc.label}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 16, paddingLeft: 68 }}>
            {model.parts ? (
              model.parts.map((part) => (
                <div key={part.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#E8E8E8" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: part.sub ? "transparent" : part.color }} />{part.label}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "#9B9B9B" }}>
                    {fmt(part.total, model!.format)} · {(part.share * 100).toFixed(1)}%
                  </span>
                  {part.sub?.map((sub) => (
                    <span key={sub.id} style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 6, fontSize: 11.5, color: "#9B9B9B" }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: sub.color }} />{sub.label}
                      <span style={{ fontFamily: "var(--font-mono)", color: "#C9C9C9" }}>{fmt(sub.total, model!.format)}</span>
                    </span>
                  ))}
                </div>
              ))
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#E8E8E8" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#FF5C1A" }} />{range.label}
              </div>
            )}
            {model.hasCompare && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#9B9B9B" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "#3D3E42" }} />{rc.label}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
