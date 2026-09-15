import type { AnalyticsRepository } from "../ports/AnalyticsRepository.js";
import type {
  AnalyticsMetricBucket,
  AnalyticsMetricBarChartOutput,
  AnalyticsV1Input,
} from "./shared/v1BarChartAnalytics.js";
import {
  buildAnalyticsMetricOutput,
  buildAnalyticsValueBuckets,
  validateAnalyticsV1Input,
} from "./shared/v1BarChartAnalytics.js";

export type GetRevenueAnalyticsInput = AnalyticsV1Input;
type RevenueAnalyticsBucket = AnalyticsMetricBucket & {
  deliveryFee: number;
  sales: number;
  tax: number;
  tip: number;
  total: number;
};

export type GetRevenueAnalyticsOutput = Omit<
  AnalyticsMetricBarChartOutput<"revenue">,
  "buckets" | "summary"
> & {
  buckets: RevenueAnalyticsBucket[];
  summary: AnalyticsMetricBarChartOutput<"revenue">["summary"] & {
    deliveryFee: number;
    sales: number;
    tax: number;
    tip: number;
  };
};

export class GetRevenueAnalyticsUseCase {
  constructor(private readonly repository: AnalyticsRepository) {}

  async execute(input: GetRevenueAnalyticsInput): Promise<GetRevenueAnalyticsOutput> {
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
      getValue: (row) => row.total,
    });
    const comparisonTotal = compareRows?.reduce((sum, row) => sum + row.total, 0);
    const totals = currentRows.reduce(
      (sum, row) => ({
        sales: sum.sales + row.sales,
        tax: sum.tax + row.tax,
        tip: sum.tip + row.tip,
        deliveryFee: sum.deliveryFee + row.deliveryFee,
      }),
      { sales: 0, tax: 0, tip: 0, deliveryFee: 0 },
    );
    const output = buildAnalyticsMetricOutput({
      metric: "revenue",
      timezone: validated.timezone,
      startDate: validated.startDate,
      endDate: validated.endDate,
      compareRange: validated.compareRange,
      compareTotal: comparisonTotal,
      buckets,
    });

    return {
      ...output,
      buckets: output.buckets.map((bucket, index) => {
        const row = currentRows[index]!;
        return {
          ...bucket,
          sales: row.sales,
          tax: row.tax,
          tip: row.tip,
          deliveryFee: row.deliveryFee,
          total: row.total,
        };
      }),
      summary: { ...output.summary, ...totals },
    };
  }
}
