import type { AnalyticsRepository } from "../ports/AnalyticsRepository.js";
import type {
  AnalyticsMetricBarChartOutput,
  AnalyticsV1Input,
} from "./shared/v1BarChartAnalytics.js";
import {
  buildAnalyticsValueBuckets,
  roundToTwoDecimals,
  validateAnalyticsV1Input,
} from "./shared/v1BarChartAnalytics.js";

export type GetAverageTicketAnalyticsInput = AnalyticsV1Input;
export type GetAverageTicketAnalyticsOutput =
  AnalyticsMetricBarChartOutput<"averageTicket">;

export class GetAverageTicketAnalyticsUseCase {
  constructor(private readonly repository: AnalyticsRepository) {}

  async execute(
    input: GetAverageTicketAnalyticsInput,
  ): Promise<GetAverageTicketAnalyticsOutput> {
    const validated = validateAnalyticsV1Input(input);

    const [currentRows, compareRows] = await Promise.all([
      this.repository.getRevenueByDateRange({
        businessId: validated.businessId,
        startDate: validated.startDate,
        endDate: validated.endDate,
        timezone: validated.timezone,
      }),
      validated.compareRange
        ? this.repository.getRevenueByDateRange({
            businessId: validated.businessId,
            startDate: validated.compareRange.startDate,
            endDate: validated.compareRange.endDate,
            timezone: validated.timezone,
          })
        : Promise.resolve(undefined),
    ]);

    const buckets = buildAnalyticsValueBuckets({
      currentRows,
      compareRows,
      timezone: validated.timezone,
      getValue: (row) => (row.orders > 0 ? Math.round(row.sales / row.orders) : 0),
    });

    const totalRevenue = currentRows.reduce((sum, row) => sum + row.sales, 0);
    const totalOrders = currentRows.reduce((sum, row) => sum + row.orders, 0);
    const total = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const averagePerBucket =
      buckets.length > 0
        ? roundToTwoDecimals(
            buckets.reduce((sum, bucket) => sum + bucket.value, 0) / buckets.length,
          )
        : 0;
    const maxBucketValue =
      buckets.length > 0
        ? Math.max(...buckets.map((bucket) => bucket.value))
        : 0;

    const compareTotalRevenue = compareRows?.reduce((sum, row) => sum + row.sales, 0);
    const compareTotalOrders = compareRows?.reduce((sum, row) => sum + row.orders, 0);
    const comparisonTotal =
      compareRows && compareTotalRevenue !== undefined && compareTotalOrders !== undefined
        ? compareTotalOrders > 0
          ? Math.round(compareTotalRevenue / compareTotalOrders)
          : 0
        : undefined;
    const comparisonDelta =
      comparisonTotal === undefined ? undefined : total - comparisonTotal;
    const comparisonDeltaPercentage =
      comparisonTotal === undefined || comparisonTotal === 0
        ? null
        : roundToTwoDecimals(((comparisonDelta ?? 0) / comparisonTotal) * 100);

    return {
      metric: "averageTicket",
      chartType: "bar",
      granularity: "day",
      timezone: validated.timezone,
      range: {
        startDate: validated.startDate,
        endDate: validated.endDate,
      },
      ...(validated.compareRange && comparisonTotal !== undefined
        ? {
            comparison: {
              startDate: validated.compareRange.startDate,
              endDate: validated.compareRange.endDate,
              total: comparisonTotal,
              delta: comparisonDelta ?? 0,
              deltaPercentage: comparisonDeltaPercentage,
            },
          }
        : {}),
      summary: {
        total,
        averagePerBucket,
        maxBucketValue,
      },
      buckets,
    };
  }
}
