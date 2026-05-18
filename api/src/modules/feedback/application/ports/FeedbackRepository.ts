export type FeedbackSentiment = "NEGATIVE" | "NEUTRAL" | "POSITIVE";

export type FeedbackListQuery = {
  from?: string;
  limit: number;
  sentiment?: FeedbackSentiment;
  timezone: string;
  to?: string;
};

export type FeedbackListItem = {
  comment: string | null;
  createdAt: Date;
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
};

export interface FeedbackRepository {
  list(query: FeedbackListQuery): Promise<FeedbackListItem[]>;
}
