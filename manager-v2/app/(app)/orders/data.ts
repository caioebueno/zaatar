/**
 * Formatting + date-range helpers for the Orders screen.
 * The table is backed by the real `GET /v1/order` API (see app/lib/api.ts).
 */

import type { OrderListItem, OrderListPayment } from "../../lib/api";

const now = new Date();
export const TODAY = new Date(now.getFullYear(), now.getMonth(), now.getDate());
export const DAY_MS = 86400000;

export const RANGES = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "14d", label: "2 weeks", days: 14 },
  { id: "30d", label: "1 month", days: 30 },
  { id: "90d", label: "3 months", days: 90 },
];

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

/** YYYY-MM-DD in local time, for the API's `from`/`to` params. */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
}

export function moneyFromCents(cents: number): string {
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export type ResolvedRange = { id: string; label: string; days: number; end: Date };

/** Resolves the applied range selection into { days, end } for filtering. */
export function resolveRange(
  rangeId: string | null,
  customStart: Date | null,
  customEnd: Date | null,
): ResolvedRange {
  const rid = rangeId ?? "30d";
  if (rid === "custom" && customStart && customEnd) {
    const days = Math.round((customEnd.getTime() - customStart.getTime()) / DAY_MS) + 1;
    return { id: "custom", label: fmtDate(customStart) + " – " + fmtDate(customEnd), days, end: customEnd };
  }
  const r = RANGES.find((x) => x.id === rid) ?? RANGES[2];
  return { id: r.id, label: r.label, days: r.days, end: TODAY };
}

// ── Order-status / type / payment presentation ──────────────
const STATUS_META: Record<string, { label: string; color: string }> = {
  NEW: { label: "New", color: "#3B82F6" },
  ACCEPTED: { label: "Accepted", color: "#3B82F6" },
  PREPARING: { label: "Preparing", color: "#F59E0B" },
  READY: { label: "Ready", color: "#22C55E" },
  DELIVERING: { label: "Delivering", color: "#FF5C1A" },
  DELIVERED: { label: "Delivered", color: "#8A8B90" },
  CANCELED: { label: "Cancelled", color: "#EF4444" },
  CANCELLED: { label: "Cancelled", color: "#EF4444" },
};

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function statusMeta(status: string, canceled: boolean): { label: string; color: string } {
  if (canceled) return { label: "Cancelled", color: "#EF4444" };
  return STATUS_META[status] ?? { label: status ? titleCase(status) : "Unknown", color: "#8A8B90" };
}

export const TYPE_COLORS: Record<string, string> = { Delivery: "#3B82F6", Takeaway: "#8A8B90" };
export const PAYMENT_COLORS: Record<string, string> = {
  Paid: "#22C55E",
  "Partially paid": "#F59E0B",
  Unpaid: "#EF4444",
};

export function typeLabel(orderType: OrderListItem["orderType"]): string {
  return orderType === "DELIVERY" ? "Delivery" : "Takeaway";
}

export type PaymentStatus = "Paid" | "Partially paid" | "Unpaid";

export function paymentStatus(payments: OrderListPayment[], totalCents: number): PaymentStatus {
  const paid = payments.reduce((a, p) => a + p.amount, 0);
  if (totalCents > 0 && paid >= totalCents) return "Paid";
  if (paid > 0) return "Partially paid";
  return "Unpaid";
}

export function paymentTypeLabel(t: string): string {
  return t === "CARD" ? "Card" : t === "CASH" ? "Cash" : t === "ZELLE" ? "Zelle" : titleCase(t);
}

export function orderLabel(o: OrderListItem): string {
  return "#" + (o.number ?? o.id.slice(0, 6));
}
