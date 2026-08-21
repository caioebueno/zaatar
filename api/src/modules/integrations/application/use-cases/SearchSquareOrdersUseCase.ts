import type { SquareOrdersGateway } from "../ports/SquareOrdersGateway.js";

type SearchSquareOrdersInput = {
  limit?: number;
  locationId?: string;
  sourceName?: string;
  state?: string;
};

export class SearchSquareOrdersUseCase {
  constructor(private readonly squareOrdersGateway: SquareOrdersGateway) {}

  async execute(input: SearchSquareOrdersInput = {}): Promise<{
    cursor: string | null;
    environment: "PRODUCTION" | "SANDBOX";
    locationId: string;
    orders: unknown[];
  }> {
    const locationId = await resolveSquareLocationId(this.squareOrdersGateway, input.locationId);
    const query = buildSearchQuery(input);

    const result = await this.squareOrdersGateway.searchOrders({
      locationIds: [locationId],
      ...(typeof input.limit === "number" ? { limit: input.limit } : {}),
      ...(query ? { query } : {}),
    });

    return {
      cursor: result.cursor,
      environment: resolveSquareEnvironment(),
      locationId,
      orders: result.orders,
    };
  }
}

function buildSearchQuery(input: SearchSquareOrdersInput): unknown | undefined {
  const filters: unknown[] = [];

  if (input.state?.trim()) {
    filters.push({
      state_filter: {
        states: [input.state.trim().toUpperCase()],
      },
    });
  }

  if (input.sourceName?.trim()) {
    filters.push({
      source_filter: {
        source_names: [input.sourceName.trim()],
      },
    });
  }

  if (filters.length === 0) {
    return undefined;
  }

  return {
    filter: {
      all: filters,
    },
    sort: {
      sort_field: "CREATED_AT",
      sort_order: "DESC",
    },
  };
}

async function resolveSquareLocationId(
  gateway: SquareOrdersGateway,
  explicitLocationId?: string,
): Promise<string> {
  const normalizedExplicit = explicitLocationId?.trim();
  if (normalizedExplicit) {
    return normalizedExplicit;
  }

  const envLocationId = process.env.SQUARE_LOCATION_ID?.trim();
  if (envLocationId) {
    return envLocationId;
  }

  const locations = await gateway.listLocations();
  const activeLocations = locations.filter((location) => location.status === "ACTIVE");

  if (activeLocations.length === 1) {
    return activeLocations[0]!.id;
  }

  const availableLocations = activeLocations.length > 0 ? activeLocations : locations;
  const availableLocationIds = availableLocations.map((location) => location.id).join(", ");

  throw new Error(
    availableLocationIds
      ? `SQUARE_LOCATION_ID_REQUIRED: multiple locations available (${availableLocationIds})`
      : "SQUARE_LOCATION_ID_REQUIRED: no Square locations available",
  );
}

function resolveSquareEnvironment(): "PRODUCTION" | "SANDBOX" {
  const normalized = process.env.SQUARE_ENVIRONMENT?.trim().toUpperCase();
  return normalized === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
}
