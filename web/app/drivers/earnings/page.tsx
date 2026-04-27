import Link from "next/link";
import getDriverEarnings from "@/src/getDriverEarnings";

const LOCAL_TIME_ZONE = "America/New_York";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const integerFormatter = new Intl.NumberFormat("en-US");

function getSearchParamValue(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function getTodayDateStringInTimeZone(timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  return utcDate.toISOString().slice(0, 10);
}

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.toISOString().slice(0, 10) === value;
}

function resolveDateRange(input: {
  start?: string;
  end?: string;
}): { startDate: string; endDate: string } {
  const today = getTodayDateStringInTimeZone(LOCAL_TIME_ZONE);
  const defaultEndDate = today;
  const defaultStartDate = shiftDate(defaultEndDate, -6);

  const normalizedStart =
    input.start && isValidDateInput(input.start) ? input.start : defaultStartDate;
  const normalizedEnd =
    input.end && isValidDateInput(input.end) ? input.end : defaultEndDate;

  if (normalizedStart <= normalizedEnd) {
    return {
      startDate: normalizedStart,
      endDate: normalizedEnd,
    };
  }

  return {
    startDate: normalizedEnd,
    endDate: normalizedStart,
  };
}

export default async function DriverEarningsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const start = getSearchParamValue(resolvedSearchParams.start);
  const end = getSearchParamValue(resolvedSearchParams.end);
  const { startDate, endDate } = resolveDateRange({ start, end });
  const earnings = await getDriverEarnings({ startDate, endDate });
  const deliveriesByDriver = earnings.deliveries.reduce(
    (acc, delivery) => {
      const existing = acc.get(delivery.driverId);
      if (existing) {
        existing.deliveries.push(delivery);
        existing.deliveryFeesCents += delivery.deliveryFeeCents;
        return acc;
      }

      acc.set(delivery.driverId, {
        driverId: delivery.driverId,
        driverName: delivery.driverName,
        deliveries: [delivery],
        deliveryFeesCents: delivery.deliveryFeeCents,
      });
      return acc;
    },
    new Map<
      string,
      {
        driverId: string;
        driverName: string;
        deliveries: typeof earnings.deliveries;
        deliveryFeesCents: number;
      }
    >(),
  );

  return (
    <main className="min-h-dvh bg-zinc-50 p-4 md:p-8">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <header className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Driver Earnings
            </h1>
            <p className="text-sm text-zinc-600">
              Formula: {currencyFormatter.format(earnings.dailyBasePayCents / 100)}{" "}
              fixed per driver-day + delivery fees from delivered orders.
            </p>
            <p className="text-xs text-zinc-500">
              Time zone: {earnings.timeZone}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
        </header>

        <form className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="min-w-[200px]">
            <label
              htmlFor="start"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              Start Date
            </label>
            <input
              id="start"
              name="start"
              type="date"
              defaultValue={startDate}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            />
          </div>

          <div className="min-w-[200px]">
            <label
              htmlFor="end"
              className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
            >
              End Date
            </label>
            <input
              id="end"
              name="end"
              type="date"
              defaultValue={endDate}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Apply
          </button>
        </form>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Total Earnings
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {currencyFormatter.format(earnings.totals.totalCents / 100)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Base Pay
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {currencyFormatter.format(earnings.totals.basePayCents / 100)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Delivery Fees
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {currencyFormatter.format(earnings.totals.deliveryFeesCents / 100)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Deliveries
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {integerFormatter.format(earnings.totals.deliveries)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Driver-Days Paid
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {integerFormatter.format(earnings.totals.workDays)}
            </p>
          </div>
        </section>

        <section className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-900">By Driver</h2>
          </div>
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-zinc-100 text-zinc-600">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Driver</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
                <th className="px-3 py-2 text-right font-semibold">Days Paid</th>
                <th className="px-3 py-2 text-right font-semibold">Deliveries</th>
                <th className="px-3 py-2 text-right font-semibold">Delivery Fees</th>
                <th className="px-3 py-2 text-right font-semibold">Base Pay</th>
                <th className="px-3 py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {earnings.drivers.map((driver) => (
                <tr
                  key={driver.driverId}
                  className="border-t border-zinc-100 hover:bg-zinc-50"
                >
                  <td className="px-3 py-2 text-zinc-900">{driver.driverName}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        driver.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {driver.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-700">
                    {integerFormatter.format(driver.workDays)}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-700">
                    {integerFormatter.format(driver.deliveries)}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-700">
                    {currencyFormatter.format(driver.deliveryFeesCents / 100)}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-700">
                    {currencyFormatter.format(driver.basePayCents / 100)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-zinc-900">
                    {currencyFormatter.format(driver.totalCents / 100)}
                  </td>
                </tr>
              ))}
              {earnings.drivers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-zinc-500">
                    No drivers found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-900">
              Daily Breakdown
            </h2>
          </div>
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-zinc-100 text-zinc-600">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Day</th>
                <th className="px-3 py-2 text-left font-semibold">Driver</th>
                <th className="px-3 py-2 text-right font-semibold">Deliveries</th>
                <th className="px-3 py-2 text-right font-semibold">Delivery Fees</th>
                <th className="px-3 py-2 text-right font-semibold">Base Pay</th>
                <th className="px-3 py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {earnings.daily.map((entry) => (
                <tr
                  key={`${entry.day}-${entry.driverId}`}
                  className="border-t border-zinc-100 hover:bg-zinc-50"
                >
                  <td className="px-3 py-2 text-zinc-900">{entry.day}</td>
                  <td className="px-3 py-2 text-zinc-700">{entry.driverName}</td>
                  <td className="px-3 py-2 text-right text-zinc-700">
                    {integerFormatter.format(entry.deliveries)}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-700">
                    {currencyFormatter.format(entry.deliveryFeesCents / 100)}
                  </td>
                  <td className="px-3 py-2 text-right text-zinc-700">
                    {currencyFormatter.format(entry.basePayCents / 100)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-zinc-900">
                    {currencyFormatter.format(entry.totalCents / 100)}
                  </td>
                </tr>
              ))}
              {earnings.daily.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-zinc-500">
                    No delivered orders in this period.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Deliveries By Driver
            </h2>
            <p className="text-sm text-zinc-600">
              Delivered orders included in earnings for this date range.
            </p>
          </div>

          {Array.from(deliveriesByDriver.values()).map((driver, index) => (
            <details
              key={driver.driverId}
              className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50"
              open={index === 0}
            >
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-zinc-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>{driver.driverName}</span>
                  <span className="text-zinc-600">
                    {integerFormatter.format(driver.deliveries.length)} deliveries •{" "}
                    {currencyFormatter.format(driver.deliveryFeesCents / 100)} fees
                  </span>
                </div>
              </summary>

              <div className="overflow-x-auto border-t border-zinc-200 bg-white">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-zinc-100 text-zinc-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Created At</th>
                      <th className="px-3 py-2 text-left font-semibold">Day</th>
                      <th className="px-3 py-2 text-left font-semibold">Order #</th>
                      <th className="px-3 py-2 text-left font-semibold">External</th>
                      <th className="px-3 py-2 text-left font-semibold">Customer</th>
                      <th className="px-3 py-2 text-right font-semibold">Delivery Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driver.deliveries.map((delivery) => (
                      <tr
                        key={delivery.orderId}
                        className="border-t border-zinc-100 hover:bg-zinc-50"
                      >
                        <td className="px-3 py-2 text-zinc-700">
                          {delivery.createdAtLocal}
                        </td>
                        <td className="px-3 py-2 text-zinc-900">{delivery.day}</td>
                        <td className="px-3 py-2 text-zinc-900">
                          {delivery.orderNumber || "-"}
                        </td>
                        <td className="px-3 py-2 text-zinc-700">
                          {delivery.externalId || "-"}
                        </td>
                        <td className="px-3 py-2 text-zinc-700">
                          {delivery.customerName || "-"}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-900">
                          {currencyFormatter.format(delivery.deliveryFeeCents / 100)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}

          {deliveriesByDriver.size === 0 ? (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
              No deliveries found for this period.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
