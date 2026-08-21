"use client";

import type { CSSProperties } from "react";
import type { OrderListItem } from "../../lib/api";
import { parsePhone } from "../../lib/phone";
import { formatCreatedAt, moneyFromCents, orderLabel, paymentStatus, paymentTypeLabel, typeLabel } from "./data";
import { paymentBadge, statusBadge, typeBadge } from "./badges";

const labelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "#9B9B9B",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const sectionStyle: CSSProperties = { padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" };

const PAY_ICONS: Record<string, string> = { Card: "▭", Cash: "$", Zelle: "⇄" };

export function OrderDetail({ order, onClose }: { order: OrderListItem; onClose: () => void }) {
  const b = statusBadge(order.status, order.canceled, "lg");
  const type = typeBadge(typeLabel(order.orderType));
  const payLabel = paymentStatus(order.payments, order.totalCents);
  const pay = paymentBadge(payLabel);

  const customerName = order.customer?.name?.trim() || "";
  const phone = parsePhone(order.customer?.phone);
  const customer = customerName || "Guest";
  const initials = customerName
    ? customerName.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "—";

  const discountCents = Math.max(0, order.subtotalCents - order.discountedSubtotalCents);
  const totals: { label: string; value: string; strong?: boolean; negative?: boolean }[] = [
    { label: "Subtotal", value: moneyFromCents(order.subtotalCents) },
  ];
  if (discountCents > 0) totals.push({ label: "Discount", value: "−" + moneyFromCents(discountCents), negative: true });
  if (order.deliveryFeeCents > 0) totals.push({ label: "Delivery fee", value: moneyFromCents(order.deliveryFeeCents) });
  if (order.tipAmountCents > 0)
    totals.push({ label: order.tipPercent > 0 ? `Tip (${order.tipPercent}%)` : "Tip", value: moneyFromCents(order.tipAmountCents) });
  totals.push({ label: "Total", value: moneyFromCents(order.totalCents), strong: true });

  const paidCents = order.payments.reduce((a, p) => a + p.amount, 0);
  const dueCents = Math.max(0, order.totalCents - paidCents);
  const paymentsSummary =
    order.payments.length === 0
      ? moneyFromCents(order.totalCents) + " due"
      : dueCents > 0
        ? moneyFromCents(paidCents) + " paid · " + moneyFromCents(dueCents) + " due"
        : moneyFromCents(paidCents) + " paid";

  return (
    <div
      style={{
        width: "44%",
        minWidth: 340,
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid rgba(255,255,255,0.07)",
        background: "#202020",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#F1F1F1" }}>{orderLabel(order)}</span>
          <span style={b.badgeStyle}>
            <span style={b.dotStyle} />
            {b.label}
          </span>
        </div>
        <button
          type="button"
          className="zp-icon-btn"
          onClick={onClose}
          style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, cursor: "pointer" }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="#9B9B9B" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "18px 20px 20px" }}>
        {/* Customer */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 36, height: 36, borderRadius: 9999, background: "#2F2F2F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 600, color: "#E8E8E8", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#F1F1F1" }}>{customer}</div>
          </div>
          {phone?.formatted && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {phone.iso && (
                <span style={{ fontSize: 9.5, fontWeight: 600, color: "#9B9B9B", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4, letterSpacing: "0.04em" }}>
                  {phone.iso}
                </span>
              )}
              <span style={{ fontSize: 11.5, color: "#9B9B9B", fontFamily: "var(--font-mono)" }}>{phone.formatted}</span>
            </div>
          )}
        </div>

        {/* Meta grid */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 28px", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <div style={{ ...labelStyle, marginBottom: 6 }}>Type</div>
            <span style={type.badgeStyle}>
              <span style={type.dotStyle} />
              {typeLabel(order.orderType)}
            </span>
          </div>
          <div>
            <div style={{ ...labelStyle, marginBottom: 6 }}>Payment</div>
            <span style={pay.badgeStyle}>
              <span style={pay.dotStyle} />
              {payLabel}
            </span>
          </div>
          <div>
            <div style={{ ...labelStyle, marginBottom: 6 }}>Method</div>
            <div style={{ fontSize: 12.5, color: "#F1F1F1" }}>{paymentTypeLabel(order.paymentMethod)}</div>
          </div>
          <div>
            <div style={{ ...labelStyle, marginBottom: 6 }}>Created at</div>
            <div style={{ fontSize: 12.5, color: "#F1F1F1", fontFamily: "var(--font-mono)" }}>{formatCreatedAt(order.createdAt)}</div>
          </div>
        </div>

        {/* Items */}
        {order.items.length > 0 && (
          <div style={sectionStyle}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>Items</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {order.items.map((it, i) => (
                <div key={it.productId + ":" + i}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontSize: 11.5, color: "#9B9B9B", fontFamily: "var(--font-mono)", width: 26, flexShrink: 0 }}>{it.quantity}×</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 12.5, color: "#E8E8E8" }}>{it.productName}</span>
                      {it.quantity > 1 && (
                        <span style={{ fontSize: 11, color: "#75767C", fontFamily: "var(--font-mono)", marginLeft: 8 }}>{moneyFromCents(it.unitAmountCents)} ea</span>
                      )}
                    </span>
                    <span style={{ fontSize: 12.5, color: "#E8E8E8", fontFamily: "var(--font-mono)" }}>{moneyFromCents(it.lineTotalCents)}</span>
                  </div>
                  {it.modifierGroupItems && it.modifierGroupItems.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, margin: "5px 0 0 36px" }}>
                      {it.modifierGroupItems.map((m) => (
                        <div key={m.id} style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                          <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: "#9B9B9B" }}>+ {m.name}</span>
                          {m.price > 0 && (
                            <span style={{ fontSize: 11.5, color: "#9B9B9B", fontFamily: "var(--font-mono)" }}>+{moneyFromCents(m.price)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div style={{ ...sectionStyle, display: "flex", flexDirection: "column", gap: 8 }}>
          {totals.map((t) => (
            <div key={t.label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: t.strong ? 13 : 12, color: t.strong ? "#F1F1F1" : "#9B9B9B", fontWeight: t.strong ? 600 : 400 }}>{t.label}</span>
              <span
                style={{
                  fontFamily: t.strong ? "var(--font-display)" : "var(--font-mono)",
                  fontSize: t.strong ? 15 : 12,
                  fontWeight: t.strong ? 700 : 400,
                  color: t.negative ? "#22C55E" : t.strong ? "#F1F1F1" : "#E8E8E8",
                }}
              >
                {t.value}
              </span>
            </div>
          ))}
        </div>

        {/* Payments */}
        <div style={{ paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
            <div style={labelStyle}>Payments</div>
            <div style={{ fontSize: 10, color: "#75767C", fontFamily: "var(--font-mono)" }}>{paymentsSummary}</div>
          </div>
          {order.payments.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {order.payments.map((p, i) => {
                const t = paymentTypeLabel(p.paymentType);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", background: "#191919", borderRadius: 6 }}>
                    <span style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: "#2F2F2F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, color: "#E8E8E8" }}>
                      {PAY_ICONS[t] || "$"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: "#F1F1F1" }}>{t}</div>
                      {p.paidAt && (
                        <div style={{ fontSize: 10.5, color: "#75767C", fontFamily: "var(--font-mono)", marginTop: 1 }}>{formatCreatedAt(p.paidAt)}</div>
                      )}
                    </div>
                    <span style={{ fontSize: 12.5, color: "#E8E8E8", fontFamily: "var(--font-mono)" }}>{moneyFromCents(p.amount)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: "#75767C" }}>No payments recorded.</div>
          )}
        </div>
      </div>
    </div>
  );
}
