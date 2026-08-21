import { randomUUID } from "node:crypto";
import prisma from "../../../../prisma.js";
import type { SquareOrdersGateway } from "../ports/SquareOrdersGateway.js";

type CreateSquareOrderFromFoodyOrderInput = {
  locationId?: string;
  orderId: string;
  state?: "DRAFT" | "OPEN";
};

type LoadedFoodyOrder = Awaited<ReturnType<typeof loadFoodyOrder>>;

export class CreateSquareOrderFromFoodyOrderUseCase {
  constructor(private readonly squareOrdersGateway: SquareOrdersGateway) {}

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

    const locationId = await resolveSquareLocationId(this.squareOrdersGateway, input.locationId);
    const orderState = input.state ?? "DRAFT";

    const result = await this.squareOrdersGateway.createOrder({
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
              modifiers: item.modifierGroupItems.map((modifierItem) => {
                const modifierId = modifierItem.squareModifierId?.trim();
                if (!modifierId) {
                  throw new Error(
                    `SQUARE_MODIFIER_ID_MISSING: modifier ${modifierItem.id} (${modifierItem.name})`,
                  );
                }

                return {
                  uid: `${item.id}:${modifierItem.id}`,
                  catalog_object_id: modifierId,
                  quantity: "1",
                };
              }),
            }
          : {}),
      };
    }),
  };
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
