"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_TIMEZONE, ApiError, getFeedback, getOrderQuantity } from "../../lib/api";
import type { FeedbackAnalytics } from "../../lib/api";
import { clearManagerSession, getManagerBusinessId, getManagerToken } from "../../lib/auth";
import { addDays, dayEndISO, dayStartISO, deltaPill, kpiLabelStyle, linePath, nfmt, resolveCompare, resolveRange, sectionTitleStyle, startOfDay } from "./data";
import type { CompareValue } from "./data";
import { RangePicker } from "./RangePicker";
import type { RangeValue } from "./RangePicker";
import { CompareControl } from "./CompareControl";

const kpiBig = { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 30, color: "#F1F1F1", letterSpacing: "-0.02em", lineHeight: 1 } as const;
const spinner = { width: 18, height: 18, borderRadius: "9999px", boxSizing: "border-box", border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "#FF5C1A", animation: "zspin 0.7s linear infinite" } as const;

const BUCKET_META = [
  { key: "good" as const, label: "Good", scale: "4–5", color: "#22C55E" },
  { key: "medium" as const, label: "Medium", scale: "3", color: "#FFD600" },
  { key: "bad" as const, label: "Bad", scale: "1–2", color: "#EF4444" },
];

export function FeedbackSection({ onOpenReviews }: { onOpenReviews: () => void }) {
  const router = useRouter();
  const [rangeValue, setRangeValue] = useState<RangeValue>({ rangeId: "7d", customStart: null, customEnd: null });
  const [compareVal, setCompareVal] = useState<CompareValue>({ on: true, start: null });

  const [fb, setFb] = useState<FeedbackAnalytics | null>(null);
  const [ordersTotal, setOrdersTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const reqId = useRef(0);

  const range = resolveRange(rangeValue.rangeId, rangeValue.customStart, rangeValue.customEnd, "7d");
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
    const params = { startDate: startISO, endDate: endISO, compareStartDate: compareStartISO || undefined, timezone: APP_TIMEZONE, businessId };
    /* eslint-disable react-hooks/set-state-in-effect */
    setError("");
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    Promise.all([getFeedback(token, params), getOrderQuantity(token, params).catch(() => null)])
      .then(([feedback, orders]) => {
        if (my !== reqId.current) return;
        setFb(feedback);
        setOrdersTotal(orders ? orders.summary.total : null);
      })
      .catch((err) => {
        if (my !== reqId.current) return;
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
          return;
        }
        setError(err instanceof ApiError && err.status === 0 ? "Can't reach the server." : "Couldn't load feedback.");
      })
      .finally(() => {
        if (my === reqId.current) setLoading(false);
      });
  }, [startISO, endISO, compareStartISO, reload, router]);

  const showLoading = loading || (!fb && !error);
  const hasCompare = !!fb?.comparison;

  return (
    <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
        <div style={sectionTitleStyle}>Feedback</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <RangePicker value={rangeValue} defRange="7d" onChange={setRangeValue} />
          <CompareControl value={compareVal} days={range.days} primaryEnd={range.end} onChange={setCompareVal} />
          <button type="button" className="zp-shell-btn" style={{ height: 32 }} onClick={onOpenReviews}>Read all reviews</button>
        </div>
      </div>

      {showLoading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "48px 0", color: "#9B9B9B", fontSize: 12.5 }}>
          <span style={spinner} /> Loading feedback…
        </div>
      )}

      {!showLoading && error && (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <div style={{ fontSize: 12.5, color: "#F87171", marginBottom: 12 }}>{error}</div>
          <button type="button" onClick={() => setReload((x) => x + 1)} style={{ height: 32, padding: "0 14px", background: "#FF5C1A", border: "none", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717", cursor: "pointer" }}>Try again</button>
        </div>
      )}

      {!showLoading && !error && fb && (
        <FeedbackContent fb={fb} ordersTotal={ordersTotal} hasCompare={hasCompare} />
      )}
    </div>
  );
}

function FeedbackContent({ fb, ordersTotal, hasCompare }: { fb: FeedbackAnalytics; ordersTotal: number | null; hasCompare: boolean }) {
  const fbCount = fb.summary.quantityOfFeedback;
  const avg = fb.summary.averageScore;
  const rate = ordersTotal && ordersTotal > 0 ? fbCount / ordersTotal : null;

  const cntPct = fb.comparison?.quantityOfFeedbackDeltaPercentage ?? null;
  const avgDelta = fb.comparison?.averageScoreDelta ?? null;

  const sc = fb.summary.scoreCounts;
  const total = sc.good + sc.medium + sc.bad;
  const csc = fb.comparison?.scoreCounts;
  const cTotal = csc ? csc.good + csc.medium + csc.bad : 0;

  const points = fb.averageScorePoints;
  const tp = linePath(points.map((p) => p.value), 240, 56);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,1fr) minmax(320px,1.15fr)", gap: 32, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 32 }}>
          <div>
            <div style={{ ...kpiLabelStyle, marginBottom: 8 }}>Feedback given</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={kpiBig}>{nfmt(fbCount)}</div>
              {hasCompare && cntPct != null && <span style={deltaPill(cntPct >= 0)}>{(cntPct >= 0 ? "+" : "") + cntPct.toFixed(1) + "%"}</span>}
            </div>
            <div style={{ fontSize: 11.5, color: "#9B9B9B", marginTop: 7 }}>{rate != null ? (rate * 100).toFixed(0) + "% of orders" : nfmt(fbCount) + " responses"}</div>
          </div>
          <div>
            <div style={{ ...kpiLabelStyle, marginBottom: 8 }}>Average score</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <div style={kpiBig}>{avg != null ? avg.toFixed(2) : "—"}</div>
              {hasCompare && avgDelta != null && <span style={deltaPill(avgDelta >= 0)}>{(avgDelta >= 0 ? "+" : "") + avgDelta.toFixed(2)}</span>}
            </div>
            <div style={{ fontSize: 11.5, color: "#9B9B9B", marginTop: 7 }}>{fb.comparison?.averageScore != null ? fb.comparison.averageScore.toFixed(2) + " in comparison" : "out of 5.00"}</div>
          </div>
        </div>

        <div>
          <div style={{ ...kpiLabelStyle, marginBottom: 10 }}>Score trend</div>
          {tp.line ? (
            <svg width="100%" height="56" viewBox="0 0 240 56" preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
              <path d={tp.area} fill="rgba(255,92,26,0.12)" />
              <path d={tp.line} fill="none" stroke="#FF5C1A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
          ) : (
            <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, color: "#75767C" }}>No feedback in this range.</div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 10.5, color: "#9B9B9B", fontFamily: "var(--font-mono)" }}>
            <span>{points[0]?.label ?? ""}</span><span>{points[points.length - 1]?.label ?? ""}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {BUCKET_META.map((m) => {
          const count = sc[m.key];
          const share = total ? count / total : 0;
          const cShare = csc && cTotal ? csc[m.key] / cTotal : 0;
          const dShare = csc ? (share - cShare) * 100 : 0;
          const up = m.key === "bad" ? dShare <= 0 : dShare >= 0;
          return (
            <div key={m.key}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 7 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: m.color, display: "inline-block" }} />
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: "#F1F1F1" }}>{m.label}</span>
                  <span style={{ fontSize: 10.5, color: "#9B9B9B", fontFamily: "var(--font-mono)" }}>{m.scale}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: "#E8E8E8", fontFamily: "var(--font-mono)" }}>{nfmt(count)}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#F1F1F1", minWidth: 44, textAlign: "right" }}>{(share * 100).toFixed(1)}%</span>
                  {hasCompare && <span style={{ fontSize: 11, fontWeight: 600, minWidth: 52, textAlign: "right", color: up ? "#22C55E" : "#EF4444" }}>{(dShare >= 0 ? "+" : "") + dShare.toFixed(1) + "pp"}</span>}
                </div>
              </div>
              <div style={{ height: 8, borderRadius: 9999, background: "#191919", overflow: "hidden" }}>
                <div style={{ width: (share * 100).toFixed(1) + "%", height: "100%", background: m.color, borderRadius: 9999 }} />
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>
          {nfmt(fbCount)} customers rated{ordersTotal != null ? ", out of " + nfmt(ordersTotal) + " orders" : ""}
        </div>
      </div>
    </div>
  );
}
