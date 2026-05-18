import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OrdersTableWithDrawer, {
  type ManagerOrderListItem,
} from "@/app/components/OrdersTableWithDrawer";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/src/lib/auth";
import { readBusinessIdFromCookieStore } from "@/src/lib/business";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

type PageProps = {
  searchParams: Promise<{
    from?: string;
    includeCanceled?: string;
    to?: string;
  }>;
};

type OrdersResponse = {
  items?: ManagerOrderListItem[];
};

function getDefaultDates(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 6);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

async function fetchOrders(input: {
  accessToken: string;
  businessId: string | null;
  from: string;
  includeCanceled: boolean;
  to: string;
}): Promise<ManagerOrderListItem[]> {
  const apiBaseUrl = getApiBaseUrl();
  const endpoint = new URL(`${apiBaseUrl}/orders`);
  endpoint.searchParams.set("from", input.from);
  endpoint.searchParams.set("to", input.to);
  endpoint.searchParams.set("timezone", "America/New_York");
  endpoint.searchParams.set("includeCanceled", String(input.includeCanceled));
  endpoint.searchParams.set("limit", "200");

  const response = await fetch(endpoint.toString(), {
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      ...(input.businessId ? { "x-business-id": input.businessId } : {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as
    | OrdersResponse
    | { error?: string };

  if (!response.ok) {
    const errorMessage =
      "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  if (
    payload &&
    typeof payload === "object" &&
    "items" in payload &&
    Array.isArray((payload as { items?: unknown }).items)
  ) {
    return (payload as { items: ManagerOrderListItem[] }).items;
  }

  return [];
}

export default async function OrdersPage({ searchParams }: PageProps) {
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
  const includeCanceled = resolvedSearchParams.includeCanceled === "true";

  let errorMessage: string | null = null;
  let orders: ManagerOrderListItem[] = [];

  try {
    orders = await fetchOrders({ accessToken, businessId, from, to, includeCanceled });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Could not load orders";
  }

  return (
    <div className="manager-page orders-page">
      <h1 className="manager-page-title">Orders</h1>
      <p className="manager-page-subtitle">
        Review order history and totals by date range.
      </p>

      <section className="analytics-card">
        <form method="get" className="analytics-filters">
          <div className="analytics-field">
            <label className="field-label" htmlFor="orders-from">
              From
            </label>
            <input
              id="orders-from"
              name="from"
              type="date"
              className="field-input"
              defaultValue={from}
              required
            />
          </div>

          <div className="analytics-field">
            <label className="field-label" htmlFor="orders-to">
              To
            </label>
            <input
              id="orders-to"
              name="to"
              type="date"
              className="field-input"
              defaultValue={to}
              required
            />
          </div>

          <label className="sales-channel-check orders-include-canceled">
            <input
              name="includeCanceled"
              type="checkbox"
              value="true"
              defaultChecked={includeCanceled}
            />
            Include canceled orders
          </label>

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

      <section className="analytics-card">
        <h2 className="sales-channel-subtitle">Order list</h2>
        <OrdersTableWithDrawer orders={orders} />
      </section>
    </div>
  );
}
