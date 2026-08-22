import { InvalidFeedbackListQueryError } from "../errors/InvalidFeedbackListQueryError.js";
import type {
  FeedbackListItem,
  FeedbackRepository,
} from "../ports/FeedbackRepository.js";

export type GetFeedbackAnalyticsInput = {
  businessId?: string;
  compareStartDate?: string;
  endDate?: string;
  startDate?: string;
  timezone?: string;
};

export type GetFeedbackAnalyticsOutput = {
  averageScorePoints: Array<{
    compareValue?: number | null;
    date: string;
    delta?: number | null;
    deltaPercentage?: number | null;
    label: string;
    value: number | null;
  }>;
  chartType: "line";
  comparison?: {
    averageScore: number | null;
    averageScoreDelta: number | null;
    averageScoreDeltaPercentage: number | null;
    endDate: string;
    quantityOfFeedback: number;
    quantityOfFeedbackDelta: number;
    quantityOfFeedbackDeltaPercentage: number | null;
    scoreCounts: {
      bad: number;
      good: number;
      medium: number;
    };
    startDate: string;
  };
  metric: "feedback";
  range: {
    endDate: string;
    startDate: string;
  };
  scores: Array<{
    comment: string | null;
    createdAt: string;
    customerName: string | null;
    customerPhone: string | null;
    deliverySpeed: number | null;
    id: string;
    language: string | null;
    orderId: string;
    orderNumber: string | null;
    orderStatus: string | null;
    orderType: string | null;
    productQuality: number | null;
    reward: {
      id: string;
      productId: string | null;
      productName: string | null;
      quantity: number | null;
      status: string;
      title: string;
    } | null;
    score: number;
    sentiment: "NEGATIVE" | "NEUTRAL" | "POSITIVE";
    serviceExperience: number | null;
    temperature: number | null;
  }>;
  summary: {
    averageScore: number | null;
    quantityOfFeedback: number;
    scoreCounts: {
      bad: number;
      good: number;
      medium: number;
    };
  };
  timezone: string;
};

type ValidatedRange = {
  businessId: string;
  compareRange?: {
    endDate: string;
    startDate: string;
  };
  endDate: string;
  startDate: string;
  timezone: string;
};

export class GetFeedbackAnalyticsUseCase {
  constructor(private readonly repository: FeedbackRepository) {}

  async execute(
    input: GetFeedbackAnalyticsInput,
  ): Promise<GetFeedbackAnalyticsOutput> {
    const validated = validateInput(input);

    const [currentItems, compareItems] = await Promise.all([
      this.repository.listByDateTimeRange({
        businessId: validated.businessId,
        startDate: validated.startDate,
        endDate: validated.endDate,
      }),
      validated.compareRange
        ? this.repository.listByDateTimeRange({
            businessId: validated.businessId,
            startDate: validated.compareRange.startDate,
            endDate: validated.compareRange.endDate,
          })
        : Promise.resolve(undefined),
    ]);

    const currentSummary = buildSummary(currentItems);
    const compareSummary = compareItems ? buildSummary(compareItems) : undefined;

    const averageScorePoints = buildAverageScorePoints({
      currentItems,
      compareItems,
      currentRange: {
        startDate: validated.startDate,
        endDate: validated.endDate,
      },
      compareRange: validated.compareRange,
      timezone: validated.timezone,
    });

    const quantityDelta =
      compareSummary === undefined
        ? undefined
        : currentSummary.quantityOfFeedback - compareSummary.quantityOfFeedback;
    const quantityDeltaPercentage =
      compareSummary === undefined || compareSummary.quantityOfFeedback === 0
        ? null
        : roundToTwoDecimals(
            ((quantityDelta ?? 0) / compareSummary.quantityOfFeedback) * 100,
          );

    const averageScoreDelta =
      compareSummary === undefined ||
      compareSummary.averageScore === null ||
      currentSummary.averageScore === null
        ? null
        : roundToTwoDecimals(
            currentSummary.averageScore - compareSummary.averageScore,
          );
    const averageScoreDeltaPercentage =
      compareSummary === undefined ||
      compareSummary.averageScore === null ||
      compareSummary.averageScore === 0 ||
      averageScoreDelta === null
        ? null
        : roundToTwoDecimals(
            (averageScoreDelta / compareSummary.averageScore) * 100,
          );

    return {
      metric: "feedback",
      chartType: "line",
      timezone: validated.timezone,
      range: {
        startDate: validated.startDate,
        endDate: validated.endDate,
      },
      ...(validated.compareRange && compareSummary
        ? {
            comparison: {
              startDate: validated.compareRange.startDate,
              endDate: validated.compareRange.endDate,
              quantityOfFeedback: compareSummary.quantityOfFeedback,
              quantityOfFeedbackDelta: quantityDelta ?? 0,
              quantityOfFeedbackDeltaPercentage: quantityDeltaPercentage,
              averageScore: compareSummary.averageScore,
              averageScoreDelta,
              averageScoreDeltaPercentage,
              scoreCounts: compareSummary.scoreCounts,
            },
          }
        : {}),
      summary: currentSummary,
      averageScorePoints,
      scores: currentItems.map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        orderId: item.orderId,
        orderNumber: item.orderNumber,
        orderStatus: item.orderStatus,
        orderType: item.orderType,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        language: item.language,
        score: item.overallRating,
        sentiment: item.sentiment,
        productQuality: item.productQuality,
        temperature: item.temperature,
        deliverySpeed: item.deliverySpeed,
        serviceExperience: item.serviceExperience,
        comment: item.comment,
        reward: item.reward,
      })),
    };
  }
}

function buildAverageScorePoints(input: {
  compareItems?: FeedbackListItem[];
  compareRange?: {
    endDate: string;
    startDate: string;
  };
  currentItems: FeedbackListItem[];
  currentRange: {
    endDate: string;
    startDate: string;
  };
  timezone: string;
}): GetFeedbackAnalyticsOutput["averageScorePoints"] {
  const currentKeys = enumerateDateKeys(
    localDateKey(new Date(input.currentRange.startDate), input.timezone),
    localDateKey(new Date(input.currentRange.endDate), input.timezone),
  );
  const compareKeys = input.compareRange
    ? enumerateDateKeys(
        localDateKey(new Date(input.compareRange.startDate), input.timezone),
        localDateKey(new Date(input.compareRange.endDate), input.timezone),
      )
    : undefined;

  const currentAveragesByKey = buildAverageMap(input.currentItems, input.timezone);
  const compareAveragesByKey = input.compareItems
    ? buildAverageMap(input.compareItems, input.timezone)
    : undefined;

  return currentKeys.map((key, index) => {
    const value = currentAveragesByKey.get(key) ?? null;
    const compareKey = compareKeys?.[index];
    const compareValue =
      compareKey && compareAveragesByKey ? compareAveragesByKey.get(compareKey) ?? null : null;
    const delta =
      value === null || compareValue === null
        ? null
        : roundToTwoDecimals(value - compareValue);
    const deltaPercentage =
      compareValue === null || compareValue === 0 || delta === null
        ? null
        : roundToTwoDecimals((delta / compareValue) * 100);

    return {
      date: key,
      label: formatChartLabel(key),
      value,
      ...(input.compareItems ? { compareValue } : {}),
      ...(input.compareItems ? { delta } : {}),
      ...(input.compareItems ? { deltaPercentage } : {}),
    };
  });
}

function buildAverageMap(
  items: FeedbackListItem[],
  timezone: string,
): Map<string, number> {
  const grouped = new Map<string, { total: number; count: number }>();

  for (const item of items) {
    const key = localDateKey(item.createdAt, timezone);
    const current = grouped.get(key) ?? { total: 0, count: 0 };
    current.total += item.overallRating;
    current.count += 1;
    grouped.set(key, current);
  }

  return new Map(
    Array.from(grouped.entries()).map(([key, value]) => [
      key,
      roundToTwoDecimals(value.total / value.count),
    ]),
  );
}

function buildSummary(
  items: FeedbackListItem[],
): GetFeedbackAnalyticsOutput["summary"] {
  const scoreCounts = {
    good: items.filter((item) => item.sentiment === "POSITIVE").length,
    medium: items.filter((item) => item.sentiment === "NEUTRAL").length,
    bad: items.filter((item) => item.sentiment === "NEGATIVE").length,
  };

  return {
    quantityOfFeedback: items.length,
    averageScore:
      items.length > 0
        ? roundToTwoDecimals(
            items.reduce((sum, item) => sum + item.overallRating, 0) / items.length,
          )
        : null,
    scoreCounts,
  };
}

function enumerateDateKeys(startKey: string, endKey: string): string[] {
  const result: string[] = [];
  const cursor = new Date(`${startKey}T00:00:00.000Z`);
  const end = new Date(`${endKey}T00:00:00.000Z`);

  while (cursor.getTime() <= end.getTime()) {
    result.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

function formatChartLabel(key: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(new Date(`${key}T00:00:00.000Z`));
}

function localDateKey(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function validateInput(input: GetFeedbackAnalyticsInput): ValidatedRange {
  const businessId = (input.businessId ?? "").trim();
  if (!businessId) {
    throw new InvalidFeedbackListQueryError("businessId", "businessId is required");
  }

  const startDate = (input.startDate ?? "").trim();
  const endDate = (input.endDate ?? "").trim();
  const compareStartDate = (input.compareStartDate ?? "").trim() || undefined;
  const timezone = (input.timezone ?? "").trim() || "America/New_York";

  if (!startDate || !isValidDateTime(startDate)) {
    throw new InvalidFeedbackListQueryError(
      "startDate",
      "startDate must be full datetime (ISO-8601)",
    );
  }

  if (!endDate || !isValidDateTime(endDate)) {
    throw new InvalidFeedbackListQueryError(
      "endDate",
      "endDate must be full datetime (ISO-8601)",
    );
  }

  if (!isValidTimeZone(timezone)) {
    throw new InvalidFeedbackListQueryError("timezone", "timezone is invalid");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.getTime() > end.getTime()) {
    throw new InvalidFeedbackListQueryError(
      "dateRange",
      "startDate must be less than or equal to endDate",
    );
  }

  const diffDays = Math.floor(
    (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays > 366) {
    throw new InvalidFeedbackListQueryError(
      "dateRange",
      "Date range too large. Max 367 days.",
    );
  }

  let compareRange:
    | {
        endDate: string;
        startDate: string;
      }
    | undefined;

  if (compareStartDate !== undefined) {
    if (!isValidDateTime(compareStartDate)) {
      throw new InvalidFeedbackListQueryError(
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
