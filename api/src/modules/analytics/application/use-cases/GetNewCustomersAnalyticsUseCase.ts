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

export type GetNewCustomersAnalyticsInput = AnalyticsV1Input;
export type GetNewCustomersAnalyticsOutput =
  AnalyticsMetricBarChartOutput<"newCustomers">;

export class GetNewCustomersAnalyticsUseCase {
  constructor(private readonly repository: AnalyticsRepository) {}

  async execute(
    input: GetNewCustomersAnalyticsInput,
  ): Promise<GetNewCustomersAnalyticsOutput> {
    const validated = validateAnalyticsV1Input(input);

    const [currentRows, compareRows] = await Promise.all([
      this.repository.getNewCustomersByDateRange({
        businessId: validated.businessId,
        startDate: validated.startDate,
        endDate: validated.endDate,
        timezone: validated.timezone,
      }),
      validated.compareRange
        ? this.repository.getNewCustomersByDateRange({
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
      getValue: (row) => row.customers,
    });
    const comparisonTotal = compareRows?.reduce((sum, row) => sum + row.customers, 0);

    return buildAnalyticsMetricOutput({
      metric: "newCustomers",
      timezone: validated.timezone,
      startDate: validated.startDate,
      endDate: validated.endDate,
      compareRange: validated.compareRange,
      compareTotal: comparisonTotal,
      buckets,
    });
  }
}
