export type OrderSalesDailyPoint = {
  date: string;
  orders: number;
  sales: number;
};

export type OrderSalesRangeQuery = {
  from: string;
  timezone: string;
  to: string;
};

export interface AnalyticsRepository {
  getOrderSalesByDateRange(
    query: OrderSalesRangeQuery,
  ): Promise<OrderSalesDailyPoint[]>;
}
