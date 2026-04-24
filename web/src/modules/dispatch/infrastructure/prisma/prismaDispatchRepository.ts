import { randomUUID } from "crypto";
import { DEFAULT_BRANCH_COORDINATES } from "@/constants/branch";
import prisma from "@/prisma";
import { Prisma } from "@/src/generated/prisma";
import type { Driver } from "@/src/modules/driver/domain/driver.types";
import type TAddress from "@/src/types/address";
import type TCustomer from "@/src/types/customer";
import type { TOrder } from "@/src/types/order";
import getMapboxRouteDurationInMinutes from "@/utils/getMapboxRouteDurationInMinutes";
import type { DispatchRepository } from "../../domain/dispatch.repository";
import type {
  CreateDispatchInput,
  Dispatch,
  MoveDispatchOrderInput,
  MoveDispatchOrderResult,
  UpdateDispatchInput,
  UpdateDispatchStatusInput,
} from "../../domain/dispatch.types";

type DispatchRow = {
  id: string;
  createdAt: Date;
  queueIndex: number | null;
  dispatchAt: Date | null;
  dispatched: boolean;
  estimatedDeliveryDurationMinutes: number | null;
  estimatedRoundTripDurationMinutes: number | null;
  driverId: string | null;
  driverCreatedAt: Date | null;
  driverName: string | null;
  driverActive: boolean | null;
  driverPriorityLevel: number | null;
};

type DispatchOrderRow = {
  dispatchId: string;
  id: string;
  createdAt: Date;
  scheduleFor: Date | null;
  language: string | null;
  paidAt: Date | null;
  deliveredAt: Date | null;
  estimatedDeliveryDurationMinutes: number | null;
  progressiveDiscountSnapshot: unknown | null;
  dispatchOrderIndex: number | null;
  number: string | null;
  externalId: string | null;
  delivered: boolean;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  type: TOrder["type"];
  paymentMethod: TOrder["paymentMethod"];
  tipAmount: number | null;
  dispatchIdOnOrder: string | null;
  deliveryAddressId: string | null;
  deliveryAddressCreatedAt: Date | null;
  deliveryAddressDescription: string | null;
  deliveryAddressStreet: string | null;
  deliveryAddressNumber: string | null;
  deliveryAddressCity: string | null;
  deliveryAddressState: string | null;
  deliveryAddressZipCode: string | null;
  deliveryAddressLat: string | null;
  deliveryAddressLng: string | null;
  deliveryAddressComplement: string | null;
  deliveryAddressNumberComplement: string | null;
  deliveryAddressCustomerId: string | null;
  deliveryAddressFee: number | null;
};

type DeliveryAddressCoordinatesRow = {
  id: string;
  lat: string;
  lng: string;
};

type DispatchAddressCandidateRow = {
  dispatchId: string;
  deliveryAddressId: string;
  createdAt: Date;
  lat: string;
  lng: string;
};

type DispatchOrderRouteRow = {
  id: string;
  dispatchOrderIndex: number | null;
  createdAt: Date;
  deliveryAddressId: string;
  lat: string;
  lng: string;
};

type ActiveDriverRow = {
  id: string;
  createdAt: Date;
  priorityLevel: number;
};

type BusyDriverRow = {
  driverId: string;
  driverCreatedAt: Date;
  driverPriorityLevel: number;
  estimatedRoundTripDurationMinutes: number | null;
};

type DispatchApiOrder = Omit<TOrder, "status" | "address"> & {
  customer?: TCustomer;
  delivered: boolean;
  deliveryAddress?: TAddress;
};

type DispatchOrderProductRow = {
  orderId: string | null;
  id: string;
  productId: string;
  comments: string | null;
  quantity: number;
  fullAmount: number;
  amount: number;
  product: {
    id: string;
    name: string;
    createdAt: Date;
    price: number | null;
    categoryId: string | null;
    description: string | null;
    comparedAtPrice: number | null;
    translations: unknown;
  };
  modifierGroupItems: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    translations: unknown;
  }[];
};

type RouteStop = {
  routeKey: string;
  deliveryAddressId: string;
  createdAt: Date;
  lat: string;
  lng: string;
};

type OrderTypeRow = {
  id: string;
  type: TOrder["type"];
  scheduleFor: Date | null;
};

type DispatchOrderCompositionRow = {
  totalOrders: bigint;
  takeawayOrders: bigint;
  scheduledOrders: bigint;
};

function mapDriver(row: DispatchRow): Driver | undefined {
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
  ordersByDispatchId: Map<string, DispatchApiOrder[]>,
  orderProductsByOrderId: Map<TOrder["id"], TOrder["orderProducts"]>,
  preparationStepCategoriesByOrderId: Map<
    TOrder["id"],
    TOrder["preparationStepCategory"]
  >,
): Dispatch {
  if (!ordersByDispatchId.has(row.id)) {
    ordersByDispatchId.set(
      row.id,
      orderRows
        .filter((orderRow) => orderRow.dispatchId === row.id)
        .map((orderRow, index) => ({
          id: orderRow.id,
          createdAt: orderRow.createdAt.toISOString(),
          scheduleFor: orderRow.scheduleFor
            ? orderRow.scheduleFor.toISOString()
            : null,
          language: orderRow.language,
          paidAt: orderRow.paidAt ? orderRow.paidAt.toISOString() : null,
          ...(orderRow.progressiveDiscountSnapshot &&
          typeof orderRow.progressiveDiscountSnapshot === "object"
            ? {
                progressiveDiscountSnapshot:
                  orderRow.progressiveDiscountSnapshot as TOrder["progressiveDiscountSnapshot"],
              }
            : {}),
          ...(orderRow.deliveredAt
            ? { deliveredAt: orderRow.deliveredAt.toISOString() }
            : {}),
          estimatedDeliveryDurationMinutes:
            orderRow.estimatedDeliveryDurationMinutes,
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
          ...(orderRow.deliveryAddressId
            ? {
                deliveryAddress: {
                  id: orderRow.deliveryAddressId,
                  createdAt:
                    orderRow.deliveryAddressCreatedAt?.toISOString() || "",
                  description: orderRow.deliveryAddressDescription || "",
                  street: orderRow.deliveryAddressStreet || "",
                  number: orderRow.deliveryAddressNumber || "",
                  city: orderRow.deliveryAddressCity || "",
                  state: orderRow.deliveryAddressState || "",
                  zipCode: orderRow.deliveryAddressZipCode || "",
                  lat: orderRow.deliveryAddressLat || "",
                  lng: orderRow.deliveryAddressLng || "",
                  complement:
                    orderRow.deliveryAddressComplement ?? undefined,
                  numberComplement:
                    orderRow.deliveryAddressNumberComplement ?? undefined,
                  customerId:
                    orderRow.deliveryAddressCustomerId ?? undefined,
                  deliveryFee: orderRow.deliveryAddressFee ?? undefined,
                },
              }
            : {}),
          orderProducts: orderProductsByOrderId.get(orderRow.id) || [],
          preparationStepCategory:
            preparationStepCategoriesByOrderId.get(orderRow.id) || [],
        })),
    );
  }

  const driver = mapDriver(row);

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    ...(row.queueIndex !== null ? { queueIndex: row.queueIndex } : {}),
    ...(row.dispatchAt ? { dispatchAt: row.dispatchAt.toISOString() } : {}),
    dispatched: row.dispatched,
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
    orders: ordersByDispatchId.get(row.id) || [],
  };
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
  const rows = await tx.$queryRaw<{ id: string }[]>`
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
    throw {
      code: "NOT_FOUND",
      details: {
        service: "DISPATCH",
        id: dispatchId,
      },
    };
  }

  const [movedDispatchId] = orderedDispatchIds.splice(fromIndex, 1);
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

async function syncDispatchOrders(
  tx: Prisma.TransactionClient,
  dispatchId: string,
  orderIds: string[],
): Promise<void> {
  await tx.$executeRaw`
    UPDATE "Order"
    SET
      "dispatchId" = NULL,
      "dispatchOrderIndex" = NULL
    WHERE "dispatchId" = ${dispatchId}
  `;

  if (orderIds.length === 0) return;

  for (const [index, orderId] of orderIds.entries()) {
    await tx.$executeRaw`
      UPDATE "Order"
      SET
        "dispatchId" = ${dispatchId},
        "dispatchOrderIndex" = ${index + 1}
      WHERE "id" = ${orderId}
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

async function getDispatchOrders(
  dispatchIds: string[],
): Promise<DispatchOrderRow[]> {
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
      orders."type",
      orders."paymentMethod",
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
): Promise<Map<TOrder["id"], TOrder["orderProducts"]>> {
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
  const orderProductsByOrderId = new Map<TOrder["id"], TOrder["orderProducts"]>();

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
            ? (row.product.translations as {
                [key: string]: {
                  [key: string]: string;
                };
              })
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
            ? (modifierItem.translations as {
                [key: string]: {
                  [key: string]: string;
                };
              })
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
): Promise<Map<TOrder["id"], TOrder["preparationStepCategory"]>> {
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
      category: true,
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
  const categoriesByOrderId = new Map<
    TOrder["id"],
    TOrder["preparationStepCategory"]
  >();

  for (const category of categories) {
    if (!category.categoryId || !category.category) {
      continue;
    }

    const current = categoriesByOrderId.get(category.orderId) || [];

    current.push({
      id: category.id,
      categoryId: category.categoryId,
      completed: category.completed,
      orderId: category.orderId,
      snoozes: [],
      category: {
        id: category.category.id,
        title: category.category.name,
        products: [],
        ...(category.category.translations &&
        typeof category.category.translations === "object"
          ? {
              translations: category.category.translations as {
                [key: string]: {
                  [key: string]: string;
                };
              },
            }
          : {}),
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
              description:
                modifierTrack.modifierGroupItem.description || undefined,
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
                      .translations as {
                      [key: string]: {
                        [key: string]: string;
                      };
                    },
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

function parseCoordinates(row: { lat: string; lng: string }) {
  const lat = Number(row.lat);
  const lng = Number(row.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Invalid delivery address coordinates");
  }

  return { lat, lng };
}

async function calculateOptimizedRoute(stops: RouteStop[]): Promise<{
  estimatedDeliveryDurationMinutes: number;
  estimatedRoundTripDurationMinutes: number;
  orderedStops: RouteStop[];
  durationToStopByRouteKey: Map<string, number>;
}> {
  const uniqueStops = Array.from(
    new Map(stops.map((stop) => [stop.deliveryAddressId, stop])).values(),
  );

  if (uniqueStops.length === 0) {
    return {
      estimatedDeliveryDurationMinutes: 0,
      estimatedRoundTripDurationMinutes: 0,
      orderedStops: [],
      durationToStopByRouteKey: new Map(),
    };
  }

  const remainingStops = [...uniqueStops];
  const orderedStops: RouteStop[] = [];
  const durationToStopByRouteKey = new Map<string, number>();
  let currentCoordinates = DEFAULT_BRANCH_COORDINATES;
  let estimatedDeliveryDurationMinutes = 0;

  while (remainingStops.length > 0) {
    const candidates = await Promise.all(
      remainingStops.map(async (stop) => ({
        duration: await getMapboxRouteDurationInMinutes(
          currentCoordinates,
          parseCoordinates(stop),
        ),
        stop,
      })),
    );

    candidates.sort((left, right) => {
      if (left.duration !== right.duration) {
        return left.duration - right.duration;
      }

      return left.stop.createdAt.getTime() - right.stop.createdAt.getTime();
    });

    const nextStop = candidates[0];

    estimatedDeliveryDurationMinutes += nextStop.duration;
    durationToStopByRouteKey.set(
      nextStop.stop.routeKey,
      Math.ceil(estimatedDeliveryDurationMinutes),
    );
    orderedStops.push(nextStop.stop);
    currentCoordinates = parseCoordinates(nextStop.stop);

    const nextStopIndex = remainingStops.findIndex(
      (stop) => stop.routeKey === nextStop.stop.routeKey,
    );

    remainingStops.splice(nextStopIndex, 1);
  }

  const returnToStoreDurationMinutes = await getMapboxRouteDurationInMinutes(
    currentCoordinates,
    DEFAULT_BRANCH_COORDINATES,
  );

  return {
    estimatedDeliveryDurationMinutes: Math.ceil(
      estimatedDeliveryDurationMinutes,
    ),
    estimatedRoundTripDurationMinutes: Math.ceil(
      estimatedDeliveryDurationMinutes + returnToStoreDurationMinutes,
    ),
    orderedStops,
    durationToStopByRouteKey,
  };
}

async function calculateDispatchOrderDeliveryMetricsByPosition(
  orders: DispatchOrderRouteRow[],
): Promise<{
  estimatedDeliveryDurationMinutes: number;
  estimatedRoundTripDurationMinutes: number;
  durationToOrderId: Map<string, number>;
}> {
  if (orders.length === 0) {
    return {
      estimatedDeliveryDurationMinutes: 0,
      estimatedRoundTripDurationMinutes: 0,
      durationToOrderId: new Map(),
    };
  }

  const durationToAddressId = new Map<string, number>();
  const durationToOrderId = new Map<string, number>();
  let currentCoordinates = DEFAULT_BRANCH_COORDINATES;
  let accumulatedDurationInMinutes = 0;

  for (const order of orders) {
    const existingDurationToAddress = durationToAddressId.get(
      order.deliveryAddressId,
    );

    if (existingDurationToAddress !== undefined) {
      durationToOrderId.set(order.id, existingDurationToAddress);
      continue;
    }

    const orderCoordinates = parseCoordinates(order);
    const durationToNextStop = await getMapboxRouteDurationInMinutes(
      currentCoordinates,
      orderCoordinates,
    );

    accumulatedDurationInMinutes += durationToNextStop;
    const roundedDurationToStop = Math.ceil(accumulatedDurationInMinutes);

    durationToAddressId.set(order.deliveryAddressId, roundedDurationToStop);
    durationToOrderId.set(order.id, roundedDurationToStop);
    currentCoordinates = orderCoordinates;
  }

  const returnToStoreDurationInMinutes = await getMapboxRouteDurationInMinutes(
    currentCoordinates,
    DEFAULT_BRANCH_COORDINATES,
  );

  return {
    estimatedDeliveryDurationMinutes: Math.ceil(accumulatedDurationInMinutes),
    estimatedRoundTripDurationMinutes: Math.ceil(
      accumulatedDurationInMinutes + returnToStoreDurationInMinutes,
    ),
    durationToOrderId,
  };
}

async function assertDriverCanBeAssigned(
  tx: Prisma.TransactionClient,
  driverId: string,
): Promise<void> {
  const [driver] = await tx.$queryRaw<{ id: string; active: boolean }[]>`
    SELECT "id", "active"
    FROM "Driver"
    WHERE "id" = ${driverId}
    LIMIT 1
  `;

  if (!driver) {
    throw {
      code: "NOT_FOUND",
      details: {
        service: "DRIVER",
        id: driverId,
      },
    };
  }

  if (!driver.active) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "driverId",
        message: "INACTIVE_DRIVER_CANNOT_BE_ASSIGNED",
      },
    };
  }
}

async function findOrderTypesByIds(
  tx: Prisma.TransactionClient,
  orderIds: string[],
): Promise<OrderTypeRow[]> {
  if (orderIds.length === 0) return [];

  return tx.$queryRaw<OrderTypeRow[]>`
    SELECT "id", "type", "scheduleFor"
    FROM "Order"
    WHERE "id" IN (${Prisma.join(orderIds)})
  `;
}

function assertTakeawayDispatchComposition(
  orderTypes: OrderTypeRow[],
  field: string,
): void {
  const takeawayOrders = orderTypes.filter(
    (order) => order.type === "TAKEAWAY",
  );

  if (takeawayOrders.length > 0 && orderTypes.length > 1) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field,
        message: "TAKEAWAY_DISPATCH_CAN_ONLY_HAVE_ONE_ORDER",
      },
    };
  }
}

function assertScheduledDispatchComposition(
  orderTypes: OrderTypeRow[],
  field: string,
): void {
  const scheduledOrders = orderTypes.filter(
    (order) => order.scheduleFor !== null,
  );

  if (scheduledOrders.length > 0 && orderTypes.length > 1) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field,
        message: "SCHEDULED_ORDER_REQUIRES_OWN_DISPATCH",
      },
    };
  }
}

async function assertOrderIdsExistAndTakeawayComposition(
  tx: Prisma.TransactionClient,
  orderIds: string[],
  field: string,
): Promise<void> {
  const orderTypes = await findOrderTypesByIds(tx, orderIds);

  if (orderTypes.length !== orderIds.length) {
    const foundIds = new Set(orderTypes.map((order) => order.id));
    const missingOrderId = orderIds.find((orderId) => !foundIds.has(orderId));

    throw {
      code: "NOT_FOUND",
      details: {
        service: "ORDER",
        id: missingOrderId || orderIds[0],
      },
    };
  }

  assertTakeawayDispatchComposition(orderTypes, field);
  assertScheduledDispatchComposition(orderTypes, field);
}

async function getDispatchOrderComposition(
  tx: Prisma.TransactionClient,
  dispatchId: string,
  excludeOrderId?: string,
): Promise<{
  totalOrders: number;
  takeawayOrders: number;
  scheduledOrders: number;
}> {
  const exclusionClause = excludeOrderId
    ? Prisma.sql`AND orders."id" != ${excludeOrderId}`
    : Prisma.empty;

  const [composition] = await tx.$queryRaw<DispatchOrderCompositionRow[]>`
    SELECT
      COUNT(*)::BIGINT AS "totalOrders",
      COUNT(*) FILTER (WHERE orders."type" = 'TAKEAWAY')::BIGINT AS "takeawayOrders",
      COUNT(*) FILTER (WHERE orders."scheduleFor" IS NOT NULL)::BIGINT AS "scheduledOrders"
    FROM "Order" orders
    WHERE orders."dispatchId" = ${dispatchId}
    ${exclusionClause}
  `;

  return {
    totalOrders: Number(composition?.totalOrders ?? 0),
    takeawayOrders: Number(composition?.takeawayOrders ?? 0),
    scheduledOrders: Number(composition?.scheduledOrders ?? 0),
  };
}

async function assertDispatchCanReceiveOrder(
  tx: Prisma.TransactionClient,
  {
    dispatchId,
    orderType,
    orderScheduled,
    field,
    excludeOrderId,
  }: {
    dispatchId: string;
    orderType: TOrder["type"];
    orderScheduled: boolean;
    field: string;
    excludeOrderId?: string;
  },
): Promise<void> {
  const composition = await getDispatchOrderComposition(
    tx,
    dispatchId,
    excludeOrderId,
  );

  if (orderType === "TAKEAWAY" && composition.totalOrders > 0) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field,
        message: "TAKEAWAY_DISPATCH_CAN_ONLY_HAVE_ONE_ORDER",
      },
    };
  }

  if (orderType !== "TAKEAWAY" && composition.takeawayOrders > 0) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field,
        message: "CANNOT_ADD_ORDER_TO_TAKEAWAY_DISPATCH",
      },
    };
  }

  if (orderScheduled && composition.totalOrders > 0) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field,
        message: "SCHEDULED_ORDER_REQUIRES_OWN_DISPATCH",
      },
    };
  }

  if (!orderScheduled && composition.scheduledOrders > 0) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field,
        message: "CANNOT_ADD_ORDER_TO_SCHEDULED_DISPATCH",
      },
    };
  }
}

class PrismaDispatchRepository implements DispatchRepository {
  async assignOrder(dispatchId: string, orderId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const [dispatch] = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id"
        FROM "Dispatch"
        WHERE "id" = ${dispatchId}
        LIMIT 1
      `;

      if (!dispatch) {
        throw {
          code: "NOT_FOUND",
          details: {
            service: "DISPATCH",
            id: dispatchId,
          },
        };
      }

      const [order] = await tx.$queryRaw<
        { id: string; type: TOrder["type"]; scheduleFor: Date | null }[]
      >`
        SELECT "id", "type", "scheduleFor"
        FROM "Order"
        WHERE "id" = ${orderId}
        LIMIT 1
      `;

      if (!order) {
        throw {
          code: "NOT_FOUND",
          details: {
            service: "ORDER",
            id: orderId,
          },
        };
      }

      await assertDispatchCanReceiveOrder(tx, {
        dispatchId,
        orderType: order.type,
        orderScheduled: order.scheduleFor !== null,
        field: "dispatchId",
        excludeOrderId: order.id,
      });

      await tx.$executeRaw`
        UPDATE "Order"
        SET
          "dispatchId" = ${dispatchId},
          "dispatchOrderIndex" = (
            SELECT COALESCE(MAX(existingOrders."dispatchOrderIndex"), 0) + 1
            FROM "Order" existingOrders
            WHERE existingOrders."dispatchId" = ${dispatchId}
          )
        WHERE "id" = ${orderId}
      `;
    });
  }

  async autoAssignDriver(dispatchId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const [dispatch] = await tx.$queryRaw<
        { id: string; driverId: string | null }[]
      >`
        SELECT "id", "driverId"
        FROM "Dispatch"
        WHERE "id" = ${dispatchId}
        LIMIT 1
      `;

      if (!dispatch) {
        throw {
          code: "NOT_FOUND",
          details: {
            service: "DISPATCH",
            id: dispatchId,
          },
        };
      }

      if (dispatch.driverId) {
        return;
      }

      const activeDrivers = await tx.$queryRaw<ActiveDriverRow[]>`
        SELECT "id", "createdAt", "priorityLevel"
        FROM "Driver"
        WHERE "active" = true
        ORDER BY "priorityLevel" ASC, "createdAt" ASC
      `;

      if (activeDrivers.length === 0) {
        return;
      }

      const busyDrivers = await tx.$queryRaw<BusyDriverRow[]>`
        SELECT DISTINCT ON (driver."id")
          driver."id" AS "driverId",
          driver."createdAt" AS "driverCreatedAt",
          driver."priorityLevel" AS "driverPriorityLevel",
          dispatch."estimatedRoundTripDurationMinutes"
        FROM "Driver" driver
        INNER JOIN "Dispatch" dispatch ON dispatch."driverId" = driver."id"
        WHERE driver."active" = true
          AND dispatch."id" != ${dispatchId}
          AND EXISTS (
            SELECT 1
            FROM "Order" orders
            WHERE orders."dispatchId" = dispatch."id"
              AND orders."deliveredAt" IS NULL
          )
        ORDER BY
          driver."id",
          COALESCE(dispatch."estimatedRoundTripDurationMinutes", 2147483647) ASC,
          dispatch."createdAt" ASC
      `;

      const busyDriverIds = new Set(
        busyDrivers.map((driver) => driver.driverId),
      );

      const freeDriver = activeDrivers.find(
        (driver) => !busyDriverIds.has(driver.id),
      );

      const selectedDriverId =
        freeDriver?.id ||
        busyDrivers
          .slice()
          .sort((left, right) => {
            const leftDuration =
              left.estimatedRoundTripDurationMinutes ?? Number.MAX_SAFE_INTEGER;
            const rightDuration =
              right.estimatedRoundTripDurationMinutes ??
              Number.MAX_SAFE_INTEGER;

            if (leftDuration !== rightDuration) {
              return leftDuration - rightDuration;
            }

            if (left.driverPriorityLevel !== right.driverPriorityLevel) {
              return left.driverPriorityLevel - right.driverPriorityLevel;
            }

            return (
              left.driverCreatedAt.getTime() - right.driverCreatedAt.getTime()
            );
          })[0]?.driverId;

      if (!selectedDriverId) {
        return;
      }

      await tx.$executeRaw`
        UPDATE "Dispatch"
        SET "driverId" = ${selectedDriverId}
        WHERE "id" = ${dispatchId}
      `;
    });
  }

  async moveOrder(
    data: MoveDispatchOrderInput,
  ): Promise<MoveDispatchOrderResult> {
    return prisma.$transaction(async (tx) => {
      const [order] = await tx.$queryRaw<
        {
          id: string;
          dispatchId: string | null;
          type: TOrder["type"];
          scheduleFor: Date | null;
        }[]
      >`
        SELECT "id", "dispatchId", "type", "scheduleFor"
        FROM "Order"
        WHERE "id" = ${data.orderId}
        LIMIT 1
      `;

      if (!order) {
        throw {
          code: "NOT_FOUND",
          details: {
            service: "ORDER",
            id: data.orderId,
          },
        };
      }

      let targetDispatchId = data.targetDispatchId;
      let createdDispatch = false;

      if (data.createNewDispatch) {
        targetDispatchId = randomUUID();
        createdDispatch = true;

        await tx.$executeRaw`
          INSERT INTO "Dispatch" (
            "id",
            "queueIndex",
            "dispatched",
            "dispatchAt",
            "driverId"
          )
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
          throw {
            code: "INVALID_PARAMS",
            details: {
              field: "targetDispatchId",
              message: "ORDER_IS_NOT_ASSIGNED_TO_DISPATCH",
            },
          };
        }

        const [targetDispatch] = await tx.$queryRaw<{ id: string }[]>`
          SELECT "id"
          FROM "Dispatch"
          WHERE "id" = ${targetDispatchId}
          LIMIT 1
        `;

        if (!targetDispatch) {
          throw {
            code: "NOT_FOUND",
            details: {
              service: "DISPATCH",
              id: targetDispatchId,
            },
          };
        }
      }

      const sourceDispatchId = order.dispatchId || undefined;

      if (
        sourceDispatchId !== targetDispatchId &&
        typeof targetDispatchId === "string"
      ) {
        await assertDispatchCanReceiveOrder(tx, {
          dispatchId: targetDispatchId,
          orderType: order.type,
          orderScheduled: order.scheduleFor !== null,
          field: "targetDispatchId",
          excludeOrderId: order.id,
        });
      }

      await tx.$executeRaw`
        UPDATE "Order"
        SET
          "dispatchId" = NULL,
          "dispatchOrderIndex" = NULL
        WHERE "id" = ${data.orderId}
      `;

      if (sourceDispatchId) {
        await normalizeDispatchOrderIndexes(tx, sourceDispatchId);
      }

      const [targetCountResult] = await tx.$queryRaw<
        { count: bigint }[]
      >`
        SELECT COUNT(*)::BIGINT AS "count"
        FROM "Order"
        WHERE "dispatchId" = ${targetDispatchId}
      `;

      const targetOrderCount = Number(targetCountResult?.count ?? 0);
      const insertIndex =
        data.targetIndex === undefined
          ? targetOrderCount + 1
          : Math.max(1, Math.min(data.targetIndex, targetOrderCount + 1));

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
        WHERE "id" = ${data.orderId}
      `;

      await normalizeDispatchOrderIndexes(tx, targetDispatchId);

      const [movedOrder] = await tx.$queryRaw<
        { dispatchOrderIndex: number | null }[]
      >`
        SELECT "dispatchOrderIndex"
        FROM "Order"
        WHERE "id" = ${data.orderId}
        LIMIT 1
      `;

      let sourceDispatchDeleted = false;

      if (
        sourceDispatchId &&
        sourceDispatchId !== targetDispatchId
      ) {
        const [sourceCountResult] = await tx.$queryRaw<
          { count: bigint }[]
        >`
          SELECT COUNT(*)::BIGINT AS "count"
          FROM "Order"
          WHERE "dispatchId" = ${sourceDispatchId}
        `;

        const sourceOrderCount = Number(sourceCountResult?.count ?? 0);

        if (sourceOrderCount === 0) {
          await tx.$executeRaw`
            DELETE FROM "Dispatch"
            WHERE "id" = ${sourceDispatchId}
          `;
          await normalizeDispatchQueueIndexes(tx);
          sourceDispatchDeleted = true;
        }
      }

      return {
        orderId: data.orderId,
        sourceDispatchId,
        targetDispatchId,
        targetIndex: movedOrder?.dispatchOrderIndex || insertIndex,
        createdDispatch,
        sourceDispatchDeleted,
      };
    });
  }

  async create(data: CreateDispatchInput): Promise<Dispatch> {
    const dispatchId = randomUUID();

    const dispatch = await prisma.$transaction(async (tx) => {
      if (data.driverId) {
        await assertDriverCanBeAssigned(tx, data.driverId);
      }

      await assertOrderIdsExistAndTakeawayComposition(
        tx,
        data.orderIds,
        "orderIds",
      );

      const [createdDispatch] = await tx.$queryRaw<DispatchRow[]>`
        INSERT INTO "Dispatch" ("id", "queueIndex", "dispatched", "dispatchAt", "driverId")
        VALUES (
          ${dispatchId},
          (
            SELECT COALESCE(MAX(dispatch."queueIndex"), 0) + 1
            FROM "Dispatch" dispatch
          ),
          ${data.dispatched ?? false},
          ${data.dispatched ? new Date() : null},
          ${data.driverId ?? null}
        )
        RETURNING
          "id",
          "createdAt",
          "queueIndex",
          "dispatchAt",
          "dispatched",
          "estimatedDeliveryDurationMinutes",
          "estimatedRoundTripDurationMinutes",
          "driverId",
          NULL::TIMESTAMP AS "driverCreatedAt",
          NULL::TEXT AS "driverName",
          NULL::BOOLEAN AS "driverActive",
          NULL::INTEGER AS "driverPriorityLevel"
      `;

      await syncDispatchOrders(tx, dispatchId, data.orderIds);

      return createdDispatch;
    });

    const [dispatchRow] = await prisma.$queryRaw<DispatchRow[]>`
      SELECT
        dispatch."id",
        dispatch."createdAt",
        dispatch."queueIndex",
        dispatch."dispatchAt",
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
      WHERE dispatch."id" = ${dispatch.id}
    `;

    const orderRows = await getDispatchOrders([dispatch.id]);
    const orderProductsByOrderId = await getDispatchOrderProducts(
      orderRows.map((order) => order.id),
    );
    const preparationStepCategoriesByOrderId =
      await getDispatchPreparationStepCategories(
        orderRows.map((order) => order.id),
      );

    return mapDispatch(
      dispatchRow,
      orderRows,
      new Map(),
      orderProductsByOrderId,
      preparationStepCategoriesByOrderId,
    );
  }

  async findMatchingOpenDispatchForDeliveryAddress(
    deliveryAddressId: string,
    maxRouteDurationInMinutes: number,
  ): Promise<string | undefined> {
    const [targetAddress] = await prisma.$queryRaw<DeliveryAddressCoordinatesRow[]>`
      SELECT "id", "lat", "lng"
      FROM "DeliveryAddress"
      WHERE "id" = ${deliveryAddressId}
      LIMIT 1
    `;

    if (!targetAddress) {
      throw {
        code: "NOT_FOUND",
        details: {
          service: "DELIVERY_ADDRESS",
          id: deliveryAddressId,
        },
      };
    }

    const candidateAddresses = await prisma.$queryRaw<DispatchAddressCandidateRow[]>`
      SELECT
        dispatch."id" AS "dispatchId",
        deliveryAddress."id" AS "deliveryAddressId",
        orders."createdAt",
        deliveryAddress."lat",
        deliveryAddress."lng"
      FROM "Dispatch" dispatch
      INNER JOIN "Order" orders ON orders."dispatchId" = dispatch."id"
      INNER JOIN "DeliveryAddress" deliveryAddress
        ON deliveryAddress."id" = orders."deliveryAddressId"
      WHERE dispatch."dispatched" = false
        AND orders."deliveryAddressId" IS NOT NULL
        AND orders."deliveredAt" IS NULL
        AND orders."scheduleFor" IS NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "Order" scheduledOrders
          WHERE scheduledOrders."dispatchId" = dispatch."id"
            AND scheduledOrders."scheduleFor" IS NOT NULL
        )
        AND (
          SELECT COUNT(*)
          FROM "Order" dispatchOrders
          WHERE dispatchOrders."dispatchId" = dispatch."id"
        ) < 3
      ORDER BY dispatch."createdAt" ASC, orders."createdAt" ASC
    `;

    const directDeliveryDurationInMinutes =
      await getMapboxRouteDurationInMinutes(
        DEFAULT_BRANCH_COORDINATES,
        parseCoordinates(targetAddress),
      );
    const targetStop: RouteStop = {
      routeKey: "__target__",
      deliveryAddressId: targetAddress.id,
      createdAt: new Date(),
      lat: targetAddress.lat,
      lng: targetAddress.lng,
    };
    const stopsByDispatchId = new Map<string, DispatchAddressCandidateRow[]>();

    for (const candidate of candidateAddresses) {
      const currentStops = stopsByDispatchId.get(candidate.dispatchId) || [];

      currentStops.push(candidate);
      stopsByDispatchId.set(candidate.dispatchId, currentStops);
    }

    let bestMatch:
      | {
          dispatchId: string;
          addedWholeTripDurationInMinutes: number;
          deliveryTripDurationInMinutes: number;
          roundTripDurationInMinutes: number;
        }
      | undefined;

    for (const [dispatchId, dispatchStops] of stopsByDispatchId) {
      const optimizedRoute = await calculateOptimizedRoute([
        ...dispatchStops.map((stop) => ({
          routeKey: stop.deliveryAddressId,
          deliveryAddressId: stop.deliveryAddressId,
          createdAt: stop.createdAt,
          lat: stop.lat,
          lng: stop.lng,
        })),
        targetStop,
      ]);
      const targetDurationInMinutes =
        optimizedRoute.durationToStopByRouteKey.get(targetStop.routeKey);

      if (typeof targetDurationInMinutes !== "number") {
        continue;
      }

      const addedWholeTripDurationInMinutes =
        optimizedRoute.estimatedDeliveryDurationMinutes -
        directDeliveryDurationInMinutes;

      if (
        addedWholeTripDurationInMinutes > maxRouteDurationInMinutes
      ) {
        continue;
      }

      if (
        !bestMatch ||
        addedWholeTripDurationInMinutes <
          bestMatch.addedWholeTripDurationInMinutes ||
        (addedWholeTripDurationInMinutes ===
          bestMatch.addedWholeTripDurationInMinutes &&
          optimizedRoute.estimatedDeliveryDurationMinutes <
            bestMatch.deliveryTripDurationInMinutes) ||
        (addedWholeTripDurationInMinutes ===
          bestMatch.addedWholeTripDurationInMinutes &&
          optimizedRoute.estimatedDeliveryDurationMinutes ===
            bestMatch.deliveryTripDurationInMinutes &&
          optimizedRoute.estimatedRoundTripDurationMinutes <
            bestMatch.roundTripDurationInMinutes)
      ) {
        bestMatch = {
          dispatchId,
          addedWholeTripDurationInMinutes,
          deliveryTripDurationInMinutes:
            optimizedRoute.estimatedDeliveryDurationMinutes,
          roundTripDurationInMinutes:
            optimizedRoute.estimatedRoundTripDurationMinutes,
        };
      }
    }

    return bestMatch?.dispatchId;
  }

  async isOrderScheduled(orderId: string): Promise<boolean> {
    const [order] = await prisma.$queryRaw<{ scheduleFor: Date | null }[]>`
      SELECT "scheduleFor"
      FROM "Order"
      WHERE "id" = ${orderId}
      LIMIT 1
    `;

    if (!order) {
      throw {
        code: "NOT_FOUND",
        details: {
          service: "ORDER",
          id: orderId,
        },
      };
    }

    return order.scheduleFor !== null;
  }

  async findNextForDriver(driverId: string): Promise<Dispatch | undefined> {
    const [dispatchRow] = await prisma.$queryRaw<DispatchRow[]>`
      SELECT
        dispatch."id",
        dispatch."createdAt",
        dispatch."queueIndex",
        dispatch."dispatchAt",
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
      return undefined;
    }

    const orderRows = await getDispatchOrders([dispatchRow.id]);
    const orderProductsByOrderId = await getDispatchOrderProducts(
      orderRows.map((order) => order.id),
    );
    const preparationStepCategoriesByOrderId =
      await getDispatchPreparationStepCategories(
        orderRows.map((order) => order.id),
      );

    return mapDispatch(
      dispatchRow,
      orderRows,
      new Map(),
      orderProductsByOrderId,
      preparationStepCategoriesByOrderId,
    );
  }

  async list(): Promise<Dispatch[]> {
    const dispatches = await prisma.$queryRaw<DispatchRow[]>`
      SELECT
        dispatch."id",
        dispatch."createdAt",
        dispatch."queueIndex",
        dispatch."dispatchAt",
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
      WHERE (
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
      )
      ORDER BY
        dispatch."dispatched" DESC,
        COALESCE(dispatch."queueIndex", 2147483647) ASC,
        dispatch."createdAt" ASC
    `;

    const orderRows = await getDispatchOrders(dispatches.map((dispatch) => dispatch.id));
    const orderProductsByOrderId = await getDispatchOrderProducts(
      orderRows.map((order) => order.id),
    );
    const preparationStepCategoriesByOrderId =
      await getDispatchPreparationStepCategories(
        orderRows.map((order) => order.id),
      );
    const ordersByDispatchId = new Map<string, DispatchApiOrder[]>();

    return dispatches.map((dispatch) =>
      mapDispatch(
        dispatch,
        orderRows,
        ordersByDispatchId,
        orderProductsByOrderId,
        preparationStepCategoriesByOrderId,
      ),
    );
  }

  async updateStatus(data: UpdateDispatchStatusInput): Promise<Dispatch> {
    const parsedDispatchAt =
      typeof data.dispatchAt === "string"
        ? new Date(data.dispatchAt)
        : undefined;

    if (
      parsedDispatchAt &&
      Number.isNaN(parsedDispatchAt.getTime())
    ) {
      throw {
        code: "INVALID_PARAMS",
        details: {
          field: "dispatchAt",
        },
      };
    }

    const updatedDispatch = await prisma.$transaction(async (tx) => {
      const [existingDispatch] = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id"
        FROM "Dispatch"
        WHERE "id" = ${data.dispatchId}
        LIMIT 1
      `;

      if (!existingDispatch) {
        throw {
          code: "NOT_FOUND",
          details: {
            service: "DISPATCH",
            id: data.dispatchId,
          },
        };
      }

      const updates: Prisma.Sql[] = [];

      if (data.dispatched !== undefined) {
        updates.push(Prisma.sql`"dispatched" = ${data.dispatched}`);
        updates.push(
          data.dispatched
            ? Prisma.sql`"dispatchAt" = ${
                parsedDispatchAt ||
                Prisma.sql`COALESCE("dispatchAt", CURRENT_TIMESTAMP)`
              }`
            : Prisma.sql`"dispatchAt" = NULL`,
        );
      }

      if (data.driverId !== undefined) {
        if (data.driverId !== null) {
          await assertDriverCanBeAssigned(tx, data.driverId);
        }

        updates.push(Prisma.sql`"driverId" = ${data.driverId}`);
      }

      if (updates.length > 0) {
        await tx.$executeRaw`
          UPDATE "Dispatch"
          SET ${Prisma.join(updates, ", ")}
          WHERE "id" = ${data.dispatchId}
        `;
      }

      if (data.queueIndex !== undefined) {
        // Ensure queue indexes are globally consistent before moving a dispatch.
        // This fixes any pre-existing duplicates/gaps and guarantees uniqueness.
        await normalizeDispatchQueueIndexes(tx);
        await moveDispatchToQueueIndex(tx, data.dispatchId, data.queueIndex);
      }

      if (updates.length === 0 && data.queueIndex === undefined) {
        throw {
          code: "INVALID_PARAMS",
          details: {
            field: "body",
          },
        };
      }

      const [row] = await tx.$queryRaw<DispatchRow[]>`
        SELECT
          dispatch."id",
          dispatch."createdAt",
          dispatch."queueIndex",
          dispatch."dispatchAt",
          dispatch."dispatched",
          dispatch."estimatedDeliveryDurationMinutes",
          dispatch."estimatedRoundTripDurationMinutes",
          dispatch."driverId",
          NULL::TIMESTAMP AS "driverCreatedAt",
          NULL::TEXT AS "driverName",
          NULL::BOOLEAN AS "driverActive",
          NULL::INTEGER AS "driverPriorityLevel"
        FROM "Dispatch" dispatch
        WHERE dispatch."id" = ${data.dispatchId}
      `;

      return row;
    });

    if (!updatedDispatch) {
      throw {
        code: "NOT_FOUND",
        details: {
          service: "DISPATCH",
          id: data.dispatchId,
        },
      };
    }

    const [dispatchRow] = await prisma.$queryRaw<DispatchRow[]>`
      SELECT
        dispatch."id",
        dispatch."createdAt",
        dispatch."queueIndex",
        dispatch."dispatchAt",
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
      WHERE dispatch."id" = ${data.dispatchId}
    `;

    const orderRows = await getDispatchOrders([data.dispatchId]);
    const orderProductsByOrderId = await getDispatchOrderProducts(
      orderRows.map((order) => order.id),
    );
    const preparationStepCategoriesByOrderId =
      await getDispatchPreparationStepCategories(
        orderRows.map((order) => order.id),
      );

    return mapDispatch(
      dispatchRow,
      orderRows,
      new Map(),
      orderProductsByOrderId,
      preparationStepCategoriesByOrderId,
    );
  }

  async update(data: UpdateDispatchInput): Promise<Dispatch> {
    const dispatch = await prisma.$transaction(async (tx) => {
      const updates = [Prisma.sql`"dispatched" = ${data.dispatched}`];
      updates.push(
        data.dispatched
          ? Prisma.sql`"dispatchAt" = COALESCE("dispatchAt", CURRENT_TIMESTAMP)`
          : Prisma.sql`"dispatchAt" = NULL`,
      );

      if (data.driverId !== undefined) {
        if (data.driverId !== null) {
          await assertDriverCanBeAssigned(tx, data.driverId);
        }

        updates.push(Prisma.sql`"driverId" = ${data.driverId}`);
      }

      await assertOrderIdsExistAndTakeawayComposition(
        tx,
        data.orderIds,
        "orderIds",
      );

      const [updatedDispatch] = await tx.$queryRaw<DispatchRow[]>`
        UPDATE "Dispatch"
        SET ${Prisma.join(updates, ", ")}
        WHERE "id" = ${data.dispatchId}
        RETURNING
          "id",
          "createdAt",
          "queueIndex",
          "dispatchAt",
          "dispatched",
          "estimatedDeliveryDurationMinutes",
          "estimatedRoundTripDurationMinutes",
          "driverId",
          NULL::TIMESTAMP AS "driverCreatedAt",
          NULL::TEXT AS "driverName",
          NULL::BOOLEAN AS "driverActive",
          NULL::INTEGER AS "driverPriorityLevel"
      `;

      if (!updatedDispatch) {
        throw {
          code: "NOT_FOUND",
          details: {
            service: "DISPATCH",
            id: data.dispatchId,
          },
        };
      }

      await syncDispatchOrders(tx, data.dispatchId, data.orderIds);

      return updatedDispatch;
    });

    const [dispatchRow] = await prisma.$queryRaw<DispatchRow[]>`
      SELECT
        dispatch."id",
        dispatch."createdAt",
        dispatch."queueIndex",
        dispatch."dispatchAt",
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
      WHERE dispatch."id" = ${dispatch.id}
    `;

    const orderRows = await getDispatchOrders([dispatch.id]);
    const orderProductsByOrderId = await getDispatchOrderProducts(
      orderRows.map((order) => order.id),
    );
    const preparationStepCategoriesByOrderId =
      await getDispatchPreparationStepCategories(
        orderRows.map((order) => order.id),
      );

    return mapDispatch(
      dispatchRow,
      orderRows,
      new Map(),
      orderProductsByOrderId,
      preparationStepCategoriesByOrderId,
    );
  }

  async refreshRouteMetrics(dispatchId: string): Promise<void> {
    const routeOrders = await prisma.$queryRaw<DispatchOrderRouteRow[]>`
      SELECT
        orders."id",
        orders."dispatchOrderIndex",
        orders."createdAt",
        deliveryAddress."id" AS "deliveryAddressId",
        deliveryAddress."lat",
        deliveryAddress."lng"
      FROM "Order" orders
      INNER JOIN "DeliveryAddress" deliveryAddress
        ON deliveryAddress."id" = orders."deliveryAddressId"
      WHERE orders."dispatchId" = ${dispatchId}
        AND orders."deliveredAt" IS NULL
      ORDER BY
        orders."dispatchOrderIndex" ASC NULLS LAST,
        orders."createdAt" ASC,
        orders."id" ASC
    `;

    const metrics =
      await calculateDispatchOrderDeliveryMetricsByPosition(routeOrders);

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "Dispatch"
        SET
          "estimatedDeliveryDurationMinutes" = ${metrics.estimatedDeliveryDurationMinutes},
          "estimatedRoundTripDurationMinutes" = ${metrics.estimatedRoundTripDurationMinutes}
        WHERE "id" = ${dispatchId}
      `;

      await tx.$executeRaw`
        UPDATE "Order"
        SET "estimatedDeliveryDurationMinutes" = NULL
        WHERE "dispatchId" = ${dispatchId}
      `;

      for (const [orderId, durationInMinutes] of metrics.durationToOrderId) {
        await tx.$executeRaw`
          UPDATE "Order"
          SET "estimatedDeliveryDurationMinutes" = ${durationInMinutes}
          WHERE "id" = ${orderId}
        `;
      }
    });
  }
}

export const prismaDispatchRepository = new PrismaDispatchRepository();
