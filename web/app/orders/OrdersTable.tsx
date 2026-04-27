"use client";

import { useState } from "react";

type OrderListItem = {
  id: string;
  createdAt: string;
  scheduleFor: string | null;
  number: string | null;
  externalId: string | null;
  canceled: boolean;
  type: string;
  paymentMethod: string;
  status: string;
  customerName: string | null;
  language: string | null;
  itemCount: number;
  subtotalAmount: number;
  deliveryFee: number;
  tip: number;
  taxAmount: number;
  totalAmount: number;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusColor: Record<string, string> = {
  ACCEPTED: "bg-zinc-100 text-zinc-700",
  PREPARING: "bg-amber-100 text-amber-800",
  DELIVERING: "bg-sky-100 text-sky-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
};

export default function OrdersTable({
  initialOrders,
}: {
  initialOrders: OrderListItem[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function toggleCanceled(order: OrderListItem) {
    setActionError(null);
    setUpdatingOrderId(order.id);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          canceled: !order.canceled,
        }),
      });

      if (!response.ok) {
        const errorBody = await response
          .json()
          .catch(() => ({ error: "Internal Server Error" }));
        throw new Error(errorBody.error || "Failed to update order");
      }

      const updatedOrder = (await response.json()) as { canceled?: boolean };
      const nextCanceled =
        typeof updatedOrder.canceled === "boolean"
          ? updatedOrder.canceled
          : !order.canceled;

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id
            ? { ...currentOrder, canceled: nextCanceled }
            : currentOrder,
        ),
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to update order",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      {actionError ? (
        <div className="border-b border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}
      <table className="w-full min-w-[1320px] text-sm">
        <thead className="bg-zinc-100 text-zinc-600">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Created</th>
            <th className="px-3 py-2 text-left font-semibold">Order #</th>
            <th className="px-3 py-2 text-left font-semibold">External</th>
            <th className="px-3 py-2 text-left font-semibold">Customer</th>
            <th className="px-3 py-2 text-left font-semibold">Type</th>
            <th className="px-3 py-2 text-left font-semibold">Status</th>
            <th className="px-3 py-2 text-left font-semibold">Payment</th>
            <th className="px-3 py-2 text-right font-semibold">Items</th>
            <th className="px-3 py-2 text-right font-semibold">Products</th>
            <th className="px-3 py-2 text-right font-semibold">Delivery</th>
            <th className="px-3 py-2 text-right font-semibold">Tip</th>
            <th className="px-3 py-2 text-right font-semibold">Tax</th>
            <th className="px-3 py-2 text-right font-semibold">Total</th>
            <th className="px-3 py-2 text-center font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className={`border-t border-zinc-100 hover:bg-zinc-50 ${order.canceled ? "bg-rose-50/70" : ""}`}
            >
              <td className="px-3 py-2 text-zinc-700">
                {dateTimeFormatter.format(new Date(order.createdAt))}
              </td>
              <td className="px-3 py-2 text-zinc-900">{order.number || "-"}</td>
              <td className="px-3 py-2 text-zinc-700">{order.externalId || "-"}</td>
              <td className="px-3 py-2 text-zinc-900">
                {order.customerName || "-"}
              </td>
              <td className="px-3 py-2 text-zinc-700">{order.type}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[order.status] || "bg-zinc-100 text-zinc-700"}`}
                  >
                    {order.status}
                  </span>
                  {order.canceled ? (
                    <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                      CANCELED
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="px-3 py-2 text-zinc-700">{order.paymentMethod}</td>
              <td className="px-3 py-2 text-right text-zinc-700">{order.itemCount}</td>
              <td className="px-3 py-2 text-right text-zinc-700">
                {currencyFormatter.format(order.subtotalAmount / 100)}
              </td>
              <td className="px-3 py-2 text-right text-zinc-700">
                {currencyFormatter.format(order.deliveryFee / 100)}
              </td>
              <td className="px-3 py-2 text-right text-zinc-700">
                {currencyFormatter.format(order.tip / 100)}
              </td>
              <td className="px-3 py-2 text-right text-zinc-700">
                {currencyFormatter.format(order.taxAmount / 100)}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-zinc-900">
                {currencyFormatter.format(order.totalAmount / 100)}
              </td>
              <td className="px-3 py-2 text-center">
                <button
                  type="button"
                  onClick={() => toggleCanceled(order)}
                  disabled={updatingOrderId === order.id}
                  className={`inline-flex min-w-[110px] items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    order.canceled
                      ? "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                      : "bg-rose-600 text-white hover:bg-rose-700"
                  } disabled:opacity-50`}
                >
                  {updatingOrderId === order.id
                    ? "Saving..."
                    : order.canceled
                      ? "Uncancel"
                      : "Cancel"}
                </button>
              </td>
            </tr>
          ))}
          {orders.length === 0 ? (
            <tr>
              <td colSpan={14} className="px-3 py-8 text-center text-zinc-500">
                No orders found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
