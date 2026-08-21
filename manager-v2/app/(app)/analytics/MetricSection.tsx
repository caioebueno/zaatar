"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_TIMEZONE, ApiError, getAverageTicket, getNewCustomers, getOrderQuantity, getRevenue } from "../../lib/api";
import type { BarChartAnalytics, BarChartParams } from "../../lib/api";
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
const API_METRICS: Record<string, { fetch: (token: string, params: BarChartParams) => Promise<BarChartAnalytics>; format: MetricFormat; unit: number }> = {
  orders: { fetch: getOrderQuantity, format: "count", unit: 1 },
  revenue: { fetch: getRevenue, format: "currency", unit: 1 / 100 },
  customers: { fetch: getNewCustomers, format: "count", unit: 1 },
  ticket: { fetch: getAverageTicket, format: "currency", unit: 1 / 100 },
};

type Bar = { label: string; value: number; compare: number | null };
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
      model = {
        bars: data.buckets.map((b) => ({ label: b.label, value: b.value * u, compare: hasCompare ? (b.compareValue ?? 0) * u : null })),
        total: data.summary.total * u,
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
      bars: cur.map((v, i) => ({ label: labelFor(i, count, span, end), value: v, compare: hasCompare ? cmp[i] : null })),
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
                      <div style={{ width: barW, maxWidth: model!.hasCompare ? "45%" : "80%", height: h, background: hovered ? "#FF7B42" : "#FF5C1A", borderRadius: "3px 3px 0 0", transition: "background 120ms cubic-bezier(0.16,1,0.3,1)" }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap, marginTop: 8 }}>
                {model.bars.map((b, i) => {
                  const show = i % model!.labelStep === 0 || i === count - 1;
                  return (
                    <div key={i} style={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: 10.5, color: hover === i ? "#F1F1F1" : "#9B9B9B", fontFamily: "var(--font-mono)", whiteSpace: "nowrap", overflow: "hidden" }}>{show ? b.label : ""}</div>
                  );
                })}
              </div>
              {hover != null && model.bars[hover] && (
                <div style={{ position: "absolute", bottom: H + 12, left: ((hover + 0.5) / count) * 100 + "%", transform: "translateX(-50%)", background: "#0D0D0F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 10 }}>
                  <div style={{ fontSize: 10.5, color: "#9B9B9B", fontFamily: "var(--font-mono)", marginBottom: 6 }}>{model.bars[hover].label || "Day " + (hover + 1)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#F1F1F2" }}>
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: "#FF5C1A" }} />{fmt(model.bars[hover].value, model.format)}
                  </div>
                  {model.hasCompare && model.bars[hover].compare != null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, color: "#9A9BA1", marginTop: 4 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 2, background: "#3D3E42" }} />{fmt(model.bars[hover].compare ?? 0, model.format) + " · " + rc.label}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 16, paddingLeft: 68 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#E8E8E8" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "#FF5C1A" }} />{range.label}
            </div>
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
