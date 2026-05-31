import prisma from "../../../../prisma.js";
import { randomUUID } from "node:crypto";
import { InvalidUpsertOrderIntentPayloadError } from "../../application/errors/InvalidUpsertOrderIntentPayloadError.js";
import { OrderIntentCustomerNotFoundError } from "../../application/errors/OrderIntentCustomerNotFoundError.js";
import { OrderIntentDeliveryAddressNotFoundError } from "../../application/errors/OrderIntentDeliveryAddressNotFoundError.js";
import { OrderIntentBranchNotFoundError } from "../../application/errors/OrderIntentBranchNotFoundError.js";
import { OrderIntentNotFoundError } from "../../application/errors/OrderIntentNotFoundError.js";
import type {
  OrderIntentRecord,
  OrderIntentRepository,
  UpsertOrderIntentInput,
  UpsertOrderIntentProductInput,
} from "../../application/ports/OrderIntentRepository.js";

const DEFAULT_BRANCH_COORDINATES = {
  lat: 28.34883080351401,
  lng: -81.65145586075074,
};
const BASE_DELIVERY_FEE_CENTS = 200;
const DELIVERY_FEE_PER_KM_CENTS = 55;
const MAX_DELIVERY_DISTANCE_KM = 20;

export class PrismaOrderIntentRepository implements OrderIntentRepository {
  async upsert(input: UpsertOrderIntentInput): Promise<OrderIntentRecord> {
    return prisma.$transaction(async (tx) => {
      const db = tx as any;
      let customerId: string | null = null;
      let existingIntentCustomerId: string | null = null;

      if (input.customerPhone) {
        let customer = await findCustomerByPhone(tx, input.customerPhone);
        if (!customer && input.customerName) {
          const normalizedPhone = normalizePhoneWithCountryCode(input.customerPhone);
          customer = await tx.customer.create({
            data: {
              id: randomUUID(),
              phone: normalizedPhone || input.customerPhone,
              name: input.customerName,
            },
            select: { id: true },
          });
        }
        if (!customer) {
          throw new OrderIntentCustomerNotFoundError();
        }
        customerId = customer.id;
      }

      const resolvedDeliveryAddressId =
        input.deliveryAddressId !== undefined
          ? await this.resolveDeliveryAddressIdById({
              customerId: customerId ?? undefined,
              deliveryAddressId: input.deliveryAddressId,
            })
          : input.deliveryAddress === undefined
            ? undefined
            : await this.resolveDeliveryAddressId({
                customerId: customerId ?? undefined,
                deliveryAddress: input.deliveryAddress,
                branchId: input.branchId,
              });

      const baseData = {
        active: input.active,
        language: input.language,
        status: input.status,
        type: input.type,
        paymentMethod: input.paymentMethod,
        paymentProvider: input.paymentProvider,
        tipAmount: input.tipAmount,
        tags: input.tags,
        progressiveDiscountSnapshot: input.progressiveDiscountSnapshot,
        amount: input.amount,
        deliveryAddressId: resolvedDeliveryAddressId,
      };

      let targetId: string;

      if (input.orderIntentId) {
        const existing = await db.orderIntent.findUnique({
          where: { id: input.orderIntentId },
          select: { id: true, customerId: true },
        });
        if (!existing) {
          throw new OrderIntentNotFoundError();
        }
        existingIntentCustomerId = existing.customerId ?? null;

        if (customerId && existingIntentCustomerId && customerId !== existingIntentCustomerId) {
          throw new OrderIntentNotFoundError();
        }

        customerId = customerId ?? existingIntentCustomerId;

        const updated = await db.orderIntent.update({
          where: { id: existing.id },
          data: {
            ...stripUndefined(baseData),
            updatedAt: new Date(),
          },
          select: { id: true },
        });
        targetId = updated.id;
      } else {
        if (!customerId) {
          throw new InvalidUpsertOrderIntentPayloadError("customerPhone");
        }

        const activeExisting = await db.orderIntent.findFirst({
          where: {
            customerId,
            active: true,
          },
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
          select: { id: true },
        });

        if (activeExisting) {
          const updated = await db.orderIntent.update({
            where: { id: activeExisting.id },
            data: {
              ...stripUndefined(baseData),
              updatedAt: new Date(),
            },
            select: { id: true },
          });
          targetId = updated.id;
        } else {
          const created = await db.orderIntent.create({
            data: {
              id: randomUUID(),
              customerId,
              active: input.active ?? true,
              language: input.language ?? null,
              status: input.status ?? "ACCEPTED",
              ...(input.type !== undefined ? { type: input.type } : {}),
              paymentMethod: input.paymentMethod ?? "CARD",
              paymentProvider: input.paymentProvider ?? null,
              tipAmount: input.tipAmount ?? null,
              tags: input.tags ?? [],
              progressiveDiscountSnapshot:
                input.progressiveDiscountSnapshot === undefined
                  ? null
                  : input.progressiveDiscountSnapshot,
              amount: input.amount ?? null,
              deliveryAddressId: resolvedDeliveryAddressId ?? null,
            },
            select: { id: true },
          });
          targetId = created.id;
        }
      }

      if (input.orderProducts !== undefined) {
        await this.replaceOrderIntentProducts(tx, targetId, input.orderProducts);
      }

      if (input.active === true) {
        const ownerCustomerId = customerId ?? existingIntentCustomerId;
        if (ownerCustomerId) {
          await db.orderIntent.updateMany({
            where: {
              customerId: ownerCustomerId,
              active: true,
              id: { not: targetId },
            },
            data: {
              active: false,
              updatedAt: new Date(),
            },
          });
        }
      }

      const saved = await db.orderIntent.findUnique({
        where: { id: targetId },
        include: {
          orderProducts: {
            include: {
              modifierGroupItems: {
                select: { id: true },
              },
            },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          },
        },
      });

      if (!saved) {
        throw new OrderIntentNotFoundError();
      }
      if (!saved.customerId) {
        throw new OrderIntentCustomerNotFoundError();
      }

      return {
        id: saved.id,
        customerId: saved.customerId,
        active: saved.active,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
        language: saved.language,
        status: saved.status,
        type: saved.type,
        paymentMethod: saved.paymentMethod,
        paymentProvider: saved.paymentProvider,
        tipAmount: saved.tipAmount,
        tags: saved.tags,
        progressiveDiscountSnapshot: saved.progressiveDiscountSnapshot,
        amount: saved.amount,
        deliveryAddressId: saved.deliveryAddressId,
        orderProducts: saved.orderProducts.map((item: any) => ({
          id: item.id,
          createdAt: item.createdAt,
          productId: item.productId,
          quantity: item.quantity,
          comments: item.comments,
          fullAmount: item.fullAmount,
          amount: item.amount,
          modifierGroupItemIds: item.modifierGroupItems.map((m: any) => m.id),
        })),
      };
    });
  }

  private async replaceOrderIntentProducts(
    tx: any,
    orderIntentId: string,
    products: UpsertOrderIntentProductInput[],
  ): Promise<void> {
    const uniqueProductIds = [...new Set(products.map((item) => item.productId))];
    if (uniqueProductIds.length > 0) {
      const existingProducts = await tx.product.findMany({
        where: { id: { in: uniqueProductIds } },
        select: { id: true },
      });
      const existingProductIds = new Set(
        existingProducts.map((product: { id: string }) => product.id),
      );

      const hasInvalidProductId = uniqueProductIds.some(
        (productId) => !existingProductIds.has(productId),
      );
      if (hasInvalidProductId) {
        throw new InvalidUpsertOrderIntentPayloadError("orderProducts.productId");
      }
    }

    const uniqueModifierIds = [
      ...new Set(products.flatMap((item) => item.modifierGroupItemIds)),
    ];
    if (uniqueModifierIds.length > 0) {
      const existingModifiers = await tx.modifierGroupItem.findMany({
        where: { id: { in: uniqueModifierIds } },
        select: { id: true },
      });
      const existingModifierIds = new Set(
        existingModifiers.map((modifier: { id: string }) => modifier.id),
      );

      const hasInvalidModifierId = uniqueModifierIds.some(
        (modifierId) => !existingModifierIds.has(modifierId),
      );
      if (hasInvalidModifierId) {
        throw new InvalidUpsertOrderIntentPayloadError(
          "orderProducts.modifierGroupItemIds",
        );
      }
    }

    await tx.orderIntentProduct.deleteMany({
      where: { orderIntentId },
    });

    for (const item of products) {
      await tx.orderIntentProduct.create({
        data: {
          id: item.id,
          orderIntentId,
          productId: item.productId,
          quantity: item.quantity,
          comments: item.comments,
          fullAmount: item.fullAmount,
          amount: item.amount,
          modifierGroupItems: item.modifierGroupItemIds.length
            ? {
                connect: item.modifierGroupItemIds.map((id) => ({ id })),
              }
            : undefined,
        },
      });
    }
  }

  private async resolveDeliveryAddressIdById(input: {
    customerId: string | undefined;
    deliveryAddressId: string | null | undefined;
  }): Promise<string | null | undefined> {
    if (input.deliveryAddressId === undefined) {
      return undefined;
    }
    if (input.deliveryAddressId === null) {
      return null;
    }

    const existing = await prisma.deliveryAddress.findFirst({
      where: {
        id: input.deliveryAddressId,
        ...(input.customerId ? { customerId: input.customerId } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      throw new InvalidUpsertOrderIntentPayloadError("deliveryAddressId");
    }

    return existing.id;
  }

  private async resolveDeliveryAddressId(input: {
    branchId: string | undefined;
    customerId: string | undefined;
    deliveryAddress: string | null | undefined;
  }): Promise<string | null | undefined> {
    if (input.deliveryAddress === undefined) {
      return undefined;
    }
    if (input.deliveryAddress === null) {
      return null;
    }

    const normalized = input.deliveryAddress.trim();
    if (!normalized) {
      return null;
    }
    if (!input.customerId) {
      throw new InvalidUpsertOrderIntentPayloadError("customerPhone");
    }
    if (!input.branchId) {
      throw new InvalidUpsertOrderIntentPayloadError("branchId");
    }

    const existing = await prisma.deliveryAddress.findFirst({
      where: {
        customerId: input.customerId,
        description: {
          equals: normalized,
          mode: "insensitive",
        },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (existing) {
      return existing.id;
    }

    const geocoded = await geocodeAddress(normalized);
    if (!geocoded) {
      throw new OrderIntentDeliveryAddressNotFoundError();
    }

    const origin = await resolveOriginCoordinatesFromBranch(input.branchId);
    const distanceInKm = await getMapboxRouteDistanceInKm(origin, {
      lat: geocoded.lat,
      lng: geocoded.lng,
    });
    if (distanceInKm > MAX_DELIVERY_DISTANCE_KM) {
      throw new OrderIntentDeliveryAddressNotFoundError();
    }

    const deliveryFee = calculateDeliveryFeeInCents(distanceInKm);
    const created = await prisma.deliveryAddress.create({
      data: {
        id: randomUUID(),
        customerId: input.customerId,
        description: geocoded.description,
        street: geocoded.street,
        number: geocoded.number,
        city: geocoded.city,
        State: geocoded.state,
        zipCode: geocoded.zipCode,
        lat: String(geocoded.lat),
        lng: String(geocoded.lng),
        deliveryFee,
      },
      select: { id: true },
    });

    return created.id;
  }
}

function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function normalizePhoneWithCountryCode(value: string): string {
  const digits = normalizePhoneDigits(value);
  if (!digits) return "";
  if (digits.length < 10) return "";
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

function buildPhoneCandidates(rawPhone: string): string[] {
  const normalized = normalizePhoneDigits(rawPhone);
  if (!normalized) return [];

  const candidates = [normalized];
  if (normalized.length === 10) {
    candidates.push(`1${normalized}`);
  }
  if (normalized.length === 11 && normalized.startsWith("1")) {
    candidates.push(normalized.slice(1));
  }
  return [...new Set(candidates)];
}

async function findCustomerByPhone(
  tx: any,
  rawPhone: string,
): Promise<{ id: string } | null> {
  const candidates = buildPhoneCandidates(rawPhone);
  if (candidates.length === 0) return null;

  const exact = await tx.customer.findFirst({
    where: {
      phone: { in: candidates },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (exact) return exact;

  const contains = await tx.customer.findFirst({
    where: {
      phone: { not: null },
      OR: candidates.map((candidate) => ({
        phone: { contains: candidate },
      })),
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  return contains;
}

function stripUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  const output: Partial<T> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      output[key as keyof T] = value as T[keyof T];
    }
  }

  return output;
}

function calculateDeliveryFeeInCents(distanceInKm: number): number {
  return Math.round(
    BASE_DELIVERY_FEE_CENTS + distanceInKm * DELIVERY_FEE_PER_KM_CENTS,
  );
}

async function resolveOriginCoordinatesFromBranch(
  branchId: string,
): Promise<{ lat: number; lng: number }> {
  const rows = await prisma.$queryRaw<Array<{ lat: string | null; lng: string | null }>>`
    SELECT
      address."lat" AS "lat",
      address."lng" AS "lng"
    FROM "Branch" branch
    INNER JOIN "Address" address
      ON address."id" = branch."addressId"
    WHERE branch."id" = ${branchId}
      AND address."lat" IS NOT NULL
      AND address."lng" IS NOT NULL
    LIMIT 1
  `;

  const row = rows[0];
  if (!row?.lat || !row?.lng) {
    const exists = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true },
    });
    if (!exists) {
      throw new OrderIntentBranchNotFoundError();
    }
    return DEFAULT_BRANCH_COORDINATES;
  }

  const lat = Number.parseFloat(row.lat);
  const lng = Number.parseFloat(row.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return DEFAULT_BRANCH_COORDINATES;
  }

  return { lat, lng };
}

async function getMapboxRouteDistanceInKm(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<number> {
  const accessToken = process.env.MAPBOX_API;
  if (!accessToken) {
    throw new Error("Missing MAPBOX_API");
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    alternatives: "false",
    geometries: "geojson",
    overview: "false",
    steps: "false",
  });

  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?${params.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error("Unable to fetch route distance from Mapbox");
  }

  const payload = (await response.json()) as {
    routes?: Array<{ distance?: number }>;
  };
  const distanceMeters = payload.routes?.[0]?.distance;
  if (typeof distanceMeters !== "number") {
    throw new Error("Mapbox did not return route distance");
  }

  return distanceMeters / 1000;
}

async function geocodeAddress(query: string): Promise<{
  city: string;
  description: string;
  lat: number;
  lng: number;
  number: string;
  state: string;
  street: string;
  zipCode: string;
} | null> {
  const accessToken = process.env.MAPBOX_API;
  if (!accessToken) {
    throw new Error("Missing MAPBOX_API");
  }

  const params = new URLSearchParams({
    access_token: accessToken,
    country: "us",
    limit: "1",
    types: "address",
    autocomplete: "true",
  });

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    features?: Array<{
      address?: string;
      center?: [number, number];
      context?: Array<{ id: string; text: string }>;
      place_name?: string;
      text?: string;
    }>;
  };

  const feature = data.features?.[0];
  if (!feature?.center || !feature.place_name || !feature.address) {
    return null;
  }

  const context = feature.context ?? [];
  const getContext = (type: string) =>
    context.find((entry) => entry.id.startsWith(type))?.text ?? null;

  return {
    description: feature.place_name,
    street: feature.text ?? query,
    number: feature.address,
    city: getContext("place") ?? getContext("locality") ?? "Unknown",
    state: getContext("region") ?? "Unknown",
    zipCode: getContext("postcode") ?? "00000",
    lat: feature.center[1],
    lng: feature.center[0],
  };
}
