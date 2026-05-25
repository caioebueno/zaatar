export const dynamic = "force-dynamic";

import { orderTotalsLast7Days } from "@/src/chartData/orderTotalsLast7Days";
import getTodayOrders from "@/src/getTodayOrders";
import OrderTotalsLast7DaysBarChart from "@/app/components/OrderTotalsLast7DaysBarChart";
import OrdersTable from "@/app/orders/OrdersTable";

export default async function ChartsPage() {
  const [salesData, todayOrders] = await Promise.all([
    orderTotalsLast7Days(),
    getTodayOrders(),
  ]);

  return (
    <main className="min-h-dvh bg-zinc-50 p-4 md:p-8">
      <div className="mx-auto w-full max-w-350">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-6">Charts</h1>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm mb-8">
          <OrderTotalsLast7DaysBarChart data={salesData} />
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">
            Today&apos;s Orders
          </h2>
          <span className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">
            {todayOrders.length} orders
          </span>
        </div>
        <OrdersTable initialOrders={todayOrders} />
      </div>
    </main>
  );
}
