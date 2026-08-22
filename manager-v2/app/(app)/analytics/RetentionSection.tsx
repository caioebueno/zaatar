"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_TIMEZONE, ApiError, getCustomerRetention } from "../../lib/api";
import type { CustomerRetentionAnalytics } from "../../lib/api";
import { clearManagerSession, getManagerBusinessId, getManagerToken } from "../../lib/auth";
import { addDays, dayEndISO, dayStartISO, deltaPill, fmtPct, kpiLabelStyle, nfmt, pctDelta, resolveCompare, resolveRange, sectionTitleStyle, startOfDay } from "./data";
import type { CompareValue } from "./data";
import { RangePicker } from "./RangePicker";
import type { RangeValue } from "./RangePicker";
import { CompareControl } from "./CompareControl";

const kpiBig = { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 30, color: "#F1F1F1", letterSpacing: "-0.02em", lineHeight: 1 } as const;
const spinner = { width: 18, height: 18, borderRadius: "9999px", boxSizing: "border-box", border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "#FF5C1A", animation: "zspin 0.7s linear infinite" } as const;
const MH = 132;

export function RetentionSection() {
  const router = useRouter();
  const [rangeValue, setRangeValue] = useState<RangeValue>({ rangeId: "30d", customStart: null, customEnd: null });
  const [compareVal, setCompareVal] = useState<CompareValue>({ on: true, start: null });
  const [mixMode, setMixMode] = useState<"share" | "count">("share");

  const [data, setData] = useState<CustomerRetentionAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const reqId = useRef(0);

  const range = resolveRange(rangeValue.rangeId, rangeValue.customStart, rangeValue.customEnd, "30d");
  const rc = resolveCompare(compareVal, range.days, range.end);
  const end = startOfDay(range.end);
  const start = addDays(end, -(range.days - 1));
  const startISO = dayStartISO(start);
  const endISO = dayEndISO(end);
  const compareStartISO = rc.on ? dayStartISO(rc.start) : "";

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
    getCustomerRetention(token, { startDate: startISO, endDate: endISO, compareStartDate: compareStartISO || undefined, timezone: APP_TIMEZONE, businessId })
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
        setError(err instanceof ApiError && err.status === 0 ? "Can't reach the server." : "Couldn't load retention.");
      })
      .finally(() => {
        if (my === reqId.current) setLoading(false);
      });
  }, [startISO, endISO, compareStartISO, reload, router]);

  const showLoading = loading || (!data && !error);

  return (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
        <div style={sectionTitleStyle}>Customer retention</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RangePicker value={rangeValue} defRange="30d" onChange={setRangeValue} />
          <CompareControl value={compareVal} days={range.days} primaryEnd={range.end} onChange={setCompareVal} />
        </div>
      </div>

      {showLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "48px 0", color: "#9B9B9B", fontSize: 12.5 }}>
          <span style={spinner} /> Loading retention…
        </div>
      )}

      {!showLoading && error && (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <div style={{ fontSize: 12.5, color: "#F87171", marginBottom: 12 }}>{error}</div>
          <button type="button" onClick={() => setReload((x) => x + 1)} style={{ height: 32, padding: "0 14px", background: "#FF5C1A", border: "none", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717", cursor: "pointer" }}>Try again</button>
        </div>
      )}

      {!showLoading && !error && data && <RetentionContent data={data} mixMode={mixMode} setMixMode={setMixMode} />}
    </div>
  );
}

function RetentionContent({ data, mixMode, setMixMode }: { data: CustomerRetentionAnalytics; mixMode: "share" | "count"; setMixMode: (m: "share" | "count") => void }) {
  const hasCompare = !!data.comparison;
  const active = data.summary.activeCustomerCount;
  const compareActive = data.comparison?.activeCustomerCount ?? null;
  const activeDelta = compareActive != null ? pctDelta(active, compareActive) : null;

  const stats = [
    { label: "Active customers", color: "#FF5C1A", value: active, delta: activeDelta, goodUp: true, note: "placed at least 1 order" },
    { label: "Won customers", color: "#22C55E", value: data.summary.wonCustomers, delta: null as number | null, goodUp: true, note: "first order in this period" },
    { label: "Lost customers", color: "#EF4444", value: data.summary.lostCustomers, delta: null as number | null, goodUp: false, note: "no order since the comparison period" },
  ];

  // ── Order-frequency cohorts ──
  const cohorts = data.orderQuantityBuckets;
  const cohortTotal = cohorts.reduce((a, b) => a + b.customerCount, 0) || 1;
  const cohortMax = Math.max(...cohorts.map((b) => Math.max(b.customerCount, b.compareCustomerCount ?? 0)), 1);

  // ── New vs returning ──
  const days = data.newVsReturningPerDay;
  const sum = (f: (d: (typeof days)[number]) => number) => days.reduce((a, d) => a + f(d), 0);
  const newTotal = sum((d) => d.newCustomerCount);
  const retTotal = sum((d) => d.returningCustomerCount);
  const mixTotal = newTotal + retTotal;
  const cNewTotal = sum((d) => d.compareNewCustomerCount ?? 0);
  const cRetTotal = sum((d) => d.compareReturningCustomerCount ?? 0);
  const cMixTotal = cNewTotal + cRetTotal;

  // Too many daily bars won't fit — group consecutive days so we show at most 30 bars.
  const MAX_BARS = 30;
  const groupSize = days.length > MAX_BARS ? Math.ceil(days.length / MAX_BARS) : 1;
  const mixBars: { label: string; newCount: number; total: number }[] = [];
  for (let i = 0; i < days.length; i += groupSize) {
    const chunk = days.slice(i, i + groupSize);
    mixBars.push({
      label: chunk[0].label,
      newCount: chunk.reduce((a, d) => a + d.newCustomerCount, 0),
      total: chunk.reduce((a, d) => a + d.totalCustomerCount, 0),
    });
  }
  const maxTot = Math.max(...mixBars.map((b) => b.total), 1);
  const barLabelStep = Math.max(1, Math.ceil(mixBars.length / 14));

  const legend = [
    { key: "new", label: "New customers", color: "#FFD600", v: newTotal, cv: cNewTotal },
    { key: "returning", label: "Returning customers", color: "#FF5C1A", v: retTotal, cv: cRetTotal },
  ].map((d) => {
    const pct = mixTotal ? (d.v / mixTotal) * 100 : 0;
    const cpct = cMixTotal ? (d.cv / cMixTotal) * 100 : 0;
    return { ...d, pct, delta: pct - cpct };
  });

  return (
    <>
      <div style={{ display: "flex", gap: 40, flexWrap: "wrap", marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: "inline-block" }} />
              <span style={kpiLabelStyle}>{s.label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={kpiBig}>{s.value != null ? nfmt(s.value) : "—"}</div>
              {hasCompare && s.delta != null && <span style={deltaPill(s.goodUp ? s.delta >= 0 : s.delta <= 0)}>{fmtPct(s.delta)}</span>}
            </div>
            <div style={{ fontSize: 11.5, color: "#9B9B9B", marginTop: 7 }}>{s.note}</div>
          </div>
        ))}
      </div>

      <div style={{ ...kpiLabelStyle, marginBottom: 14 }}>Customers by orders placed</div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        {cohorts.map((c) => {
          const dp = c.deltaPercentage ?? null;
          const up = c.key === "0" ? (dp ?? 0) <= 0 : (dp ?? 0) >= 0;
          return (
            <div key={c.key} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#F1F1F1" }}>{nfmt(c.customerCount)}</span>
                {hasCompare && dp != null && <span style={{ fontSize: 11, fontWeight: 600, color: up ? "#22C55E" : "#EF4444", whiteSpace: "nowrap" }}>{fmtPct(dp)}</span>}
              </div>
              <div style={{ width: "100%", height: 120, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4 }}>
                {hasCompare && c.compareCustomerCount != null && <div style={{ width: 22, maxWidth: "46%", height: Math.max(3, (c.compareCustomerCount / cohortMax) * 120), background: "#3D3E42", borderRadius: "3px 3px 0 0" }} />}
                <div style={{ width: hasCompare ? 22 : 40, maxWidth: "46%", height: Math.max(3, (c.customerCount / cohortMax) * 120), background: c.key === "0" ? "#5A5B60" : "#FF5C1A", borderRadius: "3px 3px 0 0" }} />
              </div>
              <div style={{ fontSize: 12.5, color: "#E8E8E8", whiteSpace: "nowrap" }}>{c.label}</div>
              <div style={{ fontSize: 10.5, color: "#9B9B9B", fontFamily: "var(--font-mono)" }}>{((c.customerCount / cohortTotal) * 100).toFixed(1)}%</div>
            </div>
          );
        })}
      </div>

      {/* New vs returning customers */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
          <div style={kpiLabelStyle}>New vs returning customers</div>
          <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 9999, background: "#191919" }}>
            {(["share", "count"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMixMode(m)} style={{ height: 26, padding: "0 12px", borderRadius: 9999, cursor: "pointer", border: "none", background: mixMode === m ? "rgba(255,92,26,0.16)" : "transparent", color: mixMode === m ? "#FF5C1A" : "#9B9B9B", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: mixMode === m ? 600 : 400 }}>
                {m === "share" ? "Share" : "Count"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", marginBottom: 14 }}>
          {legend.map((l) => (
            <div key={l.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: "inline-block" }} />
                <span style={{ fontSize: 12.5, color: "#B4B5BA", whiteSpace: "nowrap" }}>{l.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "#F1F1F1", letterSpacing: "-0.02em", lineHeight: 1 }}>{l.pct.toFixed(1)}%</span>
                <span style={{ fontSize: 11.5, color: "#9B9B9B", fontFamily: "var(--font-mono)" }}>{nfmt(l.v)} customers</span>
                {hasCompare && <span style={deltaPill(l.delta >= 0)}>{(l.delta >= 0 ? "+" : "") + l.delta.toFixed(1) + " pp"}</span>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 2, borderRadius: 9999, overflow: "hidden", background: "#191919", marginBottom: 22 }}>
          {legend.map((l) => (
            <div key={l.key} style={{ width: l.pct + "%", height: 10, background: l.color, transition: "width 220ms cubic-bezier(0.16,1,0.3,1)" }} />
          ))}
        </div>

        {mixBars.length > 0 ? (
          <div style={{ display: "flex", gap: mixBars.length > 20 ? 4 : 10, alignItems: "flex-end", paddingTop: 18 }}>
            {mixBars.map((b, i) => {
              const share = b.total ? b.newCount / b.total : 0;
              const colH = mixMode === "share" ? MH : Math.max(6, (b.total / maxTot) * MH);
              const newH = Math.max(2, colH * share);
              const retH = Math.max(2, colH * (1 - share));
              const show = i % barLabelStep === 0 || i === mixBars.length - 1;
              const pad = mixBars.length > 20 ? "0 4%" : "0 12%";
              return (
                <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ position: "relative", width: "100%", height: MH }}>
                    {show && (
                      <div style={{ position: "absolute", left: 0, right: 0, bottom: newH + retH + 4, textAlign: "center", fontSize: 11.5, color: "#E8E8E8", fontFamily: "var(--font-mono)", lineHeight: 1, whiteSpace: "nowrap" }}>
                        {mixMode === "share" ? Math.round(share * 100) + "%" : nfmt(b.total)}
                      </div>
                    )}
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", padding: pad, boxSizing: "border-box" }}>
                      <div style={{ height: newH, background: "#FFD600", borderRadius: "3px 3px 0 0", transition: "height 220ms cubic-bezier(0.16,1,0.3,1)" }} />
                      <div style={{ height: retH, background: "#FF5C1A", borderRadius: mixMode === "share" ? "0 0 3px 3px" : "0", transition: "height 220ms cubic-bezier(0.16,1,0.3,1)" }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#9B9B9B", whiteSpace: "nowrap", overflow: "hidden" }}>{show ? b.label : ""}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "24px 0", fontSize: 11.5, color: "#75767C" }}>No customer activity in this range.</div>
        )}
        <div style={{ fontSize: 11, color: "#757575", marginTop: 10 }}>{mixMode === "share" ? "Share of active customers per day" : "Active customers per day"}</div>
      </div>
    </>
  );
}
