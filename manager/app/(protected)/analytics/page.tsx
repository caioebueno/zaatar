import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/src/lib/auth";
import { readBusinessIdFromCookieStore } from "@/src/lib/business";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";
import AnalyticsControlBar from "./AnalyticsControlBar";
import AnalyticsCard from "./AnalyticsCard";

type PageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
};

type DailyAnalyticsPoint = {
  averageTicket: number;
  date: string;
  orders: number;
  sales: number;
};

type AnalyticsResponse = {
  daily: DailyAnalyticsPoint[];
  from: string;
  summary: {
    averageTicket: number;
    totalOrders: number;
    totalSales: number;
  };
  timezone: string;
  to: string;
};

type ChartPoint = {
  averageTicket: number;
  date: string;
  label: string;
  orders: number;
  sales: number;
  x: number;
  y: number;
};

export type TPageHeader = {
  title: string
}

const PageHeader: React.FC<TPageHeader> = ({
title
}) => {
  return (
    <div className="flex flex-row px-6 py-3" style={{ background: 'var(--paper)', borderBottom: '1px solid var(--border)' }}>
        <span className="text-lg font-semibold">{title}</span>
    </div>
  )
}

function formatCents(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((value || 0) / 100);
}

function toShortDateLabel(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getDefaultDates(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 6);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

function buildLinePoints(
  daily: DailyAnalyticsPoint[],
  width: number,
  height: number,
): {
  areaPath: string;
  linePath: string;
  maxSales: number;
  points: ChartPoint[];
  yTicks: number[];
} {
  if (daily.length === 0) {
    return {
      points: [],
      linePath: "",
      areaPath: "",
      maxSales: 1,
      yTicks: [0, 0.25, 0.5, 0.75, 1],
    };
  }

  const maxSales = Math.max(...daily.map((day) => day.sales), 1);
  const points = daily.map((day, index) => {
    const x = daily.length === 1 ? width / 2 : (index / (daily.length - 1)) * width;
    const y = height - (day.sales / maxSales) * height;
    return {
      x,
      y,
      sales: day.sales,
      orders: day.orders,
      averageTicket: day.averageTicket,
      date: day.date,
      label: toShortDateLabel(day.date),
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? width} ${height} L ${points[0]?.x ?? 0} ${height} Z`;

  return {
    points,
    linePath,
    areaPath,
    maxSales,
    yTicks: [0, 0.25, 0.5, 0.75, 1],
  };
}

async function fetchAnalytics(
  accessToken: string,
  businessId: string | null,
  from: string,
  to: string,
  timezone: string,
): Promise<AnalyticsResponse> {
  const apiBaseUrl = getApiBaseUrl();
  const endpoint = `${apiBaseUrl}/analytics/orders/sales?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&timezone=${encodeURIComponent(timezone)}`;
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(businessId ? { "x-business-id": businessId } : {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & Partial<AnalyticsResponse>;

  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }

  return {
    from: String(payload.from ?? from),
    to: String(payload.to ?? to),
    timezone: String(payload.timezone ?? timezone),
    summary: {
      totalSales: Number(payload.summary?.totalSales ?? 0),
      totalOrders: Number(payload.summary?.totalOrders ?? 0),
      averageTicket: Number(payload.summary?.averageTicket ?? 0),
    },
    daily: Array.isArray(payload.daily)
      ? payload.daily.map((day) => ({
          date: String(day.date),
          sales: Number(day.sales ?? 0),
          orders: Number(day.orders ?? 0),
          averageTicket: Number(day.averageTicket ?? 0),
        }))
      : [],
  };
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = readBusinessIdFromCookieStore(cookieStore);

  if (!accessToken) {
    redirect("/login");
  }

  const defaults = getDefaultDates();
  const from = resolvedSearchParams.from?.trim() || defaults.from;
  const to = resolvedSearchParams.to?.trim() || defaults.to;
  const timezone = "America/New_York";

  let data: AnalyticsResponse | null = null;
  let errorMessage: string | null = null;

  try {
    data = await fetchAnalytics(accessToken, businessId, from, to, timezone);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Could not load analytics";
  }

  const chartWidth = 860;
  const chartHeight = 260;
  const lineChart = buildLinePoints(data?.daily ?? [], chartWidth, chartHeight);
  const maxAverageTicket = Math.max(...(data?.daily.map((day) => day.averageTicket) ?? [0]), 1);

  return (
    <div className="">
      <PageHeader title="Sales" />
      <AnalyticsControlBar from={from} to={to} />

      {errorMessage ? (
        <p className="sales-channel-feedback is-error">{errorMessage}</p>
      ) : null}

      {data ? (
        <>
          <div className="grid grid-cols-3 gap-2.5 mt-3.5">
            <AnalyticsCard
              label="Total Sales"
              value={data.summary.totalSales / 100}
              format="currency"
              sparkData={data.daily.map((d) => d.sales / 100)}
            />
            <AnalyticsCard
              label="Orders"
              value={data.summary.totalOrders}
              format="integer"
              sparkData={data.daily.map((d) => d.orders)}
            />
            <AnalyticsCard
              label="Average Ticket"
              value={data.summary.averageTicket / 100}
              format="currency2"
              sparkData={data.daily.map((d) => d.averageTicket / 100)}
            />
          </div>

          <section className="analytics-card">
            <h2 className="sales-channel-subtitle">Sales trend</h2>
            <p className="sales-channel-muted">
              Daily total sales for the selected date range.
            </p>
            <div className="analytics-line-wrap">
              {lineChart.points.length === 0 ? (
                <p className="sales-channel-muted">No chart data in this range.</p>
              ) : (
                <div className="analytics-line-chart-shell">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="analytics-line-chart"
                    role="img"
                    aria-label="Sales trend chart"
                  >
                    <defs>
                      <linearGradient id="analytics-sales-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0f766e" stopOpacity="0.34" />
                        <stop offset="100%" stopColor="#0f766e" stopOpacity="0.04" />
                      </linearGradient>
                    </defs>

                    {lineChart.yTicks.map((tick, index) => {
                      const y = chartHeight - tick * chartHeight;
                      return (
                        <line
                          key={`grid-${index}`}
                          x1={0}
                          x2={chartWidth}
                          y1={y}
                          y2={y}
                          stroke="#dbeafe"
                          strokeWidth="1"
                        />
                      );
                    })}

                    <path d={lineChart.areaPath} fill="url(#analytics-sales-area)" />
                    <path
                      d={lineChart.linePath}
                      fill="none"
                      stroke="#0f766e"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {lineChart.points.map((point) => (
                      <g key={point.date}>
                        <title>
                          {`${point.date} • Sales ${formatCents(point.sales)} • Orders ${point.orders}`}
                        </title>
                        <circle cx={point.x} cy={point.y} r="4.5" fill="#0f766e" />
                        <circle cx={point.x} cy={point.y} r="9" fill="#0f766e22" />
                      </g>
                    ))}
                  </svg>

                  <div className="analytics-line-labels">
                    {lineChart.points.map((point) => (
                      <div key={`label-${point.date}`} className="analytics-x-label">
                        {point.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="analytics-card">
            <h2 className="sales-channel-subtitle">Average ticket by date</h2>
            <p className="sales-channel-muted">
              Ticket evolution with daily order volume context.
            </p>
            <div className="analytics-bars">
              {data.daily.map((day) => {
                const heightPercent = Math.max(
                  6,
                  Math.round((day.averageTicket / maxAverageTicket) * 100),
                );
                return (
                  <div key={`avg-${day.date}`} className="analytics-bar-col">
                    <p className="analytics-bar-value">{formatCents(day.averageTicket)}</p>
                    <div className="analytics-bar-track">
                      <div
                        className="analytics-bar-fill"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <p className="analytics-x-label">{toShortDateLabel(day.date)}</p>
                    <p className="analytics-bar-orders">{day.orders} orders</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="analytics-card">
            <h2 className="sales-channel-subtitle">Sales by Date</h2>
            <div className="analytics-table-wrap">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Sales</th>
                    <th>Orders</th>
                    <th>Avg Ticket</th>
                  </tr>
                </thead>
                <tbody>
                  {data.daily.map((day) => (
                    <tr key={day.date}>
                      <td>{day.date}</td>
                      <td>{formatCents(day.sales)}</td>
                      <td>{day.orders}</td>
                      <td>{formatCents(day.averageTicket)}</td>
                    </tr>
                  ))}
                  {data.daily.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No orders in this date range.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
