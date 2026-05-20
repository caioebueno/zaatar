import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OrderManager, {
  type ManagerOrderListItem,
} from "@/app/components/OrderManager";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/src/lib/auth";
import { readBusinessIdFromCookieStore } from "@/src/lib/business";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

type PageProps = {
  searchParams: Promise<{
    from?: string;
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
  fromDate.setDate(fromDate.getDate() - 29);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

async function fetchOrders(input: {
  accessToken: string;
  businessId: string | null;
  from: string;
  includeCanceled?: boolean;
  to: string;
}): Promise<ManagerOrderListItem[]> {
  const apiBaseUrl = getApiBaseUrl();
  const endpoint = new URL(`${apiBaseUrl}/orders`);
  endpoint.searchParams.set("from", input.from);
  endpoint.searchParams.set("to", input.to);
  endpoint.searchParams.set("timezone", "America/New_York");
  endpoint.searchParams.set("includeCanceled", "true");
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

  let orders: ManagerOrderListItem[] = [];

  try {
    orders = await fetchOrders({ accessToken, businessId, from, to });
  } catch {
    // OrderManager handles the empty state gracefully
  }

  return <OrderManager orders={orders} />;
}
