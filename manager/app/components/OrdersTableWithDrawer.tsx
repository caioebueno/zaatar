"use client";

import React, { useState } from "react";
import { StatusPill } from "./ui/StatusPill";
import type { PillVariant } from "./ui/StatusPill";
import {
  Stepper,
  DELIVERY_STEPS,
  TAKEAWAY_STEPS,
  DELIVERY_INDEX,
  TAKEAWAY_INDEX,
} from "./ui/Stepper";

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
  customer: {
    name: string | null;
    phone: string | null;
  };
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

function statusToPill(status: string, canceled: boolean): PillVariant {
  if (canceled) return "late";
  switch (status) {
    case "ACCEPTED":   return "draft";
    case "PREPARING":  return "cooking";
    case "DELIVERING": return "dispatched";
    case "DELIVERED":  return "ontime";
    default:           return "draft";
  }
}

function formatCents(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((value || 0) / 100);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

const drawerSection: React.CSSProperties = {
  padding: "14px 20px",
  borderBottom: "1px solid rgba(22,18,15,0.06)",
};

function DrawerSectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mono"
      style={{
        fontSize: 10,
        color: "var(--slate)",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

export default function OrdersTableWithDrawer({
  orders,
}: {
  orders: ManagerOrderListItem[];
}) {
  const [activeOrder, setActiveOrder] = useState<OrderDetail | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  async function openOrder(orderId: string) {
    setDrawerError(null);
    setLoadingOrderId(orderId);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as
        | OrderDetail
        | { error?: string };

      if (!response.ok) {
        const message =
          payload && typeof payload === "object" && "error" in payload
            ? (payload.error ?? `Request failed (${response.status})`)
            : `Request failed (${response.status})`;
        throw new Error(message);
      }

      setActiveOrder(payload as OrderDetail);
    } catch (error) {
      setDrawerError(error instanceof Error ? error.message : "Could not load order details");
      setActiveOrder(null);
    } finally {
      setLoadingOrderId(null);
    }
  }

  function closeDrawer() {
    setActiveOrder(null);
    setDrawerError(null);
  }

  return (
    <>
      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Created</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => void openOrder(order.id)}
              >
                <td>{order.number || "-"}</td>
                <td>{formatDateTime(order.createdAt)}</td>
                <td>
                  <div className="grid gap-0.5">
                    <span>{order.customerName || "Guest"}</span>
                    {order.customerPhone ? (
                      <span className="text-xs text-slate-400">{order.customerPhone}</span>
                    ) : null}
                  </div>
                </td>
                <td>{order.orderType}</td>
                <td>{order.paymentMethod}</td>
                <td>
                  <StatusPill variant={statusToPill(order.status, order.canceled)}>
                    {order.canceled ? "Canceled" : order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                  </StatusPill>
                </td>
                <td>{formatCents(order.totalCents)}</td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7}>No orders found for selected filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {loadingOrderId ? (
        <p className="sales-channel-muted">Loading order details...</p>
      ) : null}
      {drawerError ? (
        <p className="sales-channel-feedback is-error">{drawerError}</p>
      ) : null}

      {activeOrder ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
          <button
            type="button"
            aria-label="Close order details"
            style={{ position: "absolute", inset: 0, cursor: "pointer", border: 0, background: "rgba(22,18,15,0.35)" }}
            onClick={closeDrawer}
          />
          <aside
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              height: "100%",
              width: "min(100%, 520px)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              borderLeft: "1px solid var(--border)",
              background: "var(--paper)",
              boxShadow: "-8px 0 20px rgba(22,18,15,0.14)",
            }}
          >
            <header
              style={{
                position: "sticky",
                top: 0,
                zIndex: 1,
                background: "var(--paper)",
                borderBottom: "1px solid var(--border)",
                padding: "16px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
                <div>
                  <h3
                    className="mono"
                    style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}
                  >
                    #{activeOrder.number || "-"}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                    <StatusPill variant={statusToPill(activeOrder.status, activeOrder.canceled)}>
                      {activeOrder.canceled
                        ? "Canceled"
                        : activeOrder.status.charAt(0) + activeOrder.status.slice(1).toLowerCase()}
                    </StatusPill>
                    <span
                      className="mono"
                      style={{ fontSize: 11, color: "var(--slate)", letterSpacing: "0.04em" }}
                    >
                      {formatDateTime(activeOrder.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    background: "var(--paper)",
                    padding: "7px 12px",
                    fontFamily: "var(--font-sans)",
                    fontWeight: 600,
                    fontSize: 12,
                    color: "var(--ink)",
                    cursor: "pointer",
                  }}
                  onClick={closeDrawer}
                >
                  Close
                </button>
              </div>

              {/* Order lifecycle stepper */}
              {!activeOrder.canceled && (
                <Stepper
                  steps={activeOrder.orderType === "TAKEAWAY" ? TAKEAWAY_STEPS : DELIVERY_STEPS}
                  activeIndex={
                    activeOrder.orderType === "TAKEAWAY"
                      ? (TAKEAWAY_INDEX[activeOrder.status] ?? 0)
                      : (DELIVERY_INDEX[activeOrder.status] ?? 0)
                  }
                />
              )}
            </header>

            <section style={drawerSection}>
              <DrawerSectionHead>Customer</DrawerSectionHead>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                {activeOrder.customer.name || "Guest"}
              </p>
              <p className="mono" style={{ margin: "2px 0 0", fontSize: 12, color: "var(--slate)" }}>
                {activeOrder.customer.phone || "—"}
              </p>
            </section>

            <section style={drawerSection}>
              <DrawerSectionHead>Line items</DrawerSectionHead>
              <div style={{ display: "grid", gap: 8 }}>
                {activeOrder.items.map((item) => (
                  <div
                    key={`${item.productId}-${item.productName}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      background: "var(--cream)",
                    }}
                  >
                    <div>
                      <p style={{ margin: "0 0 2px", fontWeight: 600, color: "var(--ink)", fontSize: 14 }}>
                        {item.productName}
                      </p>
                      <p className="mono" style={{ margin: 0, fontSize: 11, color: "var(--slate)" }}>
                        {item.quantity} × {formatCents(item.unitAmountCents)}
                      </p>
                    </div>
                    <p className="mono" style={{ margin: 0, fontWeight: 600, color: "var(--ink)", fontSize: 13, flexShrink: 0 }}>
                      {formatCents(item.lineTotalCents)}
                    </p>
                  </div>
                ))}
                {activeOrder.items.length === 0 && (
                  <p style={{ margin: 0, color: "var(--slate)", fontSize: 13 }}>No line items.</p>
                )}
              </div>
            </section>

            <section style={{ ...drawerSection, borderBottom: "none" }}>
              <DrawerSectionHead>Summary</DrawerSectionHead>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  ["Subtotal", formatCents(activeOrder.subtotalCents)],
                  ["Discounted subtotal", formatCents(activeOrder.discountedSubtotalCents)],
                  [`Tip (${activeOrder.tipPercent}%)`, formatCents(activeOrder.tipAmountCents)],
                  ["Delivery fee", formatCents(activeOrder.deliveryFeeCents)],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, color: "var(--char)" }}>
                    <span>{label}</span>
                    <strong className="mono">{value}</strong>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, borderTop: "1px dashed var(--bone)", paddingTop: 10, marginTop: 2, fontSize: 15, color: "var(--ink)", fontWeight: 700 }}>
                  <span>Total</span>
                  <span className="mono">{formatCents(activeOrder.totalCents)}</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </>
  );
}
