import Link from "next/link";
import getOrders from "@/src/getOrders";
import OrdersTable from "./OrdersTable";

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <main className="min-h-dvh bg-zinc-50 p-4 md:p-8">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900">Orders</h1>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">
              {orders.length} total
            </span>
            <Link
              href="/drivers/earnings"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Driver Earnings
            </Link>
            <Link
              href="/charts"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Charts
            </Link>
          </div>
        </div>

        <OrdersTable initialOrders={orders} />
      </div>
    </main>
  );
}
