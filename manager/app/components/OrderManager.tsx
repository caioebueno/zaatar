"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ManagerOrderListItem = {
  canceled: boolean;
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
  id: string;
  number: string | null;
  orderType: string;
  paymentMethod: string;
  status: string;
  totalCents: number;
};

type OrderDetail = {
  canceled: boolean;
  createdAt: string;
  customer: { name: string | null; phone: string | null };
  deliveryFeeCents: number;
  discountedSubtotalCents: number;
  id: string;
  items: Array<{
    lineTotalCents: number;
    productId: string;
    productName: string;
    quantity: number;
    unitAmountCents: number;
  }>;
  number: string | null;
  orderType: string;
  paymentMethod: string;
  status: string;
  subtotalCents: number;
  tipAmountCents: number;
  tipPercent: number;
  totalCents: number;
};

// ─── Design tokens (dark theme) ──────────────────────────────────────────────

const D = {
  bg:    "#0a0807",
  surf:  "#181310",
  surf2: "#1e1915",
  line:  "rgba(250,245,238,0.07)",
  lineA: "rgba(250,245,238,0.12)",
  text:  "#faf5ee",
  dim:   "#c4b09c",
  faint: "#7a6458",
  vfaint:"rgba(250,245,238,0.22)",
  mute:  "rgba(250,245,238,0.04)",
  zippy: "#ff3d14",
  green: "#00a866",
  amber: "#d97706",
  blue:  "#3b82f6",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function statusInfo(status: string, canceled: boolean) {
  if (canceled) return { label: "Cancelled", color: D.faint, bg: D.mute, pulsed: false };
  const map: Record<string, { label: string; color: string; bg: string; pulsed: boolean }> = {
    ACCEPTED:   { label: "Accepted",   color: D.amber, bg: "rgba(180,83,9,0.10)",   pulsed: true  },
    PREPARING:  { label: "Preparing",  color: D.amber, bg: "rgba(180,83,9,0.10)",   pulsed: true  },
    DELIVERING: { label: "In Transit", color: "#ff3d14", bg: "rgba(255,61,20,0.10)", pulsed: true  },
    DELIVERED:  { label: "Delivered",  color: D.green, bg: "rgba(0,168,102,0.10)",  pulsed: false },
  };
  return map[status] ?? { label: status, color: D.faint, bg: D.mute, pulsed: false };
}

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
    .format((cents || 0) / 100);
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function minsAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function Ico({ d: path, size = 14, children }: { d?: string; size?: number; children?: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>
      {path ? <path d={path} /> : children}
    </svg>
  );
}

const ISearch  = () => <Ico size={13}><circle cx="10.5" cy="10.5" r="6.5"/><path d="M16 16l4 4"/></Ico>;
const IReceipt = () => <Ico size={14} d="M6 3v18l2-1.5L10 21l2-1.5L14 21l2-1.5L18 21V3z M9 8h6M9 12h6M9 16h4" />;
const IChevD   = () => <Ico size={11} d="M6 9l6 6 6-6" />;
const IClose   = () => <Ico size={11} d="M18 6L6 18M6 6l12 12" />;
const IUser    = () => <Ico size={13}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></Ico>;
const IPhone   = () => <Ico size={12}><path d="M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4c0 1-1 2-2 2A17 17 0 013 6a2 2 0 012-2z"/></Ico>;
const ITruck   = () => <Ico size={13}><rect x="1" y="3" width="13" height="13" rx="1.5"/><path d="M14 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></Ico>;
const IBag     = () => <Ico size={13}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/></Ico>;
const ICard    = () => <Ico size={13}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></Ico>;

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, canceled }: { status: string; canceled: boolean }) {
  const s = statusInfo(status, canceled);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color, borderRadius: 5, padding: "3px 8px",
      fontFamily: "inherit", fontSize: 10, fontWeight: 600,
      letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0,
    }}>
      {s.pulsed && (
        <span style={{
          width: 5, height: 5, borderRadius: 1.5, background: "currentColor",
          flexShrink: 0, animation: "om-pulse 2s ease-in-out infinite",
        }} />
      )}
      {s.label}
    </span>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────

function SecHdr({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 7,
      fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em",
      textTransform: "uppercase", color: D.faint, marginBottom: 12,
    }}>
      <span style={{ lineHeight: 0, opacity: 0.6 }}>{icon}</span>
      {label}
    </div>
  );
}

// ─── Filter config ─────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { id: "today",  label: "Today",   maxMins: 1440   },
  { id: "7days",  label: "7 days",  maxMins: 10080  },
  { id: "30days", label: "30 days", maxMins: 43200  },
  { id: "all",    label: "All",     maxMins: null   },
] as const;

type RangeId     = "today" | "7days" | "30days" | "all";
type TypeFilter  = "all" | "delivery" | "pickup";
type StatusFilter = "all" | "active" | "delivered" | "cancelled";

const TYPE_OPTS: { id: TypeFilter; label: string }[] = [
  { id: "all",      label: "All types"    },
  { id: "delivery", label: "Delivery"     },
  { id: "pickup",   label: "Pickup"       },
];
const STATUS_OPTS: { id: StatusFilter; label: string }[] = [
  { id: "all",       label: "All statuses" },
  { id: "active",    label: "Active"        },
  { id: "delivered", label: "Delivered"     },
  { id: "cancelled", label: "Cancelled"     },
];

// ─── OrderRow ──────────────────────────────────────────────────────────────────

function OrderRow({ order, selected, onClick }: {
  order: ManagerOrderListItem;
  selected: boolean;
  onClick: () => void;
}) {
  const s = statusInfo(order.status, order.canceled);
  const isNew = !order.canceled && order.status === "ACCEPTED";

  return (
    <div
      onClick={onClick}
      style={{
        padding: "11px 16px", borderBottom: `1px solid ${D.line}`,
        background: selected ? "rgba(255,61,20,0.06)" : "transparent",
        borderLeft: `2px solid ${selected ? "#ff3d14" : "transparent"}`,
        cursor: "pointer", transition: "background 100ms",
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = "rgba(250,245,238,0.03)"; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <div style={{
            width: 7, height: 7, borderRadius: 2, flexShrink: 0, background: s.color,
            animation: s.pulsed ? "om-pulse 2s ease-in-out infinite" : "none",
          }} />
          <span style={{ fontSize: 13, fontWeight: isNew ? 800 : 600, color: D.text, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
            {order.customerName || "Guest"}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: D.vfaint }}>
            #{order.number || order.id.slice(-4)}
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: isNew ? 800 : 600, color: isNew ? D.text : D.dim, flexShrink: 0 }}>
          {fmtCents(order.totalCents)}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 14 }}>
        <span style={{ fontSize: 11.5, color: D.faint, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {order.orderType === "TAKEAWAY" ? "Pickup" : "Delivery"} · {order.paymentMethod}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ background: s.bg, color: s.color, borderRadius: 4, padding: "2px 6px",
            fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {s.label}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: D.vfaint }}>
            {fmtTime(order.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── OrderListPanel ────────────────────────────────────────────────────────────

function OrderListPanel({ orders, selectedId, onSelect }: {
  orders: ManagerOrderListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [range,   setRange]   = useState<RangeId>("7days");
  const [type,    setType]    = useState<TypeFilter>("all");
  const [status,  setStatus]  = useState<StatusFilter>("all");
  const [search,  setSearch]  = useState("");
  const [focused, setFocused] = useState(false);

  const filtered = useMemo(() => {
    let r = orders;
    const dr = DATE_RANGES.find(x => x.id === range);
    if (dr?.maxMins) r = r.filter(o => minsAgo(o.createdAt) < dr.maxMins);
    if (type === "delivery") r = r.filter(o => o.orderType === "DELIVERY");
    else if (type === "pickup") r = r.filter(o => o.orderType === "TAKEAWAY");
    if (status === "active") r = r.filter(o => !o.canceled && ["ACCEPTED","PREPARING","DELIVERING"].includes(o.status));
    else if (status === "delivered") r = r.filter(o => !o.canceled && o.status === "DELIVERED");
    else if (status === "cancelled") r = r.filter(o => o.canceled);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(o =>
        (o.customerName ?? "").toLowerCase().includes(q) ||
        (o.number ?? "").toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return r;
  }, [orders, range, type, status, search]);

  const summary = useMemo(() => ({
    count:     filtered.length,
    total:     filtered.reduce((s, o) => s + o.totalCents, 0),
    delivered: filtered.filter(o => !o.canceled && o.status === "DELIVERED").length,
    cancelled: filtered.filter(o => o.canceled).length,
  }), [filtered]);

  const selStyle: React.CSSProperties = {
    flex: 1, background: D.surf2, border: `1px solid ${D.line}`, borderRadius: 7,
    color: D.dim, fontSize: 11.5, fontFamily: "inherit",
    padding: "5px 22px 5px 9px", outline: "none", cursor: "pointer",
    WebkitAppearance: "none", appearance: "none", width: "100%",
  };

  return (
    <div style={{ width: 340, flexShrink: 0, borderRight: `1px solid ${D.line}`, display: "flex", flexDirection: "column", overflow: "hidden", background: D.surf }}>

      {/* Header */}
      <div style={{ height: 52, flexShrink: 0, padding: "0 16px", borderBottom: `1px solid ${D.line}`, display: "flex", alignItems: "center", gap: 10, background: D.surf2 }}>
        <span style={{ lineHeight: 0, color: D.faint }}><IReceipt /></span>
        <span style={{ fontSize: 14, fontWeight: 800, color: D.text, letterSpacing: "-0.025em", flex: 1 }}>Orders</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: D.faint }}>{filtered.length} results</span>
      </div>

      {/* Filters */}
      <div style={{ padding: "10px 12px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, borderBottom: `1px solid ${D.line}` }}>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: focused ? D.surf : D.surf2, border: `1px solid ${focused ? "#ff3d14" : D.line}`, borderRadius: 8, padding: "7px 11px", transition: "border-color 160ms, background 160ms" }}>
          <span style={{ lineHeight: 0, color: D.faint }}><ISearch /></span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customers, orders…"
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={{ background: "none", border: "none", outline: "none", fontSize: 12.5, color: D.text, flex: 1, fontFamily: "inherit" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: D.faint, lineHeight: 0, padding: 0, display: "flex", alignItems: "center" }}>
              <IClose />
            </button>
          )}
        </div>

        {/* Date range pills */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: "0.14em", textTransform: "uppercase", color: D.vfaint, marginBottom: 5 }}>Created at</div>
          <div style={{ display: "flex", gap: 3 }}>
            {DATE_RANGES.map(r => (
              <button key={r.id} onClick={() => setRange(r.id as RangeId)}
                style={{ flex: 1, padding: "5px 0", cursor: "pointer", fontFamily: "inherit",
                  background: range === r.id ? D.surf2 : "none",
                  border: `1px solid ${range === r.id ? D.lineA : "transparent"}`,
                  borderRadius: 7, fontSize: 11,
                  fontWeight: range === r.id ? 700 : 400,
                  color: range === r.id ? D.text : D.faint,
                  transition: "all 120ms" }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type + status dropdowns */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { value: type,   opts: TYPE_OPTS,   onChange: (v: string) => setType(v as TypeFilter) },
            { value: status, opts: STATUS_OPTS, onChange: (v: string) => setStatus(v as StatusFilter) },
          ].map((sel, i) => (
            <div key={i} style={{ flex: 1, position: "relative" }}>
              <select value={sel.value} onChange={e => sel.onChange(e.target.value)} style={selStyle}>
                {sel.opts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", lineHeight: 0, color: D.faint, pointerEvents: "none" }}><IChevD /></span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ padding: "10px 14px", borderBottom: `1px solid ${D.line}`, flexShrink: 0, display: "flex", background: D.surf2 }}>
        {[
          { label: "Orders",    value: String(summary.count),            color: D.text    },
          { label: "Revenue",   value: fmtCents(summary.total),          color: D.text    },
          { label: "Delivered", value: String(summary.delivered),        color: D.green   },
          { label: "Cancelled", value: summary.cancelled ? String(summary.cancelled) : "—", color: summary.cancelled ? "#ff3d14" : D.vfaint },
        ].map((s, i) => (
          <div key={s.label} style={{ flex: 1, borderLeft: i > 0 ? `1px solid ${D.line}` : "none", paddingLeft: i > 0 ? 12 : 0 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, letterSpacing: "0.13em", textTransform: "uppercase", color: D.vfaint, marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10, paddingBottom: 40, color: D.faint }}>
            <IReceipt />
            <span style={{ fontSize: 12, color: D.faint }}>No orders match these filters</span>
          </div>
        ) : filtered.map(order => (
          <OrderRow key={order.id} order={order} selected={selectedId === order.id} onClick={() => onSelect(order.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── Detail sections ───────────────────────────────────────────────────────────

function CustomerSection({ customer }: { customer: OrderDetail["customer"] }) {
  const initials = (customer.name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{ marginBottom: 20 }}>
      <SecHdr icon={<IUser />} label="Customer" />
      <div style={{ background: D.surf2, border: `1px solid ${D.line}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: "rgba(255,61,20,0.10)", border: "1px solid rgba(255,61,20,0.16)", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14, color: "#ff3d14" }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: D.text, letterSpacing: "-0.02em", marginBottom: 7 }}>
              {customer.name || "Guest"}
            </div>
            {customer.phone && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: D.dim }}>
                <span style={{ lineHeight: 0, color: D.faint }}><IPhone /></span>
                {customer.phone}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderTypeSection({ orderType }: { orderType: string }) {
  const isDelivery = orderType === "DELIVERY";
  return (
    <div style={{ marginBottom: 20 }}>
      <SecHdr icon={isDelivery ? <ITruck /> : <IBag />} label={isDelivery ? "Delivery" : "Pickup"} />
      <div style={{ background: D.surf2, border: `1px solid ${D.line}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: isDelivery ? "rgba(255,61,20,0.10)" : "rgba(59,130,246,0.10)", display: "grid", placeItems: "center", color: isDelivery ? "#ff3d14" : "#3b82f6" }}>
          {isDelivery ? <ITruck /> : <IBag />}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{isDelivery ? "Delivery order" : "Pickup order"}</div>
          <div style={{ fontSize: 12, color: D.dim, marginTop: 2 }}>
            {isDelivery ? "Dispatched to driver" : "Customer collects at the restaurant"}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemsSection({ order }: { order: OrderDetail }) {
  const discount = order.subtotalCents - order.discountedSubtotalCents;
  return (
    <div style={{ marginBottom: 20 }}>
      <SecHdr icon={<IReceipt />} label="Items" />
      <div style={{ background: D.surf2, border: `1px solid ${D.line}`, borderRadius: 12, overflow: "hidden" }}>
        {order.items.map((item, i) => (
          <div key={`${item.productId}-${i}`} style={{ padding: "12px 16px", borderBottom: `1px solid ${D.line}` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: D.faint, minWidth: 22, paddingTop: 1 }}>{item.quantity}×</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{item.productName}</div>
                <div style={{ fontSize: 11.5, color: D.faint, marginTop: 2 }}>{fmtCents(item.unitAmountCents)} each</div>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: D.dim, flexShrink: 0 }}>
                {fmtCents(item.lineTotalCents)}
              </span>
            </div>
          </div>
        ))}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: D.faint }}>Subtotal</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: D.dim }}>{fmtCents(order.subtotalCents)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: D.green, fontWeight: 600 }}>Discount</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: D.green }}>−{fmtCents(discount)}</span>
            </div>
          )}
          {order.deliveryFeeCents > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: D.faint }}>Delivery fee</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: D.dim }}>{fmtCents(order.deliveryFeeCents)}</span>
            </div>
          )}
          {order.tipAmountCents > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: D.faint }}>Tip{order.tipPercent ? ` (${order.tipPercent}%)` : ""}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: D.dim }}>{fmtCents(order.tipAmountCents)}</span>
            </div>
          )}
          <div style={{ height: 1, background: D.line, margin: "2px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: D.text }}>Total</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 800, color: D.text }}>{fmtCents(order.totalCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentSection({ method }: { method: string }) {
  const labels: Record<string, { label: string; note: string }> = {
    CARD:  { label: "Card payment",       note: "Charged at checkout"   },
    PIX:   { label: "PIX",                note: "Instant · confirmed"   },
    CASH:  { label: "Cash on delivery",   note: "Collected on delivery" },
  };
  const m = labels[method] ?? { label: method, note: "" };
  return (
    <div style={{ marginBottom: 20 }}>
      <SecHdr icon={<ICard />} label="Payment" />
      <div style={{ background: D.surf2, border: `1px solid ${D.line}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0, background: D.surf, border: `1px solid ${D.line}`, display: "grid", placeItems: "center", color: D.faint }}>
          <ICard />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: D.text }}>{m.label}</div>
          {m.note && <div style={{ fontSize: 11.5, color: D.faint, marginTop: 2 }}>{m.note}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── OrderDetailPanel ──────────────────────────────────────────────────────────

function OrderDetailPanel({ order, loading, error }: {
  order: OrderDetail | null;
  loading: boolean;
  error: string | null;
}) {
  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: D.bg }}>
      <span style={{ fontSize: 13, color: D.faint }}>Loading…</span>
    </div>
  );

  if (error) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: D.bg, flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 13, color: "#ff3d14" }}>{error}</span>
    </div>
  );

  if (!order) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: D.bg, flexDirection: "column", gap: 14 }}>
      <div style={{ width: 48, height: 48, borderRadius: 13, background: D.surf2, border: `1px solid ${D.line}`, display: "grid", placeItems: "center", color: D.faint }}>
        <IReceipt />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: D.dim }}>Select an order</div>
        <div style={{ fontSize: 12, color: D.faint, marginTop: 5 }}>Click any row to view details</div>
      </div>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: D.bg, overflow: "hidden" }}>
      {/* Detail header */}
      <div style={{ height: 52, flexShrink: 0, padding: "0 20px", background: D.surf2, borderBottom: `1px solid ${D.line}`, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: D.text, letterSpacing: "-0.03em" }}>
            Order #{order.number || order.id.slice(-6)}
          </span>
          <StatusBadge status={order.status} canceled={order.canceled} />
          {order.orderType === "TAKEAWAY" && (
            <span style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", borderRadius: 5, padding: "3px 8px", fontFamily: "inherit", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Pickup
            </span>
          )}
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: D.faint, flexShrink: 0 }}>
          {fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}
        </span>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
        <CustomerSection customer={order.customer} />
        <OrderTypeSection orderType={order.orderType} />
        <ItemsSection order={order} />
        <PaymentSection method={order.paymentMethod} />
      </div>
    </div>
  );
}

// ─── OrderManager ──────────────────────────────────────────────────────────────

export default function OrderManager({ orders }: { orders: ManagerOrderListItem[] }) {
  const [selectedId,    setSelectedId]    = useState<string | null>(null);
  const [detail,        setDetail]        = useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError,   setDetailError]   = useState<string | null>(null);

  const fetchDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store" });
      const payload = await res.json().catch(() => ({})) as OrderDetail | { error?: string };
      if (!res.ok) throw new Error("error" in payload ? (payload.error ?? `Request failed (${res.status})`) : `Request failed (${res.status})`);
      setDetail(payload as OrderDetail);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : "Could not load order details");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    void fetchDetail(id);
  }, [fetchDetail]);

  useEffect(() => {
    if (orders[0]?.id) {
      setSelectedId(orders[0].id);
      void fetchDetail(orders[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
      <style>{`@keyframes om-pulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
      <OrderListPanel orders={orders} selectedId={selectedId} onSelect={handleSelect} />
      <OrderDetailPanel order={detail} loading={loadingDetail} error={detailError} />
    </div>
  );
}
