import type { AnalyticsRepository } from "../ports/AnalyticsRepository.js";
import type {
  AnalyticsMetricBarChartOutput,
  AnalyticsV1Input,
} from "./shared/v1BarChartAnalytics.js";
import {
  buildAnalyticsMetricOutput,
  buildAnalyticsValueBuckets,
  validateAnalyticsV1Input,
} from "./shared/v1BarChartAnalytics.js";

export type GetRevenueAnalyticsInput = AnalyticsV1Input;
export type GetRevenueAnalyticsOutput = AnalyticsMetricBarChartOutput<"revenue">;

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
      getValue: (row) => row.sales,
    });
    const comparisonTotal = compareRows?.reduce((sum, row) => sum + row.sales, 0);

    return buildAnalyticsMetricOutput({
      metric: "revenue",
      timezone: validated.timezone,
      startDate: validated.startDate,
      endDate: validated.endDate,
      compareRange: validated.compareRange,
      compareTotal: comparisonTotal,
      buckets,
    });
  }
}
