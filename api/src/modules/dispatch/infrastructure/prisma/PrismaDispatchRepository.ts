import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import prisma from "../../../../prisma.js";
import type {
  DispatchDriver,
  DispatchEntity,
  DispatchOrder,
  DispatchRepository,
} from "../../application/ports/DispatchRepository.js";

type DispatchRow = {
  createdAt: Date;
  dispatchAt: Date | null;
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
    preparationStepCategory:
      preparationStepCategoriesByOrderId.get(orderRow.id) || [],
  }));

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

  const categoriesByOrderId = new Map<string, unknown[]>();

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
              translations: category.category.translations as Record<
                string,
                Record<string, string>
              >,
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

export class PrismaDispatchRepository implements DispatchRepository {
  async findNextForDriver(driverId: string): Promise<DispatchEntity | null> {
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
      return null;
    }

    const orderRows = await getDispatchOrders([dispatchRow.id]);
    const orderIds = orderRows.map((order) => order.id);
    const orderProductsByOrderId = await getDispatchOrderProducts(orderIds);
    const redeemedRewardsByOrderId = await getRedeemedRewardsByOrderIds(orderIds);
    const preparationStepCategoriesByOrderId =
      await getDispatchPreparationStepCategories(orderIds);

    return mapDispatch(
      dispatchRow,
      orderRows,
      orderProductsByOrderId,
      redeemedRewardsByOrderId,
      preparationStepCategoriesByOrderId,
    );
  }
}
