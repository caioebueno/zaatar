export type OrderSalesDailyPoint = {
  date: string;
  orders: number;
  sales: number;
};

export type AnalyticsBucketPointBase = {
  bucketEndAt: Date;
  bucketStartAt: Date;
  key: string;
};

/**
 * Split of a bucket across sales channels, from `Order.sourcePlatform`.
 * `website` covers FOODY, UNKNOWN and rows predating the column, so the four
 * values always sum to the bucket's own total.
 */
export type AnalyticsChannelBreakdown = {
  doordash: number;
  square: number;
  uberEats: number;
  website: number;
};

export type OrderQuantityBucketPoint = AnalyticsBucketPointBase & {
  channels: AnalyticsChannelBreakdown;
  orders: number;
};

export type RevenueBucketPoint = AnalyticsBucketPointBase & {
  channels: AnalyticsChannelBreakdown;
  deliveryFee: number;
  orders: number;
  sales: number;
  tax: number;
  tip: number;
  total: number;
};

export type NewCustomersBucketPoint = AnalyticsBucketPointBase & {
  customers: number;
};

export type CustomerRetentionCustomerPoint = {
  compareOrders: number;
  currentOrders: number;
  customerId: string;
  firstOrderAt: Date;
  lastOrderAt: Date;
};

export type CustomerRetentionDailyPoint = AnalyticsBucketPointBase & {
  newCustomers: number;
  returningCustomers: number;
};

export type OrderSalesRangeQuery = {
  businessId: string;
  from: string;
  to: string;
  timezone: string;
};

export type AnalyticsDateRangeQuery = {
  businessId: string;
  endDate: string;
  startDate: string;
  timezone: string;
};

export type CustomerRetentionCustomersQuery = {
  businessId: string;
  compareEndDate?: string;
  compareStartDate?: string;
  endDate: string;
  startDate: string;
};

export interface AnalyticsRepository {
  getCustomerRetentionCustomers(
    query: CustomerRetentionCustomersQuery,
  ): Promise<CustomerRetentionCustomerPoint[]>;
  getCustomerRetentionDailyByDateRange(
    query: AnalyticsDateRangeQuery,
  ): Promise<CustomerRetentionDailyPoint[]>;
  getNewCustomersByDateRange(
    query: AnalyticsDateRangeQuery,
  ): Promise<NewCustomersBucketPoint[]>;
  getOrderQuantityByDateRange(
    query: AnalyticsDateRangeQuery,
  ): Promise<OrderQuantityBucketPoint[]>;
  getOrderSalesByDateRange(
    query: OrderSalesRangeQuery,
  ): Promise<OrderSalesDailyPoint[]>;
  getRevenueByDateRange(
    query: AnalyticsDateRangeQuery,
  ): Promise<RevenueBucketPoint[]>;
}
