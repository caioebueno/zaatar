import { randomUUID } from "node:crypto";
import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../prisma.js";
import type {
  DispatchDriver,
  DispatchEntity,
  DispatchListFilters,
  MoveDispatchOrderInput,
  MoveDispatchOrderResult,
  DispatchOrder,
  DispatchRepository,
  UpdateDispatchStatusInput,
} from "../../application/ports/DispatchRepository.js";
import { DispatchNotFoundError } from "../../application/errors/DispatchNotFoundError.js";
import { DriverNotFoundError } from "../../application/errors/DriverNotFoundError.js";
import { OrderNotFoundError } from "../../application/errors/OrderNotFoundError.js";

type DispatchRow = {
  createdAt: Date;
  dispatchAt: Date | null;
  startedDeliveryAt: Date | null;
  dispatched: boolean;
  driverActive: boolean | null;
  driverCreatedAt: Date | null;
  driverId: string | null;
  driverName: string | null;
  driverPriorityLevel: number | null;
  estimatedDeliveryDurationMinutes: number | null;
  estimatedRoundTripDurationMinutes: number | null;
  id: string;
  queueIndex: number | null;
};

type DispatchOrderRow = {
  createdAt: Date;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddressCity: string | null;
  deliveryAddressComplement: string | null;
  deliveryAddressCreatedAt: Date | null;
  deliveryAddressCustomerId: string | null;
  deliveryAddressDescription: string | null;
  deliveryAddressFee: number | null;
  deliveryAddressId: string | null;
  deliveryAddressLat: string | null;
  deliveryAddressLng: string | null;
  deliveryAddressNumber: string | null;
  deliveryAddressNumberComplement: string | null;
  deliveryAddressState: string | null;
  deliveryAddressStreet: string | null;
  deliveryAddressZipCode: string | null;
  delivered: boolean;
  deliveredAt: Date | null;
  dispatchId: string;
  dispatchIdOnOrder: string | null;
  dispatchOrderIndex: number | null;
  estimatedDeliveryDurationMinutes: number | null;
  externalId: string | null;
  id: string;
  language: string | null;
  number: string | null;
  paidAt: Date | null;
  paymentMethod: string;
  progressiveDiscountSnapshot: unknown | null;
  scheduleFor: Date | null;
  tipAmount: number | null;
  type: string;
};

type DispatchOrderProductRow = {
  amount: number;
  comments: string | null;
  fullAmount: number;
  id: string;
  modifierGroupItems: Array<{
    description: string | null;
    id: string;
    name: string;
    price: number;
    translations: unknown;
  }>;
  orderId: string | null;
  product: {
    categoryId: string | null;
    comparedAtPrice: number | null;
    description: string | null;
    id: string;
    name: string;
    price: number | null;
    translations: unknown;
  };
  productId: string;
  quantity: number;
};

type OrderReadinessRow = {
  orderId: string;
  readyForDelivery: boolean;
};

type DispatchLatestRoutePointRow = {
  accuracyMeters: number | null;
  altitudeMeters: number | null;
  createdAt: Date;
  dispatchId: string;
  headingDegrees: number | null;
  id: string;
  isMocked: boolean | null;
  lat: number;
  lng: number;
  recordedAt: Date;
  sequence: number;
  sessionId: string;
  source: string;
  speedMps: number | null;
};

type RedeemedRewardOutput = {
  couponCode?: string | null;
  customerId: string;
  description?: string;
  expiresAt: string | null;
  id: string;
  issuedAt: string;
  product?: {
    categoryId?: string;
    comparedAtPrice: number | null;
    description?: string;
    id: string;
    name: string;
    price: number | null;
    translations?: Record<string, Record<string, string>>;
  };
  productId?: string | null;
  quantity?: number | null;
  redeemedAt: string | null;
  status: "ACTIVE" | "REDEEMED" | "EXPIRED" | "CANCELED";
  title: string;
  type: "FREE_PRODUCT" | "PERCENT_DISCOUNT" | "FIXED_DISCOUNT" | "CUSTOM";
  value?: number | null;
};

function mapDriver(row: DispatchRow): DispatchDriver | undefined {
  if (
    !row.driverId ||
    !row.driverCreatedAt ||
    !row.driverName ||
    row.driverActive === null ||
    row.driverPriorityLevel === null
  ) {
    return undefined;
  }

  return {
    id: row.driverId,
    createdAt: row.driverCreatedAt.toISOString(),
    name: row.driverName,
    active: row.driverActive,
    priorityLevel: row.driverPriorityLevel,
  };
}

function mapDispatch(
  row: DispatchRow,
  orderRows: DispatchOrderRow[],
  orderProductsByOrderId: Map<string, unknown[]>,
  redeemedRewardsByOrderId: Map<string, RedeemedRewardOutput[]>,
  preparationStepCategoriesByOrderId: Map<string, unknown[]>,
  orderReadinessByOrderId: Map<string, boolean>,
  latestRoutePointByDispatchId: Map<
    string,
    {
      accuracyMeters: number | null;
      altitudeMeters: number | null;
      createdAt: string;
      headingDegrees: number | null;
      id: string;
      isMocked: boolean | null;
      lat: number;
      lng: number;
      recordedAt: string;
      sequence: number;
      sessionId: string;
      source: string;
      speedMps: number | null;
    }
  >,
): DispatchEntity {
  const dispatchOrderRows = orderRows.filter((orderRow) => orderRow.dispatchId === row.id);

  const orders: DispatchOrder[] = dispatchOrderRows.map((orderRow, index) => ({
    id: orderRow.id,
    createdAt: orderRow.createdAt.toISOString(),
    scheduleFor: orderRow.scheduleFor ? orderRow.scheduleFor.toISOString() : null,
    language: orderRow.language,
    paidAt: orderRow.paidAt ? orderRow.paidAt.toISOString() : null,
    ...(orderRow.progressiveDiscountSnapshot &&
    typeof orderRow.progressiveDiscountSnapshot === "object"
      ? { progressiveDiscountSnapshot: orderRow.progressiveDiscountSnapshot }
      : {}),
    ...(orderRow.deliveredAt ? { deliveredAt: orderRow.deliveredAt.toISOString() } : {}),
    estimatedDeliveryDurationMinutes: orderRow.estimatedDeliveryDurationMinutes,
    dispatchOrderIndex: orderRow.dispatchOrderIndex ?? index + 1,
    number: orderRow.number || undefined,
    externalId: orderRow.externalId,
    delivered: orderRow.delivered,
    type: orderRow.type,
    paymentMethod: orderRow.paymentMethod,
    tip: orderRow.tipAmount ?? undefined,
    tipAmount: orderRow.tipAmount ?? undefined,
    dispatchId: orderRow.dispatchIdOnOrder || undefined,
    costumerId: orderRow.customerId || undefined,
    ...(orderRow.customerId
      ? {
          customer: {
            id: orderRow.customerId,
            name: orderRow.customerName,
            phone: orderRow.customerPhone,
          },
        }
      : {}),
    redeemedRewards: redeemedRewardsByOrderId.get(orderRow.id) || [],
    ...(orderRow.deliveryAddressId
      ? {
          deliveryAddress: {
            id: orderRow.deliveryAddressId,
            createdAt: orderRow.deliveryAddressCreatedAt?.toISOString() || "",
            description: orderRow.deliveryAddressDescription || "",
            street: orderRow.deliveryAddressStreet || "",
            number: orderRow.deliveryAddressNumber || "",
            city: orderRow.deliveryAddressCity || "",
            state: orderRow.deliveryAddressState || "",
            zipCode: orderRow.deliveryAddressZipCode || "",
            lat: orderRow.deliveryAddressLat || "",
            lng: orderRow.deliveryAddressLng || "",
            complement: orderRow.deliveryAddressComplement ?? undefined,
            numberComplement: orderRow.deliveryAddressNumberComplement ?? undefined,
            customerId: orderRow.deliveryAddressCustomerId ?? undefined,
            deliveryFee: orderRow.deliveryAddressFee ?? undefined,
          },
        }
      : {}),
    orderProducts: orderProductsByOrderId.get(orderRow.id) || [],
    preparationTaskStation:
      preparationStepCategoriesByOrderId.get(orderRow.id) || [],
  }));

  const driver = mapDriver(row);
  const latestRoutePoint = latestRoutePointByDispatchId.get(row.id);
  const allOrdersDelivered = orders.length > 0 && orders.every((order) => order.delivered);
  const allOrdersReadyForDelivery =
    orders.length > 0 &&
    orders.every((order) => orderReadinessByOrderId.get(order.id) ?? true);

  const status = allOrdersDelivered
    ? "DELIVERED"
    : row.startedDeliveryAt
      ? "OUT_FOR_DELIVERY"
      : allOrdersReadyForDelivery
        ? "READY_FOR_DELIVERY"
        : "PREPARING";

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    ...(row.queueIndex !== null ? { queueIndex: row.queueIndex } : {}),
    ...(row.dispatchAt ? { dispatchAt: row.dispatchAt.toISOString() } : {}),
    ...(row.startedDeliveryAt
      ? { startedDeliveryAt: row.startedDeliveryAt.toISOString() }
      : {}),
    dispatched: row.dispatched,
    status,
    ...(row.estimatedDeliveryDurationMinutes !== null
      ? {
          estimatedDeliveryDurationMinutes:
            row.estimatedDeliveryDurationMinutes,
        }
      : {}),
    ...(row.estimatedRoundTripDurationMinutes !== null
      ? {
          estimatedRoundTripDurationMinutes:
            row.estimatedRoundTripDurationMinutes,
        }
      : {}),
    ...(row.driverId ? { driverId: row.driverId } : {}),
    ...(driver ? { driver } : {}),
    ...(latestRoutePoint ? { latestRoutePoint } : {}),
    orders,
  };
}

async function getDispatchOrders(dispatchIds: string[]): Promise<DispatchOrderRow[]> {
  if (dispatchIds.length === 0) {
    return [];
  }

  return prisma.$queryRaw<DispatchOrderRow[]>`
    SELECT
      orders."dispatchId",
      orders."id",
      orders."createdAt",
      orders."scheduleFor",
      orders."language",
      orders."paidAt",
      orders."deliveredAt",
      orders."estimatedDeliveryDurationMinutes",
      orders."progressiveDiscountSnapshot",
      orders."dispatchOrderIndex",
      orders."number",
      orders."externalId",
      (orders."deliveredAt" IS NOT NULL) AS "delivered",
      orders."customerId",
      customer."name" AS "customerName",
      customer."phone" AS "customerPhone",
      orders."type"::text AS "type",
      orders."paymentMethod"::text AS "paymentMethod",
      orders."tipAmount",
      orders."dispatchId" AS "dispatchIdOnOrder",
      deliveryAddress."id" AS "deliveryAddressId",
      deliveryAddress."createdAt" AS "deliveryAddressCreatedAt",
      deliveryAddress."description" AS "deliveryAddressDescription",
      deliveryAddress."street" AS "deliveryAddressStreet",
      deliveryAddress."number" AS "deliveryAddressNumber",
      deliveryAddress."city" AS "deliveryAddressCity",
      deliveryAddress."State" AS "deliveryAddressState",
      deliveryAddress."zipCode" AS "deliveryAddressZipCode",
      deliveryAddress."lat" AS "deliveryAddressLat",
      deliveryAddress."lng" AS "deliveryAddressLng",
      deliveryAddress."complement" AS "deliveryAddressComplement",
      deliveryAddress."numberComplement" AS "deliveryAddressNumberComplement",
      deliveryAddress."customerId" AS "deliveryAddressCustomerId",
      deliveryAddress."deliveryFee" AS "deliveryAddressFee"
    FROM "Order" orders
    LEFT JOIN "Customer" customer
      ON customer."id" = orders."customerId"
    LEFT JOIN "DeliveryAddress" deliveryAddress
      ON deliveryAddress."id" = orders."deliveryAddressId"
    WHERE orders."dispatchId" IN (${Prisma.join(dispatchIds)})
    ORDER BY
      orders."dispatchOrderIndex" ASC NULLS LAST,
      orders."createdAt" ASC
  `;
}

async function getDispatchOrderProducts(
  orderIds: string[],
): Promise<Map<string, unknown[]>> {
  if (orderIds.length === 0) {
    return new Map();
  }

  const orderProducts = await prisma.orderProducts.findMany({
    where: {
      orderId: {
        in: orderIds,
      },
    },
    include: {
      product: true,
      modifierGroupItems: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const rows = orderProducts as unknown as DispatchOrderProductRow[];
  const orderProductsByOrderId = new Map<string, unknown[]>();

  for (const row of rows) {
    if (!row.orderId) continue;

    const current = orderProductsByOrderId.get(row.orderId) || [];

    current.push({
      id: row.id,
      productId: row.productId,
      product: {
        id: row.product.id,
        name: row.product.name,
        description: row.product.description,
        price: row.product.price,
        categoryId: row.product.categoryId,
        comparedAtPrice: row.product.comparedAtPrice,
        translations:
          row.product.translations &&
          typeof row.product.translations === "object"
            ? (row.product.translations as Record<string, Record<string, string>>)
            : undefined,
      },
      comments: row.comments || undefined,
      selectedModifierGroupItemIds: row.modifierGroupItems.map(
        (modifierItem) => modifierItem.id,
      ),
      selectedModifierGroupItems: row.modifierGroupItems.map((modifierItem) => ({
        id: modifierItem.id,
        name: modifierItem.name,
        description: modifierItem.description || undefined,
        price: modifierItem.price,
        translations:
          modifierItem.translations &&
          typeof modifierItem.translations === "object"
            ? (modifierItem.translations as Record<string, Record<string, string>>)
            : undefined,
      })),
      amount: row.amount,
      fullAmount: row.fullAmount,
      quantity: row.quantity,
    });

    orderProductsByOrderId.set(row.orderId, current);
  }

  return orderProductsByOrderId;
}

async function getDispatchPreparationStepCategories(
  orderIds: string[],
): Promise<Map<string, unknown[]>> {
  if (orderIds.length === 0) {
    return new Map();
  }

  const categories = await prisma.preparationStepCategory.findMany({
    where: {
      orderId: {
        in: orderIds,
      },
    },
    include: {
      station: true,
      preparationStepTracks: {
        include: {
          preparationStep: true,
          preparationStepModifierTracks: {
            include: {
              modifierGroupItem: {
                include: {
                  photo: {
                    select: {
                      id: true,
                      url: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const categoriesByOrderId = new Map<string, unknown[]>();

  for (const category of categories) {
    const current = categoriesByOrderId.get(category.orderId) || [];

    current.push({
      id: category.id,
      stationId: category.stationId ?? undefined,
      completed: category.completed,
      orderId: category.orderId,
      snoozes: [],
      station: {
        id: category.station?.id ?? category.id,
        name: category.station?.name ?? "Preparation",
      },
      steps: category.preparationStepTracks.map((track) => ({
        id: track.id,
        name: track.preparationStep.name,
        quantity: track.quantity || 1,
        completed: track.completed,
        preparationStepId: track.preparationStepId,
        preparationStepCategoryId: track.preparationStepCategoryId,
        comments: track.comments || undefined,
        completedComments: track.completedComments,
        preparationStepModifiers: track.preparationStepModifierTracks.map(
          (modifierTrack) => ({
            id: modifierTrack.id,
            completed: modifierTrack.completed,
            modifierGroupItem: modifierTrack.modifierGroupItemId,
            modifierGtroupItem: {
              id: modifierTrack.modifierGroupItem.id,
              name: modifierTrack.modifierGroupItem.name,
              price: modifierTrack.modifierGroupItem.price,
              description: modifierTrack.modifierGroupItem.description || undefined,
              ...(modifierTrack.modifierGroupItem.photo
                ? {
                    photo: {
                      id: modifierTrack.modifierGroupItem.photo.id,
                      url: modifierTrack.modifierGroupItem.photo.url,
                    },
                  }
                : {}),
              ...(modifierTrack.modifierGroupItem.translations &&
              typeof modifierTrack.modifierGroupItem.translations === "object"
                ? {
                    translations: modifierTrack.modifierGroupItem
                      .translations as Record<string, Record<string, string>>,
                  }
                : {}),
            },
          }),
        ),
      })),
    });

    categoriesByOrderId.set(category.orderId, current);
  }

  return categoriesByOrderId;
}

async function getOrderReadinessByOrderIds(
  orderIds: string[],
): Promise<Map<string, boolean>> {
  const normalizedOrderIds = Array.from(
    new Set(
      orderIds.map((orderId) => orderId.trim()).filter((orderId) => orderId.length > 0),
    ),
  );

  if (normalizedOrderIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.$queryRaw<OrderReadinessRow[]>`
    SELECT
      orders."id" AS "orderId",
      NOT EXISTS (
        SELECT 1
        FROM "PreparationStepCategory" category
        INNER JOIN "PreparationStepTrack" track
          ON track."preparationStepCategoryId" = category."id"
        WHERE category."orderId" = orders."id"
          AND track."completed" = false
      ) AS "readyForDelivery"
    FROM "Order" orders
    WHERE orders."id" IN (${Prisma.join(normalizedOrderIds)})
  `;

  const map = new Map<string, boolean>();

  for (const row of rows) {
    map.set(row.orderId, row.readyForDelivery);
  }

  return map;
}

async function getRedeemedRewardsByOrderIds(
  orderIds: string[],
): Promise<Map<string, RedeemedRewardOutput[]>> {
  const normalizedOrderIds = Array.from(
    new Set(
      orderIds.map((orderId) => orderId.trim()).filter((orderId) => orderId.length > 0),
    ),
  );

  if (normalizedOrderIds.length === 0) {
    return new Map();
  }

  const redeemedRewards = await prisma.customerReward.findMany({
    where: {
      redeemedByOrderId: {
        in: normalizedOrderIds,
      },
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const rewardsByOrderId = new Map<string, RedeemedRewardOutput[]>();

  for (const reward of redeemedRewards) {
    if (!reward.redeemedByOrderId) continue;

    const current = rewardsByOrderId.get(reward.redeemedByOrderId) || [];

    current.push({
      id: reward.id,
      customerId: reward.customerId,
      status: reward.status,
      type: reward.type,
      title: reward.title,
      description: reward.description || undefined,
      quantity: reward.quantity,
      value: reward.value,
      couponCode: reward.couponCode,
      issuedAt: reward.issuedAt.toISOString(),
      expiresAt: reward.expiresAt ? reward.expiresAt.toISOString() : null,
      redeemedAt: reward.redeemedAt ? reward.redeemedAt.toISOString() : null,
      productId: reward.productId,
      ...(reward.product
        ? {
            product: {
              id: reward.product.id,
              name: reward.product.name,
              categoryId: reward.product.categoryId || undefined,
              description: reward.product.description || undefined,
              price: reward.product.price,
              comparedAtPrice: reward.product.comparedAtPrice,
              translations:
                reward.product.translations &&
                typeof reward.product.translations === "object"
                  ? (reward.product.translations as Record<
                      string,
                      Record<string, string>
                    >)
                  : undefined,
            },
          }
        : {}),
    });

    rewardsByOrderId.set(reward.redeemedByOrderId, current);
  }

  return rewardsByOrderId;
}

async function getLatestRoutePointByDispatchIds(
  dispatchIds: string[],
): Promise<
  Map<
    string,
    {
      accuracyMeters: number | null;
      altitudeMeters: number | null;
      createdAt: string;
      headingDegrees: number | null;
      id: string;
      isMocked: boolean | null;
      lat: number;
      lng: number;
      recordedAt: string;
      sequence: number;
      sessionId: string;
      source: string;
      speedMps: number | null;
    }
  >
> {
  if (dispatchIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.$queryRaw<DispatchLatestRoutePointRow[]>`
    SELECT
      latest_points."dispatchId",
      latest_points."id",
      latest_points."sessionId",
      latest_points."sequence",
      latest_points."createdAt",
      latest_points."recordedAt",
      latest_points."lat",
      latest_points."lng",
      latest_points."accuracyMeters",
      latest_points."speedMps",
      latest_points."headingDegrees",
      latest_points."altitudeMeters",
      latest_points."source"::text AS "source",
      latest_points."isMocked"
    FROM (
      SELECT
        session."dispatchId",
        point."id",
        point."sessionId",
        point."sequence",
        point."createdAt",
        point."recordedAt",
        point."lat",
        point."lng",
        point."accuracyMeters",
        point."speedMps",
        point."headingDegrees",
        point."altitudeMeters",
        point."source",
        point."isMocked",
        ROW_NUMBER() OVER (
          PARTITION BY session."dispatchId"
          ORDER BY
            point."recordedAt" DESC,
            point."createdAt" DESC,
            point."sequence" DESC
        ) AS "rowNumber"
      FROM "DispatchRoutePoint" point
      INNER JOIN "DispatchRouteSession" session
        ON session."id" = point."sessionId"
      WHERE session."dispatchId" IN (${Prisma.join(dispatchIds)})
    ) latest_points
    WHERE latest_points."rowNumber" = 1
  `;

  const map = new Map<
    string,
    {
      accuracyMeters: number | null;
      altitudeMeters: number | null;
      createdAt: string;
      headingDegrees: number | null;
      id: string;
      isMocked: boolean | null;
      lat: number;
      lng: number;
      recordedAt: string;
      sequence: number;
      sessionId: string;
      source: string;
      speedMps: number | null;
    }
  >();

  for (const row of rows) {
    map.set(row.dispatchId, {
      id: row.id,
      sessionId: row.sessionId,
      sequence: row.sequence,
      createdAt: row.createdAt.toISOString(),
      recordedAt: row.recordedAt.toISOString(),
      lat: row.lat,
      lng: row.lng,
      accuracyMeters: row.accuracyMeters,
      speedMps: row.speedMps,
      headingDegrees: row.headingDegrees,
      altitudeMeters: row.altitudeMeters,
      source: row.source,
      isMocked: row.isMocked,
    });
  }

  return map;
}

async function assertDriverCanBeAssigned(
  tx: Prisma.TransactionClient,
  driverId: string,
): Promise<void> {
  const [driver] = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "Driver"
    WHERE "id" = ${driverId}
    LIMIT 1
  `;

  if (!driver) {
    throw new DriverNotFoundError();
  }
}

async function normalizeDispatchQueueIndexes(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.$executeRaw`
    WITH ranked_dispatches AS (
      SELECT
        dispatch."id",
        ROW_NUMBER() OVER (
          ORDER BY
            COALESCE(dispatch."queueIndex", 2147483647) ASC,
            dispatch."createdAt" ASC,
            dispatch."id" ASC
        ) AS "nextQueueIndex"
      FROM "Dispatch" dispatch
    )
    UPDATE "Dispatch" dispatch
    SET "queueIndex" = ranked_dispatches."nextQueueIndex"
    FROM ranked_dispatches
    WHERE dispatch."id" = ranked_dispatches."id"
  `;
}

async function moveDispatchToQueueIndex(
  tx: Prisma.TransactionClient,
  dispatchId: string,
  targetQueueIndex: number,
): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT dispatch."id"
    FROM "Dispatch" dispatch
    ORDER BY
      COALESCE(dispatch."queueIndex", 2147483647) ASC,
      dispatch."createdAt" ASC,
      dispatch."id" ASC
  `;

  const orderedDispatchIds = rows.map((row) => row.id);
  const fromIndex = orderedDispatchIds.findIndex((id) => id === dispatchId);

  if (fromIndex === -1) {
    throw new DispatchNotFoundError();
  }

  const movedDispatchId = orderedDispatchIds[fromIndex];
  orderedDispatchIds.splice(fromIndex, 1);

  const clampedTargetIndex = Math.max(
    1,
    Math.min(targetQueueIndex, orderedDispatchIds.length + 1),
  );
  orderedDispatchIds.splice(clampedTargetIndex - 1, 0, movedDispatchId);

  for (const [index, id] of orderedDispatchIds.entries()) {
    await tx.$executeRaw`
      UPDATE "Dispatch"
      SET "queueIndex" = ${index + 1}
      WHERE "id" = ${id}
    `;
  }
}

async function normalizeDispatchOrderIndexes(
  tx: Prisma.TransactionClient,
  dispatchId: string,
): Promise<void> {
  await tx.$executeRaw`
    WITH ranked_orders AS (
      SELECT
        orders."id",
        ROW_NUMBER() OVER (
          ORDER BY
            COALESCE(orders."dispatchOrderIndex", 2147483647) ASC,
            orders."createdAt" ASC,
            orders."id" ASC
        ) AS "nextIndex"
      FROM "Order" orders
      WHERE orders."dispatchId" = ${dispatchId}
    )
    UPDATE "Order" orders
    SET "dispatchOrderIndex" = ranked_orders."nextIndex"
    FROM ranked_orders
    WHERE orders."id" = ranked_orders."id"
  `;
}

export class PrismaDispatchRepository implements DispatchRepository {
  async driverExists(driverId: string): Promise<boolean> {
    const [row] = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT driver."id"
      FROM "Driver" driver
      WHERE driver."id" = ${driverId}
      LIMIT 1
    `;

    return Boolean(row?.id);
  }

  async updateDriverAssignment(
    dispatchId: string,
    driverId: string | null,
  ): Promise<DispatchEntity | null> {
    const [updatedDispatchRow] = await prisma.$queryRaw<Array<{ id: string }>>`
      UPDATE "Dispatch"
      SET "driverId" = ${driverId}
      WHERE "id" = ${dispatchId}
      RETURNING "id"
    `;

    if (!updatedDispatchRow) {
      return null;
    }

    const [dispatchRow] = await prisma.$queryRaw<DispatchRow[]>`
      SELECT
        dispatch."id",
        dispatch."createdAt",
        dispatch."queueIndex",
        dispatch."dispatchAt",
        dispatch."startedDeliveryAt",
        dispatch."dispatched",
        dispatch."estimatedDeliveryDurationMinutes",
        dispatch."estimatedRoundTripDurationMinutes",
        dispatch."driverId",
        driver."createdAt" AS "driverCreatedAt",
        driver."name" AS "driverName",
        driver."active" AS "driverActive",
        driver."priorityLevel" AS "driverPriorityLevel"
      FROM "Dispatch" dispatch
      LEFT JOIN "Driver" driver ON driver."id" = dispatch."driverId"
      WHERE dispatch."id" = ${dispatchId}
      LIMIT 1
    `;

    if (!dispatchRow) {
      return null;
    }

    const orderRows = await getDispatchOrders([dispatchRow.id]);
    const orderIds = orderRows.map((order) => order.id);
    const orderProductsByOrderId = await getDispatchOrderProducts(orderIds);
    const redeemedRewardsByOrderId = await getRedeemedRewardsByOrderIds(orderIds);
    const preparationStepCategoriesByOrderId =
      await getDispatchPreparationStepCategories(orderIds);
    const orderReadinessByOrderId = await getOrderReadinessByOrderIds(orderIds);
    const latestRoutePointByDispatchId = await getLatestRoutePointByDispatchIds([
      dispatchRow.id,
    ]);

    return mapDispatch(
      dispatchRow,
      orderRows,
      orderProductsByOrderId,
      redeemedRewardsByOrderId,
      preparationStepCategoriesByOrderId,
      orderReadinessByOrderId,
      latestRoutePointByDispatchId,
    );
  }

  async updateStatus(input: UpdateDispatchStatusInput): Promise<DispatchEntity> {
    await prisma.$transaction(async (tx) => {
      const [existingDispatch] = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Dispatch"
        WHERE "id" = ${input.dispatchId}
        LIMIT 1
      `;

      if (!existingDispatch) {
        throw new DispatchNotFoundError();
      }

      const updates: Prisma.Sql[] = [];
      const parsedDispatchAt =
        typeof input.dispatchAt === "string" ? new Date(input.dispatchAt) : null;

      if (input.dispatched !== undefined) {
        updates.push(Prisma.sql`"dispatched" = ${input.dispatched}`);
        updates.push(
          input.dispatched
            ? Prisma.sql`"dispatchAt" = ${
                parsedDispatchAt ??
                Prisma.sql`COALESCE("dispatchAt", CURRENT_TIMESTAMP)`
              }`
            : Prisma.sql`"dispatchAt" = NULL`,
        );
      }

      if (input.driverId !== undefined) {
        if (input.driverId !== null) {
          await assertDriverCanBeAssigned(tx, input.driverId);
        }
        updates.push(Prisma.sql`"driverId" = ${input.driverId}`);
      }

      if (updates.length > 0) {
        await tx.$executeRaw`
          UPDATE "Dispatch"
          SET ${Prisma.join(updates, ", ")}
          WHERE "id" = ${input.dispatchId}
        `;
      }

      if (input.queueIndex !== undefined) {
        await normalizeDispatchQueueIndexes(tx);
        await moveDispatchToQueueIndex(tx, input.dispatchId, input.queueIndex);
      }
    });

    const dispatch = await this.getDispatchById(input.dispatchId);
    if (!dispatch) {
      throw new DispatchNotFoundError();
    }
    return dispatch;
  }

  async moveOrder(input: MoveDispatchOrderInput): Promise<MoveDispatchOrderResult> {
    return prisma.$transaction(async (tx) => {
      const [order] = await tx.$queryRaw<
        Array<{
          dispatchId: string | null;
          id: string;
        }>
      >`
        SELECT "id", "dispatchId"
        FROM "Order"
        WHERE "id" = ${input.orderId}
        LIMIT 1
      `;

      if (!order) {
        throw new OrderNotFoundError();
      }

      let targetDispatchId = input.targetDispatchId;
      let createdDispatch = false;

      if (input.createNewDispatch) {
        targetDispatchId = randomUUID();
        createdDispatch = true;

        await tx.$executeRaw`
          INSERT INTO "Dispatch" ("id", "queueIndex", "dispatched", "dispatchAt", "driverId")
          VALUES (
            ${targetDispatchId},
            (
              SELECT COALESCE(MAX(dispatch."queueIndex"), 0) + 1
              FROM "Dispatch" dispatch
            ),
            false,
            NULL,
            NULL
          )
        `;
      } else {
        targetDispatchId = targetDispatchId || order.dispatchId || undefined;

        if (!targetDispatchId) {
          throw new DispatchNotFoundError();
        }

        const [targetDispatch] = await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "Dispatch"
          WHERE "id" = ${targetDispatchId}
          LIMIT 1
        `;

        if (!targetDispatch) {
          throw new DispatchNotFoundError();
        }
      }

      const sourceDispatchId = order.dispatchId || undefined;

      await tx.$executeRaw`
        UPDATE "Order"
        SET
          "dispatchId" = NULL,
          "dispatchOrderIndex" = NULL
        WHERE "id" = ${input.orderId}
      `;

      if (sourceDispatchId) {
        await normalizeDispatchOrderIndexes(tx, sourceDispatchId);
      }

      const [targetCountResult] = await tx.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::BIGINT AS "count"
        FROM "Order"
        WHERE "dispatchId" = ${targetDispatchId}
      `;

      const targetOrderCount = Number(targetCountResult?.count ?? 0);
      const insertIndex =
        input.targetIndex === undefined
          ? targetOrderCount + 1
          : Math.max(1, Math.min(input.targetIndex, targetOrderCount + 1));

      await tx.$executeRaw`
        UPDATE "Order"
        SET "dispatchOrderIndex" = "dispatchOrderIndex" + 1
        WHERE "dispatchId" = ${targetDispatchId}
          AND "dispatchOrderIndex" >= ${insertIndex}
      `;

      await tx.$executeRaw`
        UPDATE "Order"
        SET
          "dispatchId" = ${targetDispatchId},
          "dispatchOrderIndex" = ${insertIndex}
        WHERE "id" = ${input.orderId}
      `;

      await normalizeDispatchOrderIndexes(tx, targetDispatchId);

      const [movedOrder] = await tx.$queryRaw<Array<{ dispatchOrderIndex: number | null }>>`
        SELECT "dispatchOrderIndex"
        FROM "Order"
        WHERE "id" = ${input.orderId}
        LIMIT 1
      `;

      let sourceDispatchDeleted = false;
      if (sourceDispatchId && sourceDispatchId !== targetDispatchId) {
        const [sourceCountResult] = await tx.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*)::BIGINT AS "count"
          FROM "Order"
          WHERE "dispatchId" = ${sourceDispatchId}
        `;

        if (Number(sourceCountResult?.count ?? 0) === 0) {
          await tx.$executeRaw`
            DELETE FROM "Dispatch"
            WHERE "id" = ${sourceDispatchId}
          `;
          await normalizeDispatchQueueIndexes(tx);
          sourceDispatchDeleted = true;
        }
      }

      return {
        orderId: input.orderId,
        sourceDispatchId,
        targetDispatchId,
        targetIndex: movedOrder?.dispatchOrderIndex || insertIndex,
        createdDispatch,
        sourceDispatchDeleted,
      };
    });
  }

  async ensureActiveRouteSession(
    dispatchId: string,
    driverId: string,
    startedAt: Date,
  ): Promise<void> {
    const now = new Date();

    await prisma.$executeRaw`
      INSERT INTO "DispatchRouteSession" (
        "id",
        "createdAt",
        "updatedAt",
        "dispatchId",
        "driverId",
        "startedAt",
        "status"
      )
      SELECT
        ${randomUUID()},
        ${now},
        ${now},
        ${dispatchId},
        ${driverId},
        ${startedAt},
        'ACTIVE'::"DispatchRouteSessionStatus"
      WHERE NOT EXISTS (
        SELECT 1
        FROM "DispatchRouteSession" session
        WHERE session."dispatchId" = ${dispatchId}
          AND session."driverId" = ${driverId}
          AND session."status" = 'ACTIVE'::"DispatchRouteSessionStatus"
      )
    `;
  }

  async list(filters: DispatchListFilters = {}): Promise<DispatchEntity[]> {
    const whereClauses: Prisma.Sql[] = [
      Prisma.sql`(
        (
          dispatch."createdAt" >= DATE_TRUNC('day', CURRENT_TIMESTAMP)
          AND dispatch."createdAt" < DATE_TRUNC('day', CURRENT_TIMESTAMP) + INTERVAL '1 day'
        )
        OR (
          (
            dispatch."createdAt" < DATE_TRUNC('day', CURRENT_TIMESTAMP)
            OR dispatch."createdAt" >= DATE_TRUNC('day', CURRENT_TIMESTAMP) + INTERVAL '1 day'
          )
          AND (
            dispatch."dispatched" = false
            OR EXISTS (
              SELECT 1
              FROM "Order" orders
              WHERE orders."dispatchId" = dispatch."id"
                AND orders."deliveredAt" IS NULL
            )
          )
        )
      )`,
    ];

    if (filters.status === "active") {
      whereClauses.push(
        Prisma.sql`
          dispatch."driverId" IS NOT NULL
          AND dispatch."startedDeliveryAt" IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM "Order" activeOrders
            WHERE activeOrders."dispatchId" = dispatch."id"
              AND activeOrders."deliveredAt" IS NULL
          )
          AND NOT EXISTS (
            SELECT 1
            FROM "Dispatch" newerDispatch
            WHERE newerDispatch."driverId" = dispatch."driverId"
              AND newerDispatch."startedDeliveryAt" IS NOT NULL
              AND EXISTS (
                SELECT 1
                FROM "Order" newerActiveOrders
                WHERE newerActiveOrders."dispatchId" = newerDispatch."id"
                  AND newerActiveOrders."deliveredAt" IS NULL
              )
              AND (
                newerDispatch."startedDeliveryAt" > dispatch."startedDeliveryAt"
                OR (
                  newerDispatch."startedDeliveryAt" = dispatch."startedDeliveryAt"
                  AND newerDispatch."createdAt" > dispatch."createdAt"
                )
              )
          )
        `,
      );
    }

    const dispatchRows = await prisma.$queryRaw<DispatchRow[]>`
      SELECT
        dispatch."id",
        dispatch."createdAt",
        dispatch."queueIndex",
        dispatch."dispatchAt",
        dispatch."startedDeliveryAt",
        dispatch."dispatched",
        dispatch."estimatedDeliveryDurationMinutes",
        dispatch."estimatedRoundTripDurationMinutes",
        dispatch."driverId",
        driver."createdAt" AS "driverCreatedAt",
        driver."name" AS "driverName",
        driver."active" AS "driverActive",
        driver."priorityLevel" AS "driverPriorityLevel"
      FROM "Dispatch" dispatch
      LEFT JOIN "Driver" driver ON driver."id" = dispatch."driverId"
      WHERE ${Prisma.join(whereClauses, " AND ")}
      ORDER BY
        dispatch."dispatched" DESC,
        COALESCE(dispatch."queueIndex", 2147483647) ASC,
        COALESCE(dispatch."dispatchAt", dispatch."createdAt") ASC,
        dispatch."createdAt" ASC
    `;

    const dispatchIds = dispatchRows.map((dispatch) => dispatch.id);
    const orderRows = await getDispatchOrders(dispatchIds);
    const orderIds = orderRows.map((order) => order.id);
    const orderProductsByOrderId = await getDispatchOrderProducts(orderIds);
    const redeemedRewardsByOrderId = await getRedeemedRewardsByOrderIds(orderIds);
    const preparationStepCategoriesByOrderId =
      await getDispatchPreparationStepCategories(orderIds);
    const orderReadinessByOrderId = await getOrderReadinessByOrderIds(orderIds);
    const latestRoutePointByDispatchId =
      await getLatestRoutePointByDispatchIds(dispatchIds);

    return dispatchRows.map((dispatch) =>
      mapDispatch(
        dispatch,
        orderRows,
        orderProductsByOrderId,
        redeemedRewardsByOrderId,
        preparationStepCategoriesByOrderId,
        orderReadinessByOrderId,
        latestRoutePointByDispatchId,
      ),
    );
  }

  async findDriverIdByDispatchId(dispatchId: string): Promise<string | null> {
    const [row] = await prisma.$queryRaw<Array<{ driverId: string | null }>>`
      SELECT dispatch."driverId"
      FROM "Dispatch" dispatch
      WHERE dispatch."id" = ${dispatchId}
      LIMIT 1
    `;

    return row?.driverId ?? null;
  }

  async findNextForDriver(driverId: string): Promise<DispatchEntity | null> {
    const [dispatchRow] = await prisma.$queryRaw<DispatchRow[]>`
      SELECT
        dispatch."id",
        dispatch."createdAt",
        dispatch."queueIndex",
        dispatch."dispatchAt",
        dispatch."startedDeliveryAt",
        dispatch."dispatched",
        dispatch."estimatedDeliveryDurationMinutes",
        dispatch."estimatedRoundTripDurationMinutes",
        dispatch."driverId",
        driver."createdAt" AS "driverCreatedAt",
        driver."name" AS "driverName",
        driver."active" AS "driverActive",
        driver."priorityLevel" AS "driverPriorityLevel"
      FROM "Dispatch" dispatch
      LEFT JOIN "Driver" driver ON driver."id" = dispatch."driverId"
      WHERE dispatch."driverId" = ${driverId}
        AND EXISTS (
          SELECT 1
          FROM "Order" orders
          WHERE orders."dispatchId" = dispatch."id"
            AND orders."deliveredAt" IS NULL
        )
      ORDER BY
        dispatch."dispatched" DESC,
        COALESCE(dispatch."queueIndex", 2147483647) ASC,
        COALESCE(dispatch."dispatchAt", dispatch."createdAt") ASC,
        dispatch."createdAt" ASC
      LIMIT 1
    `;

    if (!dispatchRow) {
      return null;
    }

    const orderRows = await getDispatchOrders([dispatchRow.id]);
    const orderIds = orderRows.map((order) => order.id);
    const orderProductsByOrderId = await getDispatchOrderProducts(orderIds);
    const redeemedRewardsByOrderId = await getRedeemedRewardsByOrderIds(orderIds);
    const preparationStepCategoriesByOrderId =
      await getDispatchPreparationStepCategories(orderIds);
    const orderReadinessByOrderId = await getOrderReadinessByOrderIds(orderIds);
    const latestRoutePointByDispatchId = await getLatestRoutePointByDispatchIds([
      dispatchRow.id,
    ]);

    return mapDispatch(
      dispatchRow,
      orderRows,
      orderProductsByOrderId,
      redeemedRewardsByOrderId,
      preparationStepCategoriesByOrderId,
      orderReadinessByOrderId,
      latestRoutePointByDispatchId,
    );
  }

  async setStartedDeliveryAt(
    dispatchId: string,
    startedDeliveryAt: Date,
  ): Promise<{ dispatchId: string; startedDeliveryAt: string } | null> {
    const [row] = await prisma.$queryRaw<
      Array<{ id: string; startedDeliveryAt: Date | null }>
    >`
      UPDATE "Dispatch"
      SET
        "startedDeliveryAt" = ${startedDeliveryAt}
      WHERE "id" = ${dispatchId}
      RETURNING
        "id",
        "startedDeliveryAt"
    `;

    if (!row || !row.startedDeliveryAt) {
      return null;
    }

    return {
      dispatchId: row.id,
      startedDeliveryAt: row.startedDeliveryAt.toISOString(),
    };
  }

  private async getDispatchById(dispatchId: string): Promise<DispatchEntity | null> {
    const [dispatchRow] = await prisma.$queryRaw<DispatchRow[]>`
      SELECT
        dispatch."id",
        dispatch."createdAt",
        dispatch."queueIndex",
        dispatch."dispatchAt",
        dispatch."startedDeliveryAt",
        dispatch."dispatched",
        dispatch."estimatedDeliveryDurationMinutes",
        dispatch."estimatedRoundTripDurationMinutes",
        dispatch."driverId",
        driver."createdAt" AS "driverCreatedAt",
        driver."name" AS "driverName",
        driver."active" AS "driverActive",
        driver."priorityLevel" AS "driverPriorityLevel"
      FROM "Dispatch" dispatch
      LEFT JOIN "Driver" driver ON driver."id" = dispatch."driverId"
      WHERE dispatch."id" = ${dispatchId}
      LIMIT 1
    `;

    if (!dispatchRow) {
      return null;
    }

    const orderRows = await getDispatchOrders([dispatchRow.id]);
    const orderIds = orderRows.map((order) => order.id);
    const orderProductsByOrderId = await getDispatchOrderProducts(orderIds);
    const redeemedRewardsByOrderId = await getRedeemedRewardsByOrderIds(orderIds);
    const preparationStepCategoriesByOrderId =
      await getDispatchPreparationStepCategories(orderIds);
    const orderReadinessByOrderId = await getOrderReadinessByOrderIds(orderIds);
    const latestRoutePointByDispatchId = await getLatestRoutePointByDispatchIds([
      dispatchRow.id,
    ]);

    return mapDispatch(
      dispatchRow,
      orderRows,
      orderProductsByOrderId,
      redeemedRewardsByOrderId,
      preparationStepCategoriesByOrderId,
      orderReadinessByOrderId,
      latestRoutePointByDispatchId,
    );
  }
}
