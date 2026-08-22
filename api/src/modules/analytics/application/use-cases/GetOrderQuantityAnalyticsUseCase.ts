import type {
  AnalyticsRepository,
} from "../ports/AnalyticsRepository.js";
import type { AnalyticsV1Input, AnalyticsMetricBarChartOutput } from "./shared/v1BarChartAnalytics.js";
import {
  buildAnalyticsMetricOutput,
  buildAnalyticsValueBuckets,
  validateAnalyticsV1Input,
} from "./shared/v1BarChartAnalytics.js";

export type GetOrderQuantityAnalyticsInput = AnalyticsV1Input;
export type GetOrderQuantityAnalyticsOutput =
  AnalyticsMetricBarChartOutput<"orderQuantity">;

export class GetOrderQuantityAnalyticsUseCase {
  constructor(private readonly repository: AnalyticsRepository) {}

  async execute(
    input: GetOrderQuantityAnalyticsInput,
  ): Promise<GetOrderQuantityAnalyticsOutput> {
    const validated = validateAnalyticsV1Input(input);

    const [currentRows, compareRows] = await Promise.all([
      this.repository.getOrderQuantityByDateRange({
        businessId: validated.businessId,
        startDate: validated.startDate,
        endDate: validated.endDate,
        timezone: validated.timezone,
      }),
      validated.compareRange
        ? this.repository.getOrderQuantityByDateRange({
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
      getValue: (row) => row.orders,
    });
    const comparisonTotal = compareRows?.reduce((sum, row) => sum + row.orders, 0);

    return buildAnalyticsMetricOutput({
      metric: "orderQuantity",
      timezone: validated.timezone,
      startDate: validated.startDate,
      endDate: validated.endDate,
      compareRange: validated.compareRange,
      compareTotal: comparisonTotal,
      buckets,
    });
  }
}
