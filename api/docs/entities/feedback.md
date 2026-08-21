# Entity: Feedback

## General Schema

```ts
type CustomerFeedback = {
  id: string;
  orderId: string;
  customerId?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
};

type FeedbackAnalytics = {
  metric: "feedback";
  chartType: "line";
  timezone: string;
  range: {
    startDate: string;
    endDate: string;
  };
  comparison?: {
    startDate: string;
    endDate: string;
    quantityOfFeedback: number;
    quantityOfFeedbackDelta: number;
    quantityOfFeedbackDeltaPercentage: number | null;
    averageScore: number | null;
    averageScoreDelta: number | null;
    averageScoreDeltaPercentage: number | null;
    scoreCounts: {
      good: number;
      medium: number;
      bad: number;
    };
  };
  summary: {
    quantityOfFeedback: number;
    averageScore: number | null;
    scoreCounts: {
      good: number;
      medium: number;
      bad: number;
    };
  };
  averageScorePoints: Array<{
    date: string;
    label: string;
    value: number | null;
    compareValue?: number | null;
    delta?: number | null;
    deltaPercentage?: number | null;
  }>;
  scores: Array<{
    id: string;
    createdAt: string;
    orderId: string;
    orderNumber: string | null;
    score: number;
    sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
    comment: string | null;
  }>;
};
```

## APIs

- `GET /feedbacks`
- `GET /feedback`
- `GET /v1/feedback`

## Detailed Docs

- [feedback.md](../feedback.md)
