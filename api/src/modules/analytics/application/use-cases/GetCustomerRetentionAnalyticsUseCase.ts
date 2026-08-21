import type {
  AnalyticsRepository,
  CustomerRetentionCustomerPoint,
} from "../ports/AnalyticsRepository.js";
import type { AnalyticsV1Input } from "./shared/v1BarChartAnalytics.js";
import { roundToTwoDecimals, validateAnalyticsV1Input } from "./shared/v1BarChartAnalytics.js";

export type GetCustomerRetentionAnalyticsInput = AnalyticsV1Input;

export type GetCustomerRetentionAnalyticsOutput = {
  chartType: "mixed";
  comparison?: {
    activeCustomerCount: number;
    endDate: string;
    startDate: string;
  };
  metric: "customerRetention";
  newVsReturningPerDay: Array<{
    compareNewCustomerCount?: number | null;
    compareNewCustomerShare?: number | null;
    compareReturningCustomerCount?: number | null;
    compareReturningCustomerShare?: number | null;
    compareTotalCustomerCount?: number | null;
    endDate: string;
    key: string;
    label: string;
    newCustomerCount: number;
    newCustomerShare: number | null;
    returningCustomerCount: number;
    returningCustomerShare: number | null;
    startDate: string;
    totalCustomerCount: number;
  }>;
  orderQuantityBuckets: Array<{
    compareCustomerCount?: number | null;
    delta?: number | null;
    deltaPercentage?: number | null;
    key: "0" | "1" | "2-4" | "5-8" | "+8";
    label: string;
    customerCount: number;
  }>;
  range: {
    endDate: string;
    startDate: string;
  };
  summary: {
    activeCustomerCount: number;
    lostCustomers: number;
    wonCustomers: number | null;
  };
  timezone: string;
};

const ORDER_BUCKETS = [
  { key: "0", label: "0 orders", matches: (value: number) => value === 0 },
  { key: "1", label: "1 order", matches: (value: number) => value === 1 },
  { key: "2-4", label: "2-4 orders", matches: (value: number) => value >= 2 && value <= 4 },
  { key: "5-8", label: "5-8 orders", matches: (value: number) => value >= 5 && value <= 8 },
  { key: "+8", label: "+8 orders", matches: (value: number) => value >= 9 },
] as const;

export class GetCustomerRetentionAnalyticsUseCase {
  constructor(private readonly repository: AnalyticsRepository) {}

  async execute(
    input: GetCustomerRetentionAnalyticsInput,
  ): Promise<GetCustomerRetentionAnalyticsOutput> {
    const validated = validateAnalyticsV1Input(input);

    const [customerRows, currentDailyRows, compareDailyRows] = await Promise.all([
      this.repository.getCustomerRetentionCustomers({
        businessId: validated.businessId,
        startDate: validated.startDate,
        endDate: validated.endDate,
        compareStartDate: validated.compareRange?.startDate,
        compareEndDate: validated.compareRange?.endDate,
      }),
      this.repository.getCustomerRetentionDailyByDateRange({
        businessId: validated.businessId,
        startDate: validated.startDate,
        endDate: validated.endDate,
        timezone: validated.timezone,
      }),
      validated.compareRange
        ? this.repository.getCustomerRetentionDailyByDateRange({
            businessId: validated.businessId,
            startDate: validated.compareRange.startDate,
            endDate: validated.compareRange.endDate,
            timezone: validated.timezone,
          })
        : Promise.resolve(undefined),
    ]);

    const currentEnd = new Date(validated.endDate).getTime();
    const currentUniverse = customerRows.filter(
      (row) => row.firstOrderAt.getTime() <= currentEnd,
    );
    const compareEnd = validated.compareRange
      ? new Date(validated.compareRange.endDate).getTime()
      : undefined;
    const compareUniverse =
      compareEnd === undefined
        ? undefined
        : customerRows.filter((row) => row.firstOrderAt.getTime() <= compareEnd);
    const lostCustomerCutoff = new Date(validated.endDate);
    lostCustomerCutoff.setUTCDate(lostCustomerCutoff.getUTCDate() - 45);
    const lostCustomerCutoffTime = lostCustomerCutoff.getTime();

    const activeCustomerCount = currentUniverse.filter((row) => row.currentOrders > 0).length;
    const compareActiveCustomerCount = compareUniverse?.filter(
      (row) => row.compareOrders > 0,
    ).length;
    const wonCustomers =
      compareUniverse === undefined
        ? null
        : currentUniverse.filter((row) => row.currentOrders > 0 && row.compareOrders === 0)
            .length;
    const lostCustomers = currentUniverse.filter(
      (row) => row.lastOrderAt.getTime() <= lostCustomerCutoffTime,
    ).length;

    const orderQuantityBuckets = ORDER_BUCKETS.map((bucket) => {
      const customerCount = currentUniverse.filter((row) =>
        bucket.matches(row.currentOrders),
      ).length;
      const compareCustomerCount =
        compareUniverse === undefined
          ? null
          : compareUniverse.filter((row) => bucket.matches(row.compareOrders)).length;
      const delta =
        compareCustomerCount === null ? null : customerCount - compareCustomerCount;
      const deltaPercentage =
        compareCustomerCount === null || compareCustomerCount === 0 || delta === null
          ? null
          : roundToTwoDecimals((delta / compareCustomerCount) * 100);

      return {
        key: bucket.key,
        label: bucket.label,
        customerCount,
        ...(compareUniverse ? { compareCustomerCount } : {}),
        ...(compareUniverse ? { delta } : {}),
        ...(compareUniverse ? { deltaPercentage } : {}),
      };
    });

    const newVsReturningPerDay = currentDailyRows.map((row, index) => {
      const totalCustomerCount = row.newCustomers + row.returningCustomers;
      const newCustomerShare =
        totalCustomerCount > 0
          ? roundToTwoDecimals((row.newCustomers / totalCustomerCount) * 100)
          : null;
      const returningCustomerShare =
        totalCustomerCount > 0
          ? roundToTwoDecimals((row.returningCustomers / totalCustomerCount) * 100)
          : null;

      const compareRow = compareDailyRows?.[index];
      const compareTotalCustomerCount = compareRow
        ? compareRow.newCustomers + compareRow.returningCustomers
        : null;
      const compareNewCustomerShare =
        compareTotalCustomerCount && compareTotalCustomerCount > 0
          ? roundToTwoDecimals((compareRow!.newCustomers / compareTotalCustomerCount) * 100)
          : null;
      const compareReturningCustomerShare =
        compareTotalCustomerCount && compareTotalCustomerCount > 0
          ? roundToTwoDecimals(
              (compareRow!.returningCustomers / compareTotalCustomerCount) * 100,
            )
          : null;

      return {
        key: row.key,
        label: formatDayLabel(row.bucketStartAt, validated.timezone),
        startDate: row.bucketStartAt.toISOString(),
        endDate: row.bucketEndAt.toISOString(),
        newCustomerCount: row.newCustomers,
        returningCustomerCount: row.returningCustomers,
        totalCustomerCount,
        newCustomerShare,
        returningCustomerShare,
        ...(compareDailyRows
          ? {
              compareNewCustomerCount: compareRow?.newCustomers ?? null,
              compareReturningCustomerCount: compareRow?.returningCustomers ?? null,
              compareTotalCustomerCount,
              compareNewCustomerShare,
              compareReturningCustomerShare,
            }
          : {}),
      };
    });

    return {
      metric: "customerRetention",
      chartType: "mixed",
      timezone: validated.timezone,
      range: {
        startDate: validated.startDate,
        endDate: validated.endDate,
      },
      ...(validated.compareRange && compareActiveCustomerCount !== undefined
        ? {
            comparison: {
              startDate: validated.compareRange.startDate,
              endDate: validated.compareRange.endDate,
              activeCustomerCount: compareActiveCustomerCount,
            },
          }
        : {}),
      summary: {
        activeCustomerCount,
        wonCustomers,
        lostCustomers,
      },
      orderQuantityBuckets,
      newVsReturningPerDay,
    };
  }
}

function formatDayLabel(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
  }).format(date);
}
