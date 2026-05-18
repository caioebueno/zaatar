import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/src/lib/auth";
import { readBusinessIdFromCookieStore } from "@/src/lib/business";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

type PageProps = {
  searchParams: Promise<{
    from?: string;
    sentiment?: string;
    to?: string;
  }>;
};

type FeedbackSentiment = "NEGATIVE" | "NEUTRAL" | "POSITIVE";

type FeedbackItem = {
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
};

type FeedbackResponse = {
  items?: FeedbackItem[];
};

function getDefaultDates(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 30);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatSentiment(sentiment: FeedbackSentiment): string {
  if (sentiment === "POSITIVE") return "Positive";
  if (sentiment === "NEGATIVE") return "Negative";
  return "Neutral";
}

function isSentiment(
  value: string | undefined,
): value is FeedbackSentiment {
  return value === "POSITIVE" || value === "NEGATIVE" || value === "NEUTRAL";
}

function renderRating(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${Math.round(value)}/5`;
}

async function fetchFeedback(input: {
  accessToken: string;
  businessId: string | null;
  from: string;
  sentiment?: FeedbackSentiment;
  to: string;
}): Promise<FeedbackItem[]> {
  const endpoint = new URL(`${getApiBaseUrl()}/feedbacks`);
  endpoint.searchParams.set("from", input.from);
  endpoint.searchParams.set("to", input.to);
  endpoint.searchParams.set("timezone", "America/New_York");
  endpoint.searchParams.set("limit", "300");
  if (input.sentiment) {
    endpoint.searchParams.set("sentiment", input.sentiment);
  }

  const response = await fetch(endpoint.toString(), {
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      ...(input.businessId ? { "x-business-id": input.businessId } : {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as
    | FeedbackResponse
    | { error?: string };

  if (!response.ok) {
    const message =
      "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (
    payload &&
    typeof payload === "object" &&
    "items" in payload &&
    Array.isArray((payload as { items?: unknown }).items)
  ) {
    return (payload as { items: FeedbackItem[] }).items;
  }

  return [];
}

export default async function FeedbackPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = readBusinessIdFromCookieStore(cookieStore);

  if (!accessToken) {
    redirect("/login");
  }

  const defaults = getDefaultDates();
  const from = resolvedSearchParams.from?.trim() || defaults.from;
  const to = resolvedSearchParams.to?.trim() || defaults.to;
  const sentiment = isSentiment(resolvedSearchParams.sentiment?.trim())
    ? resolvedSearchParams.sentiment?.trim()
    : undefined;

  let errorMessage: string | null = null;
  let items: FeedbackItem[] = [];

  try {
    items = await fetchFeedback({
      accessToken,
      businessId,
      from,
      to,
      sentiment: sentiment as FeedbackSentiment | undefined,
    });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Could not load feedback";
  }

  const totalFeedback = items.length;
  const averageRating =
    totalFeedback > 0
      ? items.reduce((sum, item) => sum + (item.overallRating || 0), 0) / totalFeedback
      : 0;
  const positiveCount = items.filter((item) => item.sentiment === "POSITIVE").length;
  const positiveRate = totalFeedback > 0 ? Math.round((positiveCount / totalFeedback) * 100) : 0;

  return (
    <div className="manager-page feedback-page">
      <h1 className="manager-page-title">Customer Feedback</h1>
      <p className="manager-page-subtitle">
        Monitor ratings and comments submitted by customers.
      </p>

      <section className="analytics-card">
        <form method="get" className="analytics-filters feedback-filters">
          <div className="analytics-field">
            <label className="field-label" htmlFor="feedback-from">
              From
            </label>
            <input
              id="feedback-from"
              name="from"
              type="date"
              className="field-input"
              defaultValue={from}
              required
            />
          </div>

          <div className="analytics-field">
            <label className="field-label" htmlFor="feedback-to">
              To
            </label>
            <input
              id="feedback-to"
              name="to"
              type="date"
              className="field-input"
              defaultValue={to}
              required
            />
          </div>

          <div className="analytics-field">
            <label className="field-label" htmlFor="feedback-sentiment">
              Sentiment
            </label>
            <select
              id="feedback-sentiment"
              name="sentiment"
              className="field-input"
              defaultValue={sentiment ?? ""}
            >
              <option value="">All</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="NEGATIVE">Negative</option>
            </select>
          </div>

          <div className="analytics-actions">
            <button className="button button-primary" type="submit">
              Apply filters
            </button>
          </div>
        </form>
      </section>

      {errorMessage ? (
        <p className="sales-channel-feedback is-error">{errorMessage}</p>
      ) : null}

      <section className="analytics-summary-grid">
        <article className="analytics-summary-item">
          <p className="dashboard-label">Feedbacks</p>
          <p className="dashboard-value">{totalFeedback}</p>
        </article>
        <article className="analytics-summary-item">
          <p className="dashboard-label">Average rating</p>
          <p className="dashboard-value">{averageRating.toFixed(1)}/5</p>
        </article>
        <article className="analytics-summary-item">
          <p className="dashboard-label">Positive sentiment</p>
          <p className="dashboard-value">{positiveRate}%</p>
        </article>
      </section>

      <section className="analytics-card">
        <h2 className="sales-channel-subtitle">Feedback list</h2>
        <div className="analytics-table-wrap">
          <table className="analytics-table feedback-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Customer</th>
                <th>Order</th>
                <th>Overall</th>
                <th>Sentiment</th>
                <th>Comment</th>
                <th>Reward</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{formatDateTime(item.createdAt)}</td>
                  <td>
                    <div className="orders-customer-cell">
                      <span>{item.customerName || "Guest"}</span>
                      {item.customerPhone ? (
                        <span className="orders-customer-phone">{item.customerPhone}</span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div className="feedback-order-cell">
                      <span>{item.orderNumber || item.orderId.slice(0, 8)}</span>
                      <span className="orders-customer-phone">{item.orderType || "-"}</span>
                    </div>
                  </td>
                  <td>{renderRating(item.overallRating)}</td>
                  <td>
                    <span className={`feedback-sentiment-badge is-${item.sentiment.toLowerCase()}`}>
                      {formatSentiment(item.sentiment)}
                    </span>
                  </td>
                  <td>
                    <div className="feedback-comment-cell">
                      <p>{item.comment || "-"}</p>
                      <span>
                        Quality {renderRating(item.productQuality)} · Temp{" "}
                        {renderRating(item.temperature)} · Delivery{" "}
                        {renderRating(item.deliverySpeed)} · Service{" "}
                        {renderRating(item.serviceExperience)}
                      </span>
                    </div>
                  </td>
                  <td>
                    {item.reward ? (
                      <div className="feedback-reward-cell">
                        <p>{item.reward.productName || item.reward.title}</p>
                        <span>
                          Qty {item.reward.quantity || 1} · {item.reward.status}
                        </span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7}>No customer feedback found for selected filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
