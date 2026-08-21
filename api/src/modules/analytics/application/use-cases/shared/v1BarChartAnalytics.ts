import { InvalidAnalyticsRangeError } from "../../errors/InvalidAnalyticsRangeError.js";

export type AnalyticsV1Input = {
  businessId?: string;
  compareStartDate?: string;
  endDate?: string;
  startDate?: string;
  timezone?: string;
};

export type AnalyticsComparisonRange = {
  endDate: string;
  startDate: string;
};

export type AnalyticsMetricBucket = {
  compareValue?: number | null;
  delta?: number | null;
  deltaPercentage?: number | null;
  endDate: string;
  key: string;
  label: string;
  startDate: string;
  value: number;
};

export type AnalyticsMetricBarChartOutput<TMetric extends string> = {
  buckets: AnalyticsMetricBucket[];
  chartType: "bar";
  comparison?: {
    delta: number;
    deltaPercentage: number | null;
    endDate: string;
    startDate: string;
    total: number;
  };
  granularity: "day";
  metric: TMetric;
  range: {
    endDate: string;
    startDate: string;
  };
  summary: {
    averagePerBucket: number;
    maxBucketValue: number;
    total: number;
  };
  timezone: string;
};

export type AnalyticsBucketRowBase = {
  bucketEndAt: Date;
  bucketStartAt: Date;
  key: string;
};

export type ValidatedAnalyticsV1Range = {
  businessId: string;
  compareRange?: AnalyticsComparisonRange;
  endDate: string;
  startDate: string;
  timezone: string;
};

export function validateAnalyticsV1Input(
  input: AnalyticsV1Input,
): ValidatedAnalyticsV1Range {
  const businessId = (input.businessId ?? "").trim();
  if (!businessId) {
    throw new InvalidAnalyticsRangeError("businessId", "businessId is required");
  }

  const startDate = (input.startDate ?? "").trim();
  const endDate = (input.endDate ?? "").trim();
  const compareStartDate = (input.compareStartDate ?? "").trim() || undefined;
  const timezone = (input.timezone ?? "").trim() || "America/New_York";

  if (!startDate || !isValidDateTime(startDate)) {
    throw new InvalidAnalyticsRangeError(
      "startDate",
      "startDate must be full datetime (ISO-8601)",
    );
  }

  if (!endDate || !isValidDateTime(endDate)) {
    throw new InvalidAnalyticsRangeError(
      "endDate",
      "endDate must be full datetime (ISO-8601)",
    );
  }

  if (!isValidTimeZone(timezone)) {
    throw new InvalidAnalyticsRangeError("timezone", "timezone is invalid");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.getTime() > end.getTime()) {
    throw new InvalidAnalyticsRangeError(
      "dateRange",
      "startDate must be less than or equal to endDate",
    );
  }

  const diffDays = Math.floor(
    (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays > 366) {
    throw new InvalidAnalyticsRangeError(
      "dateRange",
      "Date range too large. Max 367 days.",
    );
  }

  let compareRange: AnalyticsComparisonRange | undefined;

  if (compareStartDate !== undefined) {
    if (!isValidDateTime(compareStartDate)) {
      throw new InvalidAnalyticsRangeError(
        "compareStartDate",
        "compareStartDate must be full datetime (ISO-8601)",
      );
    }

    const compareStart = new Date(compareStartDate);
    const compareEnd = new Date(compareStart.getTime() + (end.getTime() - start.getTime()));

    compareRange = {
      startDate: compareStart.toISOString(),
      endDate: compareEnd.toISOString(),
    };
  }

  return {
    businessId,
    startDate,
    endDate,
    timezone,
    ...(compareRange ? { compareRange } : {}),
  };
}

export function buildAnalyticsValueBuckets<TRow extends AnalyticsBucketRowBase>(input: {
  compareRows?: TRow[];
  currentRows: TRow[];
  getValue: (row: TRow) => number;
  timezone: string;
}): AnalyticsMetricBucket[] {
  const labelFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: input.timezone,
    month: "short",
    day: "numeric",
  });

  return input.currentRows.map((row, index) => {
    const value = input.getValue(row);
    const compareValue =
      input.compareRows?.[index] !== undefined
        ? input.getValue(input.compareRows[index] as TRow)
        : null;
    const deltaValue = compareValue === null ? null : value - compareValue;
    const deltaPercentage =
      compareValue === null || compareValue === 0 || deltaValue === null
        ? null
        : roundToTwoDecimals((deltaValue / compareValue) * 100);

    return {
      key: row.key,
      label: labelFormatter.format(row.bucketStartAt),
      startDate: row.bucketStartAt.toISOString(),
      endDate: row.bucketEndAt.toISOString(),
      value,
      ...(input.compareRows ? { compareValue } : {}),
      ...(input.compareRows ? { delta: deltaValue } : {}),
      ...(input.compareRows ? { deltaPercentage } : {}),
    };
  });
}

export function buildAnalyticsMetricOutput<TMetric extends string>(input: {
  buckets: AnalyticsMetricBucket[];
  compareRange?: AnalyticsComparisonRange;
  compareTotal?: number;
  endDate: string;
  metric: TMetric;
  startDate: string;
  timezone: string;
}): AnalyticsMetricBarChartOutput<TMetric> {
  const total = input.buckets.reduce((sum, bucket) => sum + bucket.value, 0);
  const averagePerBucket =
    input.buckets.length > 0 ? roundToTwoDecimals(total / input.buckets.length) : 0;
  const maxBucketValue =
    input.buckets.length > 0
      ? Math.max(...input.buckets.map((bucket) => bucket.value))
      : 0;
  const comparisonDelta =
    input.compareTotal === undefined ? undefined : total - input.compareTotal;
  const comparisonDeltaPercentage =
    input.compareTotal === undefined || input.compareTotal === 0
      ? null
      : roundToTwoDecimals(((comparisonDelta ?? 0) / input.compareTotal) * 100);

  return {
    metric: input.metric,
    chartType: "bar",
    granularity: "day",
    timezone: input.timezone,
    range: {
      startDate: input.startDate,
      endDate: input.endDate,
    },
    ...(input.compareRange && input.compareTotal !== undefined
      ? {
          comparison: {
            startDate: input.compareRange.startDate,
            endDate: input.compareRange.endDate,
            total: input.compareTotal,
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
    buckets: input.buckets,
  };
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function isValidDateTime(value: string): boolean {
  if (!value.includes("T")) {
    return false;
  }
  if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
