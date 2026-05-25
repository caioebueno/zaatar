import { InvalidAnalyticsRangeError } from "../errors/InvalidAnalyticsRangeError.js";
import type {
  AnalyticsRepository,
  OrderSalesDailyPoint,
} from "../ports/AnalyticsRepository.js";

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

    const rows = await this.repository.getOrderSalesByDateRange({
      businessId,
      from,
      to,
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
      startDate: from,
      endDate: to,
      from,
      to,
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
  const now = new Date();
  const to = new Date(now);
  to.setUTCHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setDate(from.getDate() - 6);
  from.setUTCHours(0, 0, 0, 0);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
