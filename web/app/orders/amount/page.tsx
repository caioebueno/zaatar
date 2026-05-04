import Link from "next/link";
import { getOrderTotalsByDateRange } from "@/src/chartData/orderTotalsByDateRange";

const FLORIDA_TIME_ZONE = "America/New_York";

type OrdersAmountPageProps = {
  searchParams: Promise<{
    startDate?: string | string[];
    endDate?: string | string[];
  }>;
};

function getFirstString(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function getFloridaTodayDate(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: FLORIDA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function shiftDate(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default async function OrdersAmountPage({
  searchParams,
}: OrdersAmountPageProps) {
  const resolvedSearchParams = await searchParams;
  const today = getFloridaTodayDate();
  const defaultStartDate = shiftDate(today, -6);

  const rawStartDate = getFirstString(resolvedSearchParams.startDate)?.trim() || "";
  const rawEndDate = getFirstString(resolvedSearchParams.endDate)?.trim() || "";

  const startDate = isIsoDate(rawStartDate) ? rawStartDate : defaultStartDate;
  const endDate = isIsoDate(rawEndDate) ? rawEndDate : today;

  const hasInvalidRange = startDate > endDate;

  const summary = hasInvalidRange
    ? null
    : await getOrderTotalsByDateRange({
        startDate,
        endDate,
      });

  return (
    <main className="min-h-dvh bg-zinc-50 p-4 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900">Order Amount by Date Range</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Orders
            </Link>
            <Link
              href="/charts"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Charts
            </Link>
          </div>
        </div>

        <form className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            Start date
            <input
              type="date"
              name="startDate"
              defaultValue={startDate}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">
            End date
            <input
              type="date"
              name="endDate"
              defaultValue={endDate}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="h-[42px] w-full rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 md:w-auto"
            >
              Apply
            </button>
          </div>
        </form>

        {hasInvalidRange ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            Start date must be before or equal to end date.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Total amount</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">
                {formatCurrency(summary?.totalInDollars ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Orders</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">{summary?.orders ?? 0}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Range</p>
              <p className="mt-2 text-base font-semibold text-zinc-900">
                {startDate} to {endDate}
              </p>
              <p className="mt-2 text-xs text-zinc-500">Canceled orders are excluded.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
