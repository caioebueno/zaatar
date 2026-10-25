import type {
  AnalyticsChannelBreakdown,
  AnalyticsRepository,
} from "../ports/AnalyticsRepository.js";
import type { AnalyticsV1Input, AnalyticsMetricBarChartOutput } from "./shared/v1BarChartAnalytics.js";
import {
  buildAnalyticsMetricOutput,
  buildAnalyticsValueBuckets,
  validateAnalyticsV1Input,
} from "./shared/v1BarChartAnalytics.js";

export type GetOrderQuantityAnalyticsInput = AnalyticsV1Input;
type OrderQuantityAnalyticsBucket =
  AnalyticsMetricBarChartOutput<"orderQuantity">["buckets"][number] & {
    channels: AnalyticsChannelBreakdown;
  };

export type GetOrderQuantityAnalyticsOutput = Omit<
  AnalyticsMetricBarChartOutput<"orderQuantity">,
  "buckets" | "summary"
> & {
  buckets: OrderQuantityAnalyticsBucket[];
  summary: AnalyticsMetricBarChartOutput<"orderQuantity">["summary"] & {
    channels: AnalyticsChannelBreakdown;
  };
};

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
    const channelTotals = currentRows.reduce<AnalyticsChannelBreakdown>(
      (sum, row) => ({
        website: sum.website + row.channels.website,
        doordash: sum.doordash + row.channels.doordash,
        uberEats: sum.uberEats + row.channels.uberEats,
        square: sum.square + row.channels.square,
      }),
      { website: 0, doordash: 0, uberEats: 0, square: 0 },
    );

    const output = buildAnalyticsMetricOutput({
      metric: "orderQuantity",
      timezone: validated.timezone,
      startDate: validated.startDate,
      endDate: validated.endDate,
      compareRange: validated.compareRange,
      compareTotal: comparisonTotal,
      buckets,
    });

    return {
      ...output,
      buckets: output.buckets.map((bucket, index) => ({
        ...bucket,
        channels: currentRows[index]!.channels,
      })),
      summary: { ...output.summary, channels: channelTotals },
    };
  }
}
