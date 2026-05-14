import { InvalidFeedbackListQueryError } from "../errors/InvalidFeedbackListQueryError.js";
import type {
  FeedbackListItem,
  FeedbackRepository,
  FeedbackSentiment,
} from "../ports/FeedbackRepository.js";

export type ListFeedbackInput = {
  from?: string;
  limit?: number;
  sentiment?: string;
  timezone?: string;
  to?: string;
};

export type ListFeedbackOutput = {
  items: Array<{
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
    overallRating: number;
    productQuality: number | null;
    reward: {
      id: string;
      productId: string | null;
      productName: string | null;
      quantity: number | null;
      status: string;
      title: string;
    } | null;
    sentiment: FeedbackSentiment;
    serviceExperience: number | null;
    temperature: number | null;
  }>;
};

const ALLOWED_SENTIMENTS = new Set<FeedbackSentiment>([
  "NEGATIVE",
  "NEUTRAL",
  "POSITIVE",
]);

export class ListFeedbackUseCase {
  constructor(private readonly repository: FeedbackRepository) {}

  async execute(input: ListFeedbackInput): Promise<ListFeedbackOutput> {
    const timezone = (input.timezone ?? "").trim() || "America/New_York";
    const from = (input.from ?? "").trim() || undefined;
    const to = (input.to ?? "").trim() || undefined;
    const rawSentiment = (input.sentiment ?? "").trim().toUpperCase();
    const sentiment = rawSentiment
      ? parseSentiment(rawSentiment)
      : undefined;
    const limit = Number.isFinite(input.limit)
      ? Math.min(Math.max(Number(input.limit) || 100, 1), 500)
      : 100;

    if (from && !isDateOnly(from)) {
      throw new InvalidFeedbackListQueryError("from", "from must be YYYY-MM-DD");
    }

    if (to && !isDateOnly(to)) {
      throw new InvalidFeedbackListQueryError("to", "to must be YYYY-MM-DD");
    }

    if (from && to && from > to) {
      throw new InvalidFeedbackListQueryError(
        "dateRange",
        "from must be less than or equal to to",
      );
    }

    const items = await this.repository.list({
      from,
      to,
      timezone,
      sentiment,
      limit,
    });

    return {
      items: items.map((item: FeedbackListItem) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}

function isDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseSentiment(value: string): FeedbackSentiment {
  if (ALLOWED_SENTIMENTS.has(value as FeedbackSentiment)) {
    return value as FeedbackSentiment;
  }
  throw new InvalidFeedbackListQueryError("sentiment", "Invalid sentiment");
}
