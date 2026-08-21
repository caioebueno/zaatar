import type {
  SquareCreateOrderResult,
  SquareLocationSummary,
  SquareOrdersGateway,
  SquareRetrieveCustomerResult,
  SquareRetrieveOrderResult,
  SquareSearchOrdersResult,
} from "../../application/ports/SquareOrdersGateway.js";

type SquareApiError = {
  category?: string;
  code?: string;
  detail?: string;
};

type SquareLocationsApiResponse = {
  errors?: SquareApiError[];
  locations?: Array<{
    id?: string | null;
    name?: string | null;
    status?: string | null;
    timezone?: string | null;
  }> | null;
};

type SquareApiLocation = NonNullable<
  NonNullable<SquareLocationsApiResponse["locations"]>[number]
>;

type SquareOrderApiResponse = {
  errors?: SquareApiError[];
  order?: unknown;
  [key: string]: unknown;
};

type SquareCustomerApiResponse = {
  customer?: unknown;
  errors?: SquareApiError[];
  [key: string]: unknown;
};

type SquareSearchOrdersApiResponse = {
  cursor?: string | null;
  errors?: SquareApiError[];
  orders?: unknown[] | null;
  [key: string]: unknown;
};

const DEFAULT_SQUARE_VERSION = "2026-07-15";

export class HttpSquareOrdersGateway implements SquareOrdersGateway {
  async createOrder(input: {
    accessToken?: string;
    idempotencyKey: string;
    order: unknown;
  }): Promise<SquareCreateOrderResult> {
    const response = await fetch(`${resolveSquareApiBaseUrl()}/v2/orders`, {
      method: "POST",
      headers: buildSquareHeaders(input.accessToken),
      body: JSON.stringify({
        idempotency_key: input.idempotencyKey,
        order: input.order,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as SquareOrderApiResponse;

    if (!response.ok) {
      throw new Error(formatSquareError("SQUARE_ORDER_CREATE_FAILED", response.status, payload.errors));
    }

    return {
      order: payload.order ?? null,
      rawResponse: payload,
    };
  }

  async listLocations(input?: {
    accessToken?: string;
  }): Promise<SquareLocationSummary[]> {
    const response = await fetch(`${resolveSquareApiBaseUrl()}/v2/locations`, {
      method: "GET",
      headers: buildSquareHeaders(input?.accessToken),
    });

    const payload = (await response.json().catch(() => ({}))) as SquareLocationsApiResponse;

    if (!response.ok) {
      throw new Error(
        formatSquareError("SQUARE_LIST_LOCATIONS_FAILED", response.status, payload.errors),
      );
    }

    return (payload.locations ?? [])
      .filter((location): location is SquareApiLocation => Boolean(location?.id?.trim()))
      .map((location) => ({
        id: location.id?.trim() ?? "",
        name: location.name ?? null,
        status: location.status ?? null,
        timezone: location.timezone ?? null,
      }));
  }

  async retrieveCustomer(input: {
    accessToken?: string;
    customerId: string;
  }): Promise<SquareRetrieveCustomerResult> {
    const response = await fetch(
      `${resolveSquareApiBaseUrl()}/v2/customers/${encodeURIComponent(input.customerId)}`,
      {
        method: "GET",
        headers: buildSquareHeaders(input.accessToken),
      },
    );

    const payload = (await response.json().catch(() => ({}))) as SquareCustomerApiResponse;

    if (!response.ok) {
      throw new Error(
        formatSquareError(
          "SQUARE_CUSTOMER_RETRIEVE_FAILED",
          response.status,
          payload.errors,
        ),
      );
    }

    return {
      customer: payload.customer ?? null,
      rawResponse: payload,
    };
  }

  async retrieveOrder(input: {
    accessToken?: string;
    orderId: string;
  }): Promise<SquareRetrieveOrderResult> {
    const response = await fetch(
      `${resolveSquareApiBaseUrl()}/v2/orders/${encodeURIComponent(input.orderId)}`,
      {
        method: "GET",
        headers: buildSquareHeaders(input.accessToken),
      },
    );

    const payload = (await response.json().catch(() => ({}))) as SquareOrderApiResponse;

    if (!response.ok) {
      throw new Error(
        formatSquareError("SQUARE_ORDER_RETRIEVE_FAILED", response.status, payload.errors),
      );
    }

    return {
      order: payload.order ?? null,
      rawResponse: payload,
    };
  }

  async searchOrders(input: {
    accessToken?: string;
    locationIds: string[];
    limit?: number;
    query?: unknown;
  }): Promise<SquareSearchOrdersResult> {
    const response = await fetch(`${resolveSquareApiBaseUrl()}/v2/orders/search`, {
      method: "POST",
      headers: buildSquareHeaders(input.accessToken),
      body: JSON.stringify({
        location_ids: input.locationIds,
        ...(typeof input.limit === "number" ? { limit: input.limit } : {}),
        ...(input.query ? { query: input.query } : {}),
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as SquareSearchOrdersApiResponse;

    if (!response.ok) {
      throw new Error(
        formatSquareError("SQUARE_ORDER_SEARCH_FAILED", response.status, payload.errors),
      );
    }

    return {
      cursor: payload.cursor ?? null,
      orders: Array.isArray(payload.orders) ? payload.orders : [],
      rawResponse: payload,
    };
  }
}

function buildSquareHeaders(accessTokenOverride?: string): Record<string, string> {
  const accessToken =
    accessTokenOverride?.trim() || process.env.SQUARE_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new Error("SQUARE_ACCESS_TOKEN_NOT_CONFIGURED");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "Square-Version": process.env.SQUARE_API_VERSION?.trim() || DEFAULT_SQUARE_VERSION,
  };
}

function formatSquareError(
  prefix: string,
  status: number,
  errors: SquareApiError[] | undefined,
): string {
  const detail = errors?.[0]?.detail?.trim();
  return detail ? `${prefix}_${status}: ${detail}` : `${prefix}_${status}`;
}

function resolveSquareApiBaseUrl(): string {
  const configured = process.env.SQUARE_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const environment = process.env.SQUARE_ENVIRONMENT?.trim().toUpperCase();
  return environment === "PRODUCTION"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}
