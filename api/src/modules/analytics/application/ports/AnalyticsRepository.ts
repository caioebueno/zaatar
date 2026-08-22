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

export type OrderQuantityBucketPoint = AnalyticsBucketPointBase & {
  orders: number;
};

export type RevenueBucketPoint = AnalyticsBucketPointBase & {
  orders: number;
  sales: number;
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
