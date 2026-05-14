import { InvalidAnalyticsRangeError } from "../errors/InvalidAnalyticsRangeError.js";
import type {
  AnalyticsRepository,
  OrderSalesDailyPoint,
} from "../ports/AnalyticsRepository.js";

export type GetOrderSalesAnalyticsInput = {
  from?: string;
  timezone?: string;
  to?: string;
};

export type GetOrderSalesAnalyticsOutput = {
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
  timezone: string;
  to: string;
};

export class GetOrderSalesAnalyticsUseCase {
  constructor(private readonly repository: AnalyticsRepository) {}

  async execute(
    input: GetOrderSalesAnalyticsInput,
  ): Promise<GetOrderSalesAnalyticsOutput> {
    const defaults = getDefaultDateRange();
    const from = (input.from ?? "").trim() || defaults.from;
    const to = (input.to ?? "").trim() || defaults.to;
    const timezone = (input.timezone ?? "").trim() || "America/New_York";

    if (!isValidDateOnly(from)) {
      throw new InvalidAnalyticsRangeError(
        "from",
        "from must be YYYY-MM-DD",
      );
    }
    if (!isValidDateOnly(to)) {
      throw new InvalidAnalyticsRangeError("to", "to must be YYYY-MM-DD");
    }
    if (from > to) {
      throw new InvalidAnalyticsRangeError(
        "dateRange",
        "from must be less than or equal to to",
      );
    }

    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T00:00:00.000Z`);
    const diffDays = Math.floor(
      (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (diffDays > 366) {
      throw new InvalidAnalyticsRangeError(
        "dateRange",
        "Date range too large. Max 367 days.",
      );
    }

    const rows = await this.repository.getOrderSalesByDateRange({
      from,
      to,
      timezone,
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
      from,
      to,
      timezone,
      summary: {
        totalSales,
        totalOrders,
        averageTicket,
      },
      daily,
    };
  }
}

function isValidDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function getDefaultDateRange(): { from: string; to: string } {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);
  from.setDate(from.getDate() - 6);
  return {
    from: toDateOnly(from),
    to: toDateOnly(to),
  };
}
