import { randomUUID } from "node:crypto";
import prisma from "../../../../prisma.js";
import type { SquareOrdersGateway } from "../ports/SquareOrdersGateway.js";
import type { SquareConnectionAccessTokenResolver } from "../../infrastructure/http/SquareConnectionAccessTokenResolver.js";

type CreateSquareOrderFromFoodyOrderInput = {
  locationId?: string;
  orderId: string;
  state?: "DRAFT" | "OPEN";
};

type LoadedFoodyOrder = Awaited<ReturnType<typeof loadFoodyOrder>>;

export class CreateSquareOrderFromFoodyOrderUseCase {
  constructor(
    private readonly squareOrdersGateway: SquareOrdersGateway,
    private readonly squareTokenResolver?: SquareConnectionAccessTokenResolver,
  ) {}

  async execute(input: CreateSquareOrderFromFoodyOrderInput): Promise<{
    environment: "PRODUCTION" | "SANDBOX";
    foodyOrderId: string;
    locationId: string;
    order: unknown;
    orderState: "DRAFT" | "OPEN";
  }> {
    const foodyOrder = await loadFoodyOrder(input.orderId);
    if (!foodyOrder) {
      throw new Error(`FOODY_ORDER_NOT_FOUND: ${input.orderId}`);
    }

    if (foodyOrder.orderProducts.length === 0) {
      throw new Error(`FOODY_ORDER_HAS_NO_ITEMS: ${input.orderId}`);
    }

    const accessToken = await resolveSquareAccessTokenForOrder(
      foodyOrder,
      this.squareTokenResolver,
    );
    const locationId = await resolveSquareLocationId(
      this.squareOrdersGateway,
      accessToken,
      input.locationId,
    );
    const orderState = input.state ?? "DRAFT";

    const result = await this.squareOrdersGateway.createOrder({
      accessToken,
      idempotencyKey: randomUUID(),
      order: buildSquareOrderPayload(foodyOrder, {
        locationId,
        state: orderState,
      }),
    });

    return {
      environment: resolveSquareEnvironment(),
      foodyOrderId: foodyOrder.id,
      locationId,
      order: result.order,
      orderState,
    };
  }
}

async function loadFoodyOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      number: true,
      createdAt: true,
      type: true,
      status: true,
      paymentMethod: true,
      amount: true,
      tipAmount: true,
      branch: {
        select: {
          id: true,
          name: true,
          businessId: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      orderProducts: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          quantity: true,
          comments: true,
          amount: true,
          fullAmount: true,
          product: {
            select: {
              id: true,
              name: true,
              squareVariationId: true,
            },
          },
          modifierGroupItems: {
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            select: {
              id: true,
              name: true,
              price: true,
              squareModifierId: true,
            },
          },
        },
      },
    },
  });
}

function buildSquareOrderPayload(
  order: NonNullable<LoadedFoodyOrder>,
  input: {
    locationId: string;
    state: "DRAFT" | "OPEN";
  },
): Record<string, unknown> {
  const note = buildOrderNote(order);

  return {
    location_id: input.locationId,
    state: input.state,
    reference_id: order.id,
    source: {
      name: "Foody",
    },
    ...(note ? { note } : {}),
    line_items: order.orderProducts.map((item) => {
      const variationId = item.product.squareVariationId?.trim();
      if (!variationId) {
        throw new Error(
          `SQUARE_VARIATION_ID_MISSING: product ${item.product.id} (${item.product.name})`,
        );
      }

      return {
        uid: item.id,
        catalog_object_id: variationId,
        quantity: String(item.quantity),
        ...(item.comments?.trim() ? { note: item.comments.trim() } : {}),
        ...(item.modifierGroupItems.length > 0
          ? {
              modifiers: buildSquareLineItemModifiers(item),
            }
          : {}),
      };
    }),
  };
}

function buildSquareLineItemModifiers(
  item: NonNullable<LoadedFoodyOrder>["orderProducts"][number],
): Array<Record<string, unknown>> {
  const groupedModifiers = new Map<
    string,
    {
      id: string;
      name: string;
      price: number;
      quantity: number;
    }
  >();

  for (const modifierItem of item.modifierGroupItems) {
    const modifierId = modifierItem.squareModifierId?.trim();
    if (!modifierId) {
      throw new Error(
        `SQUARE_MODIFIER_ID_MISSING: modifier ${modifierItem.id} (${modifierItem.name})`,
      );
    }

    const existing = groupedModifiers.get(modifierId);
    if (existing) {
      existing.quantity += 1;
      continue;
    }

    groupedModifiers.set(modifierId, {
      id: modifierItem.id,
      name: modifierItem.name,
      price: modifierItem.price,
      quantity: 1,
    });
  }

  return Array.from(groupedModifiers.entries()).map(([modifierId, modifier]) => ({
    uid: `${item.id}:${modifierId}`,
    catalog_object_id: modifierId,
    name: modifier.name,
    quantity: String(modifier.quantity),
    base_price_money: {
      amount: modifier.price,
      currency: "USD",
    },
  }));
}

function buildOrderNote(order: NonNullable<LoadedFoodyOrder>): string | null {
  const parts = [
    `Foody order ${order.number?.trim() || order.id}`,
    order.branch?.name ? `branch=${order.branch.name}` : null,
    `type=${order.type}`,
    `status=${order.status}`,
    order.customer?.name ? `customer=${order.customer.name}` : null,
    typeof order.tipAmount === "number" ? `tip=${order.tipAmount}` : null,
  ].filter((value): value is string => Boolean(value && value.trim().length > 0));

  return parts.length > 0 ? parts.join(" | ") : null;
}

async function resolveSquareLocationId(
  gateway: SquareOrdersGateway,
  accessToken: string | undefined,
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

  const locations = await gateway.listLocations({ accessToken });
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

async function resolveSquareAccessTokenForOrder(
  order: NonNullable<LoadedFoodyOrder>,
  squareTokenResolver: SquareConnectionAccessTokenResolver | undefined,
): Promise<string | undefined> {
  const businessId = order.branch?.businessId?.trim();
  if (!businessId || !squareTokenResolver) {
    return undefined;
  }

  return squareTokenResolver.resolveForBusiness(businessId);
}

function resolveSquareEnvironment(): "PRODUCTION" | "SANDBOX" {
  const normalized = process.env.SQUARE_ENVIRONMENT?.trim().toUpperCase();
  return normalized === "PRODUCTION" ? "PRODUCTION" : "SANDBOX";
}
