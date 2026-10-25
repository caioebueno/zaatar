import { InvalidAnalyticsRangeError } from "../errors/InvalidAnalyticsRangeError.js";
import type {
  AnalyticsRepository,
  OrderSalesDailyPoint,
} from "../ports/AnalyticsRepository.js";

const ORLANDO_TIMEZONE = "America/New_York";

export type GetOrderSalesAnalyticsInput = {
  businessId?: string;
  endDate?: string;
  from?: string;
  startDate?: string;
  start?: string;
  end?: string;
  to?: string;
};

export type GetOrderSalesAnalyticsOutput = {
  endDate: string;
  evolucaoReceita: Array<{
    date: string;
    receita: number;
  }>;
  receitaTotal: number;
  startDate: string;
  ticketMedio: number;
  totalPedidos: number;
  volumePedidos: Array<{
    date: string;
    pedidos: number;
  }>;
  daily: Array<{
    averageTicket: number;
    date: string;
    orders: number;
    sales: number;
  }>;
  from: string;
  summary: {
    averageTicket: number;
    totalOrders: number;
    totalSales: number;
  };
  to: string;
};

export class GetOrderSalesAnalyticsUseCase {
  constructor(private readonly repository: AnalyticsRepository) {}

  async execute(
    input: GetOrderSalesAnalyticsInput,
  ): Promise<GetOrderSalesAnalyticsOutput> {
    const businessId = (input.businessId ?? "").trim();
    if (!businessId) {
      throw new InvalidAnalyticsRangeError("businessId", "businessId is required");
    }

    const defaults = getDefaultDateRange();
    const from =
      (input.startDate ?? input.start ?? input.from ?? "").trim() || defaults.from;
    const to = (input.endDate ?? input.end ?? input.to ?? "").trim() || defaults.to;

    if (!isValidDateTime(from)) {
      throw new InvalidAnalyticsRangeError(
        "from",
        "from must be full datetime (ISO-8601)",
      );
    }
    if (!isValidDateTime(to)) {
      throw new InvalidAnalyticsRangeError(
        "to",
        "to must be full datetime (ISO-8601)",
      );
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (fromDate.getTime() > toDate.getTime()) {
      throw new InvalidAnalyticsRangeError(
        "dateRange",
        "from must be less than or equal to to",
      );
    }

    const diffDays = Math.floor(
      (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (diffDays > 366) {
      throw new InvalidAnalyticsRangeError(
        "dateRange",
        "Date range too large. Max 367 days.",
      );
    }

    // Analytics date pickers send calendar dates. Treat their YYYY-MM-DD parts
    // as Orlando calendar days rather than UTC days, including DST changes.
    const normalizedFrom = getOrlandoDayBoundary(from, "start");
    const normalizedTo = getOrlandoDayBoundary(to, "end");

    const rows = await this.repository.getOrderSalesByDateRange({
      businessId,
      from: normalizedFrom,
      to: normalizedTo,
      timezone: ORLANDO_TIMEZONE,
    });

    const daily = rows.map((row: OrderSalesDailyPoint) => ({
      date: row.date,
      sales: row.sales,
      orders: row.orders,
      averageTicket: row.orders > 0 ? Math.round(row.sales / row.orders) : 0,
    }));

    const totalSales = daily.reduce((sum, day) => sum + day.sales, 0);
    const totalOrders = daily.reduce((sum, day) => sum + day.orders, 0);
    const averageTicket = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    return {
      startDate: normalizedFrom,
      endDate: normalizedTo,
      from: normalizedFrom,
      to: normalizedTo,
      summary: {
        totalSales,
        totalOrders,
        averageTicket,
      },
      daily,
      receitaTotal: totalSales,
      ticketMedio: averageTicket,
      totalPedidos: totalOrders,
      evolucaoReceita: daily.map((item) => ({
        date: item.date,
        receita: item.sales,
      })),
      volumePedidos: daily.map((item) => ({
        date: item.date,
        pedidos: item.orders,
      })),
    };
  }
}

function getOrlandoDayBoundary(
  value: string,
  boundary: "start" | "end",
): string {
  const matched = /^(\d{4})-(\d{2})-(\d{2})T/.exec(value);
  if (!matched) {
    throw new InvalidAnalyticsRangeError("dateRange", "Invalid date range");
  }

  const year = Number(matched[1]);
  const month = Number(matched[2]);
  const day = Number(matched[3]);
  const hour = boundary === "start" ? 0 : 23;
  const minute = boundary === "start" ? 0 : 59;
  const second = boundary === "start" ? 0 : 59;
  const millisecond = boundary === "start" ? 0 : 999;
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  let instant = targetUtc;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ORLANDO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  // Two passes cover both daylight-saving offsets and ordinary dates.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = formatter.formatToParts(new Date(instant));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((item) => item.type === type)?.value ?? "0");
    const localAsUtc = Date.UTC(
      part("year"),
      part("month") - 1,
      part("day"),
      part("hour"),
      part("minute"),
      part("second"),
      new Date(instant).getUTCMilliseconds(),
    );
    instant = targetUtc - (localAsUtc - instant);
  }

  return new Date(instant).toISOString();
}

function isValidDateTime(value: string): boolean {
  if (!value.includes("T")) {
    return false;
  }
  if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function getDefaultDateRange(): { from: string; to: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ORLANDO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const lastDay = new Date(Date.UTC(year, month - 1, day));
  const firstDay = new Date(lastDay);
  firstDay.setUTCDate(firstDay.getUTCDate() - 6);
  return {
    from: getOrlandoDayBoundary(firstDay.toISOString(), "start"),
    to: getOrlandoDayBoundary(lastDay.toISOString(), "end"),
  };
}
