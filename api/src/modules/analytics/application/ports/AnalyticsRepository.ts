export type OrderSalesDailyPoint = {
  date: string;
  orders: number;
  sales: number;
};

export type OrderSalesRangeQuery = {
  businessId: string;
  from: string;
  timezone: string;
  to: string;
};

export interface AnalyticsRepository {
  getOrderSalesByDateRange(
    query: OrderSalesRangeQuery,
  ): Promise<OrderSalesDailyPoint[]>;
}
