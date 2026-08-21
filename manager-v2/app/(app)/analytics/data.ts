/**
 * Analytics screen data + computations, ported from the Zappy `Home.dc.html`
 * design. Fully deterministic (seeded `rnd`, fixed `TODAY`) → SSR-safe.
 */
import type { CSSProperties } from "react";

export type MetricFormat = "count" | "currency" | "min";
export type Metric = { id: string; label: string; base: number; format: MetricFormat; agg: "sum" | "avg"; goodUp: boolean };

export const METRICS: Metric[] = [
  { id: "orders", label: "Orders", base: 128, format: "count", agg: "sum", goodUp: true },
  { id: "revenue", label: "Revenue", base: 3240, format: "currency", agg: "sum", goodUp: true },
  { id: "customers", label: "New customers", base: 19, format: "count", agg: "sum", goodUp: true },
  // TODO: no analytics endpoint yet — re-enable once GET /v1/analytics/avg-delivery-time exists.
  // { id: "delivery", label: "Avg delivery time", base: 27, format: "min", agg: "avg", goodUp: false },
  { id: "ticket", label: "Avg ticket", base: 26.4, format: "currency", agg: "avg", goodUp: true },
];

// `endOffset` = days before today the range ends (0 = ends today). `label` is the full display label.
export const RANGES = [
  { id: "today", label: "Today", days: 1, endOffset: 0 },
  { id: "yesterday", label: "Yesterday", days: 1, endOffset: 1 },
  { id: "7d", label: "Last 7 days", days: 7, endOffset: 0 },
  { id: "14d", label: "Last 2 weeks", days: 14, endOffset: 0 },
  { id: "30d", label: "Last 1 month", days: 30, endOffset: 0 },
  { id: "90d", label: "Last 3 months", days: 90, endOffset: 0 },
];

export type Compare = { id: string; label: string; suffix: string };
export const COMPARES: Compare[] = [
  { id: "prev", label: "Previous period", suffix: "previous period" },
  { id: "year", label: "Same period last year", suffix: "last year" },
  { id: "none", label: "No comparison", suffix: "" },
];

export const COHORT_DEFS = [
  { id: "0", label: "0 orders", share: 0.21 },
  { id: "1", label: "1 order", share: 0.26 },
  { id: "2-4", label: "2–4 orders", share: 0.29 },
  { id: "5-8", label: "5–8 orders", share: 0.15 },
  { id: "8+", label: "8+ orders", share: 0.09 },
];

export const QUESTIONS = ["Product quality", "Temperature (warm/fresh)", "Delivery speed", "Service experience"];

const NAMES = [
  "Marina Alves", "Tom Whitfield", "Priya Raghavan", "Diego Moreno", "Sofia Lindqvist", "Andre Costa", "Hannah Beck",
  "Yusuf Demir", "Clara Bianchi", "Ethan Park", "Noor Haddad", "Lucas Feld", "Ana Ribeiro", "Grace Okonkwo", "Mateo Silva",
  "Ingrid Wolff", "Kenji Watanabe", "Rosa Delgado", "Felix Norberg", "Amara Nwosu", "Julian Reyes", "Chiara Fontana",
  "Omar Farouk", "Lena Vogt", "Theo Marchand", "Isabel Cardoso", "Nikhil Menon", "Ruth Kimani",
];

const POSITIVE = [
  "Food arrived hot and the driver was quick. No complaints.",
  "Driver called ahead and waited at the lobby. Very smooth.",
  "Best pad thai in the area, third time ordering this month.",
  "Quick and correct. Would order again.",
  "Everything was sealed properly and still steaming. Nice touch with the extra napkins.",
  "Ten minutes ahead of the estimate. Impressive on a Friday night.",
  "The kitchen got my substitution right without me having to call.",
  "Driver was polite and the handoff took seconds.",
  "Ordered for eight people and every item was labeled correctly.",
  "The soup did not spill once, which never happens.",
  "Reliable as always. Same quality every single time.",
  "Called to confirm a gate code instead of just cancelling. Appreciated.",
  "Portions were generous and the bread was still crisp.",
  "Tracking was accurate to the minute.",
  "They remembered the no-onion note from my last order.",
  "Arrived early and the packaging kept everything separate.",
  "Simple, fast, and exactly what I ordered.",
  "Late night order and it still showed up in twenty minutes.",
];

const NEGATIVE = [
  "Great flavor, but the fries were cold by the time it got here.",
  "Order was missing a drink. Everything else was fine.",
  "Took almost an hour past the estimate. Food quality was still good.",
  "Packaging leaked all over the bag. Disappointing.",
  "Rice was dry and the portion looked smaller than usual.",
  "Driver left it at the wrong door and did not answer the call.",
  "Second time this month the sauce was forgotten.",
  "Arrived lukewarm. Had to reheat everything before eating.",
  "Wrong protein in two of the three bowls.",
  "No cutlery included even though I selected it at checkout.",
  "The app said delivered fifteen minutes before it actually arrived.",
  "Salad was wilted and clearly sat out for a while.",
  "Driver seemed rushed and did not hand over the receipt.",
  "Charged for an extra side I never added.",
  "Bag was crushed on one side and the lid had come off.",
  "Estimate kept moving. Ended up waiting well past dinner.",
  "Chicken was undercooked in the middle. Had to throw it out.",
  "Third order in a row arriving cold. Something is off with packaging.",
];

const _now = new Date();
export const TODAY = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate());
export const DAY_MS = 86400000;

// ── Date helpers ────────────────────────────────────────────
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function sameDay(a: Date | null, b: Date | null): boolean {
  return !!a && !!b && a.getTime() === b.getTime();
}
export function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Comparison period (toggle + custom start, duration fixed to the range) ──
export type CompareValue = { on: boolean; start: Date | null };
export type ResolvedCompare = { on: boolean; start: Date; end: Date; days: number; label: string; seed: number; factor: number };

export function resolveCompare(value: CompareValue, days: number, primaryEnd: Date): ResolvedCompare {
  const pEnd = startOfDay(primaryEnd);
  const pStart = addDays(pEnd, -(days - 1));
  const start = startOfDay(value.start ?? addDays(pStart, -days));
  const end = addDays(start, days - 1);
  return {
    on: value.on,
    start,
    end,
    days,
    label: fmtShort(start) + " – " + fmtShort(end),
    seed: 3.1 + (start.getDate() % 9) * 0.6,
    factor: 0.86 + (start.getDate() % 5) * 0.035,
  };
}

export type ResolvedRange = { id: string; label: string; days: number; end: Date };
export function resolveRange(rangeId: string | null, customStart: Date | null, customEnd: Date | null, defRange: string): ResolvedRange {
  const rid = rangeId ?? defRange;
  if (rid === "custom" && customStart && customEnd) {
    const days = Math.round((customEnd.getTime() - customStart.getTime()) / DAY_MS) + 1;
    return { id: "custom", label: fmtDate(customStart) + " – " + fmtDate(customEnd), days, end: customEnd };
  }
  const r = RANGES.find((x) => x.id === rid) ?? RANGES.find((x) => x.id === defRange) ?? RANGES[2];
  return { id: r.id, label: r.label, days: r.days, end: addDays(TODAY, -r.endOffset) };
}

// ── Computations ────────────────────────────────────────────
export function rnd(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function buckets(days: number): { count: number; span: number } {
  if (days <= 31) return { count: Math.max(2, days), span: 1 };
  return { count: Math.min(16, Math.ceil(days / 7)), span: 7 };
}

export function series(metric: Metric, days: number, salt: number): number[] {
  const { count, span } = buckets(days);
  const mi = METRICS.findIndex((m) => m.id === metric.id);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const wobble = 0.78 + 0.44 * rnd(i + 1, salt + mi * 3.1);
    const drift = 1 + (i / count) * 0.12;
    out.push(metric.agg === "sum" ? metric.base * span * wobble * drift : metric.base * (0.9 + 0.2 * wobble));
  }
  return out;
}

export function fmt(v: number, format: MetricFormat): string {
  if (format === "currency") {
    return v >= 1000
      ? "$" + Math.round(v).toLocaleString("en-US")
      : "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (format === "min") return v.toFixed(1) + " min";
  return Math.round(v).toLocaleString("en-US");
}

export function labelFor(i: number, count: number, span: number, end: Date): string {
  const d = new Date(end);
  d.setDate(d.getDate() - (count - 1 - i) * span);
  if (span === 7) return i % 2 === 0 || i === count - 1 ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  if (count <= 14) return d.toLocaleDateString("en-US", { weekday: "short" });
  return i % 5 === 0 || i === count - 1 ? String(d.getDate()) : "";
}

export function feedback(orders: number, salt: number): { responses: number; rate: number; avg: number; shares: number[] } {
  const rate = 0.29 + 0.08 * rnd(1, salt);
  const responses = Math.round(orders * rate);
  const good = 0.6 + 0.15 * rnd(2, salt);
  const bad = 0.05 + 0.08 * rnd(3, salt);
  const mid = Math.max(0.04, 1 - good - bad);
  const avg = good * 4.72 + mid * 3.02 + bad * 1.55;
  return { responses, rate, avg, shares: [good, mid, bad] };
}

export type MixBucket = { label: string; total: number; new: number };
export type MixData = { buckets: MixBucket[]; new: number; returning: number; total: number };
export function mixData(range: { end: Date; days: number }, salt: number): MixData {
  const days = range.days;
  const bCount = days <= 7 ? days : days <= 31 ? 7 : 8;
  const step = days / bCount;
  const end = startOfDay(range.end);
  const buckets: MixBucket[] = [];
  let tNew = 0;
  let tRet = 0;
  for (let i = 0; i < bCount; i++) {
    const d = addDays(end, -(days - 1) + Math.round(i * step));
    const total = Math.round((28 + step * 34) * (0.72 + 0.56 * rnd(20 + i, salt)));
    const share = 0.17 + 0.26 * rnd(41 + i, salt);
    const nw = Math.round(total * share);
    tNew += nw;
    tRet += total - nw;
    buckets.push({ label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), total, new: nw });
  }
  return { buckets, new: tNew, returning: tRet, total: tNew + tRet };
}

export function customerData(days: number, salt: number): { total: number; counts: number[]; active: number; won: number; lost: number } {
  const total = Math.round((900 + days * 26) * (0.94 + 0.12 * rnd(1, salt)));
  const raw = COHORT_DEFS.map((c, i) => c.share * (0.82 + 0.36 * rnd(i + 2, salt)));
  const norm = raw.reduce((a, b) => a + b, 0);
  const counts = raw.map((v) => Math.round((v / norm) * total));
  const active = counts.slice(1).reduce((a, b) => a + b, 0);
  const won = Math.round(active * (0.11 + 0.07 * rnd(9, salt)));
  const lost = Math.round(active * (0.08 + 0.07 * rnd(12, salt)));
  return { total, counts, active, won, lost };
}

export type Review = { id: number; name: string; overall: number; scores: number[]; comment: string; date: Date; bucket: "good" | "medium" | "bad" };
export function reviewList(): Review[] {
  let posN = 0;
  let negN = 0;
  return NAMES.map((name, i) => {
    const overall = Math.max(1, Math.min(5, Math.round(1 + 4 * Math.pow(rnd(i + 1, 3.7), 0.55))));
    const scores = QUESTIONS.map((_, q) => Math.max(1, Math.min(5, overall + (rnd(i + 1, 5.3 + q) > 0.72 ? (rnd(i + 2, 7.1 + q) > 0.5 ? 1 : -1) : 0))));
    const hasComment = rnd(i + 1, 11.4) > 0.42;
    const d = addDays(TODAY, -Math.floor(rnd(i + 1, 2.2) * 90));
    return {
      id: 2847 - i * 7,
      name,
      overall,
      scores,
      comment: !hasComment ? "" : overall >= 4 ? POSITIVE[posN++ % POSITIVE.length] : NEGATIVE[negN++ % NEGATIVE.length],
      date: d,
      bucket: overall >= 4 ? "good" : overall === 3 ? "medium" : "bad",
    };
  });
}

export function dayStartISO(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).toISOString();
}
export function dayEndISO(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).toISOString();
}

/** Line + area path from a series that may contain null gaps (days without data). */
export function linePath(values: (number | null)[], w: number, h: number): { line: string; area: string } {
  const present = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v != null);
  if (present.length === 0) return { line: "", area: "" };
  const nums = present.map((p) => p.v);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const denom = Math.max(1, values.length - 1);
  const pts = present.map((p) => [(p.i / denom) * w, h - 4 - ((p.v - min) / span) * (h - 8)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const first = pts[0][0].toFixed(1);
  const last = pts[pts.length - 1][0].toFixed(1);
  return { line, area: line + " L" + last + " " + h + " L" + first + " " + h + " Z" };
}

export function trendPath(values: number[], w: number, h: number): { line: string; area: string } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * w, h - 4 - ((v - min) / span) * (h - 8)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  return { line, area: line + " L" + w + " " + h + " L0 " + h + " Z" };
}

export function bucketColor(b: "good" | "medium" | "bad"): string {
  return b === "good" ? "#22C55E" : b === "medium" ? "#FFD600" : "#EF4444";
}

// ── Shared style helpers ────────────────────────────────────
export function deltaPill(up: boolean): CSSProperties {
  return {
    fontSize: 12.5,
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: 9999,
    whiteSpace: "nowrap",
    background: up ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
    color: up ? "#22C55E" : "#EF4444",
  };
}
export function pctDelta(a: number, b: number): number {
  return b ? ((a - b) / b) * 100 : 0;
}
export function fmtPct(v: number): string {
  return (v >= 0 ? "+" : "") + v.toFixed(1) + "%";
}
export function nfmt(v: number): string {
  return Math.round(v).toLocaleString("en-US");
}


export const sectionTitleStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 600,
  fontSize: 16,
  color: "#F1F1F1",
  letterSpacing: "-0.2px",
};

export const kpiLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "#9B9B9B",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  whiteSpace: "nowrap",
};

export const kpiValueStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 30,
  color: "#F1F1F1",
  letterSpacing: "-0.02em",
  lineHeight: 1,
};
