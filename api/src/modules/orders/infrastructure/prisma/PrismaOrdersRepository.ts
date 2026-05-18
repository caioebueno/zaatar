import prisma from "../../../../prisma.js";
import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import type {
  DayWindow,
  OrderDetail,
  OrderDetailLineItem,
  OrderListItem,
  OrderListQuery,
  OrdersByStationItem,
  OrdersRepository,
  UpdateOrderDeliveryInput,
  UpdateOrderDeliveryResult,
} from "../../application/ports/OrdersRepository.js";

type OrderRow = {
  canceled: boolean;
  createdAt: Date;
  customerName: string | null;
  customerPhone: string | null;
  id: string;
  number: string | null;
  orderType: string;
  paymentMethod: string;
  status: string;
  totalCents: string;
};

export class PrismaOrdersRepository implements OrdersRepository {
  async findByStation(
    stationId: string,
    window: DayWindow,
  ): Promise<OrdersByStationItem[]> {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          {
            preparationStepCategories: {
              some: {
                preparationStepTracks: {
                  some: {
                    completed: false,
                    preparationStep: {
                      stationId,
                    },
                  },
                },
              },
            },
          },
          {
            createdAt: {
              gte: window.start,
              lt: window.end,
            },
          },
        ],
      },
      include: {
        customer: true,
        address: true,
        deliveryAddress: true,
        orderProducts: {
          include: {
            product: true,
          },
        },
        preparationStepCategories: {
          include: {
            station: true,
            preparationStepTracks: {
              include: {
                preparationStep: true,
                preparationStepModifierTracks: {
                  include: {
                    modifierGroupItem: true,
                  },
                },
              },
              where: {
                preparationStep: {
                  stationId,
                },
              },
            },
          },
        },
        redeemedRewards: {
          include: {
            product: true,
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

    const orderStatusById = new Map<string, string>();

    if (orders.length > 0) {
      const orderStatuses = await prisma.$queryRaw<
        { id: string; status: string }[]
      >`
        SELECT
          orders."id",
          CASE
            WHEN orders."deliveredAt" IS NOT NULL THEN 'DELIVERED'
            WHEN EXISTS (
              SELECT 1
              FROM "Dispatch" dispatch
              WHERE dispatch."id" = orders."dispatchId"
                AND dispatch."dispatched" = true
            ) THEN 'DELIVERING'
            WHEN EXISTS (
              SELECT 1
              FROM "PreparationStepCategory" preparationStepCategory
              INNER JOIN "PreparationStepTrack" preparationStepTrack
                ON preparationStepTrack."preparationStepCategoryId" = preparationStepCategory."id"
              WHERE preparationStepCategory."orderId" = orders."id"
                AND preparationStepTrack."completed" = true
            ) THEN 'PREPARING'
            ELSE 'ACCEPTED'
          END AS "status"
        FROM "Order" orders
        WHERE orders."id" IN (${Prisma.join(orders.map((order) => order.id))})
      `;

      for (const orderStatus of orderStatuses) {
        orderStatusById.set(orderStatus.id, orderStatus.status);
      }
    }

    const mappedOrders = orders
      .map(
        (
          order,
        ):
          | {
              dispatchId?: string;
              dispatchOrderIndex: number;
              order: OrdersByStationItem;
              orderCreatedAt: number;
              orderId: string;
            }
          | null => {
          const isToday =
            order.createdAt >= window.start && order.createdAt < window.end;

          const categories = order.preparationStepCategories
            .map((category) => {
              const relevantTracks = category.preparationStepTracks.filter(
                (track) => isToday || !track.completed,
              );

              const steps = relevantTracks.map((track) => ({
                id: track.id,
                name: track.preparationStep.name,
                quantity: track.quantity || 1,
                completed: track.completed,
                completedAt: track.completedAt
                  ? track.completedAt.toISOString()
                  : undefined,
                goalMinutes:
                  typeof (track as { goalMinutes?: unknown }).goalMinutes ===
                  "number"
                    ? Math.max(
                        0,
                        Math.floor(
                          (track as { goalMinutes?: number }).goalMinutes ?? 0,
                        ),
                      )
                    : 0,
                expectedAt: track.expectedAt
                  ? track.expectedAt.toISOString()
                  : undefined,
                preparationStepId: track.preparationStepId,
                preparationStepCategoryId: track.preparationStepCategoryId,
                comments: track.comments || undefined,
                completedComments: track.completedComments,
                preparationStepModifiers:
                  track.preparationStepModifierTracks.map((item) => ({
                    id: item.id,
                    completed: item.completed,
                    modifierGroupItem: item.modifierGroupItemId,
                    modifierGtroupItem: {
                      id: item.modifierGroupItem.id,
                      name: item.modifierGroupItem.name,
                      price: item.modifierGroupItem.price,
                      description: item.modifierGroupItem.description || undefined,
                    },
                  })),
              }));

              if (steps.length === 0) return null;

              return {
                id: category.id,
                stationId: category.stationId ?? undefined,
                completed: category.completed,
                orderId: category.orderId,
                snoozes: [],
                station: {
                  id: category.station?.id ?? category.id,
                  name: category.station?.name ?? "Preparation",
                },
                steps,
              };
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item));

          if (categories.length === 0) return null;

          const mappedOrder: OrdersByStationItem = {
            id: order.id,
            createdAt: order.createdAt.toISOString(),
            scheduleFor:
              (
                order as typeof order & {
                  scheduleFor?: Date | null;
                }
              ).scheduleFor?.toISOString() || null,
            language:
              (
                order as typeof order & {
                  language?: string | null;
                }
              ).language ?? null,
            paidAt:
              (
                order as typeof order & {
                  paidAt?: Date | null;
                }
              ).paidAt?.toISOString() || null,
            progressiveDiscountSnapshot: order.progressiveDiscountSnapshot,
            estimatedDeliveryDurationMinutes: order.estimatedDeliveryDurationMinutes,
            number: order.number ?? undefined,
            externalId: order.externalId ?? undefined,
            canceled: order.canceled ?? undefined,
            status: orderStatusById.get(order.id) ?? "ACCEPTED",
            type: order.type,
            paymentMethod: order.paymentMethod,
            paymentProvider:
              (
                order as typeof order & {
                  paymentProvider?: string | null;
                }
              ).paymentProvider ?? null,
            tip: order.tipAmount ?? undefined,
            tipAmount: order.tipAmount ?? undefined,
            addressId: order.addressId ?? undefined,
            address: order.address ?? undefined,
            customer: order.customer
              ? {
                  id: order.customer.id,
                  name: order.customer.name,
                }
              : undefined,
            redeemedRewards: order.redeemedRewards.map((reward) => ({
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
              product: reward.product
                ? {
                    id: reward.product.id,
                    name: reward.product.name,
                    categoryId: reward.product.categoryId ?? undefined,
                    description: reward.product.description ?? undefined,
                    price: reward.product.price,
                    comparedAtPrice: reward.product.comparedAtPrice,
                    translations:
                      reward.product.translations &&
                      typeof reward.product.translations === "object"
                        ? reward.product.translations
                        : undefined,
                  }
                : undefined,
            })),
            orderProducts: order.orderProducts.map((item) => ({
              id: item.id,
              productId: item.productId,
              product: item.product
                ? {
                    id: item.product.id,
                    name: item.product.name,
                    categoryId: item.product.categoryId ?? undefined,
                    description: item.product.description ?? undefined,
                    price: item.product.price,
                    comparedAtPrice: item.product.comparedAtPrice,
                    translations:
                      item.product.translations &&
                      typeof item.product.translations === "object"
                        ? item.product.translations
                        : undefined,
                  }
                : undefined,
              amount: item.amount,
              fullAmount: item.fullAmount,
              quantity: item.quantity,
            })),
            preparationTaskStation: categories,
          };

          return {
            order: mappedOrder,
            dispatchId: order.dispatchId ?? undefined,
            dispatchOrderIndex:
              typeof order.dispatchOrderIndex === "number"
                ? order.dispatchOrderIndex
                : Number.MAX_SAFE_INTEGER,
            orderCreatedAt: order.createdAt.getTime(),
            orderId: order.id,
          };
        },
      )
      .filter(
        (
          item,
        ): item is {
          dispatchId?: string;
          dispatchOrderIndex: number;
          order: OrdersByStationItem;
          orderCreatedAt: number;
          orderId: string;
        } => Boolean(item),
      );

    const dispatchIds = Array.from(
      new Set(
        mappedOrders
          .map((item) => item.dispatchId)
          .filter((dispatchId): dispatchId is string => Boolean(dispatchId)),
      ),
    );
    const dispatchRows =
      dispatchIds.length > 0
        ? await prisma.$queryRaw<
            { createdAt: Date; id: string; queueIndex: number | null }[]
          >`
            SELECT
              dispatch."id",
              dispatch."queueIndex",
              dispatch."createdAt"
            FROM "Dispatch" dispatch
            WHERE dispatch."id" IN (${Prisma.join(dispatchIds)})
          `
        : [];
    const dispatchById = new Map(
      dispatchRows.map((dispatch) => [dispatch.id, dispatch]),
    );

    mappedOrders.sort((left, right) => {
      const leftDispatch = left.dispatchId
        ? dispatchById.get(left.dispatchId)
        : undefined;
      const rightDispatch = right.dispatchId
        ? dispatchById.get(right.dispatchId)
        : undefined;
      const leftDispatchQueueIndex =
        typeof leftDispatch?.queueIndex === "number"
          ? leftDispatch.queueIndex
          : Number.MAX_SAFE_INTEGER;
      const rightDispatchQueueIndex =
        typeof rightDispatch?.queueIndex === "number"
          ? rightDispatch.queueIndex
          : Number.MAX_SAFE_INTEGER;

      if (leftDispatchQueueIndex !== rightDispatchQueueIndex) {
        return leftDispatchQueueIndex - rightDispatchQueueIndex;
      }

      const leftDispatchCreatedAt =
        leftDispatch?.createdAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightDispatchCreatedAt =
        rightDispatch?.createdAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

      if (leftDispatchCreatedAt !== rightDispatchCreatedAt) {
        return leftDispatchCreatedAt - rightDispatchCreatedAt;
      }

      const leftDispatchId = left.dispatchId ?? "";
      const rightDispatchId = right.dispatchId ?? "";

      if (leftDispatchId !== rightDispatchId) {
        return leftDispatchId.localeCompare(rightDispatchId);
      }

      if (left.dispatchOrderIndex !== right.dispatchOrderIndex) {
        return left.dispatchOrderIndex - right.dispatchOrderIndex;
      }

      if (left.orderCreatedAt !== right.orderCreatedAt) {
        return left.orderCreatedAt - right.orderCreatedAt;
      }

      return left.orderId.localeCompare(right.orderId);
    });

    return mappedOrders.map((item, index) => ({
      ...item.order,
      productionIndex: index + 1,
    }));
  }

  async findAssignedDriverIdByOrderId(orderId: string): Promise<string | null> {
    const [row] = await prisma.$queryRaw<Array<{ driverId: string | null }>>`
      SELECT dispatch."driverId"
      FROM "Order" orders
      LEFT JOIN "Dispatch" dispatch
        ON dispatch."id" = orders."dispatchId"
      WHERE orders."id" = ${orderId}
      LIMIT 1
    `;

    if (!row) {
      return null;
    }

    return row.driverId ?? null;
  }

  async updateDelivery(
    input: UpdateOrderDeliveryInput,
  ): Promise<UpdateOrderDeliveryResult | null> {
    const [row] = await prisma.$queryRaw<Array<{ deliveredAt: Date | null; id: string }>>`
      UPDATE "Order"
      SET
        "deliveredAt" = ${input.deliveredAt}
      WHERE "id" = ${input.orderId}
      RETURNING
        "id",
        "deliveredAt"
    `;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      deliveredAt: row.deliveredAt ? row.deliveredAt.toISOString() : null,
    };
  }

  async getById(orderId: string): Promise<OrderDetail | null> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        deliveryAddress: {
          select: {
            deliveryFee: true,
          },
        },
        orderProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!order) return null;

    const items: OrderDetailLineItem[] = order.orderProducts.map((item) => {
      const lineTotalCents = item.amount * item.quantity;
      return {
        productId: item.productId,
        productName: item.product?.name ?? "Unknown product",
        quantity: item.quantity,
        unitAmountCents: item.amount,
        lineTotalCents,
      };
    });

    const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const discountedFromSnapshot = extractDiscountedSubtotalFromSnapshot(
      order.progressiveDiscountSnapshot,
    );
    const discountedSubtotalCents =
      discountedFromSnapshot !== null ? discountedFromSnapshot : subtotalCents;
    const safeDiscountedSubtotal = Math.max(0, discountedSubtotalCents);
    const tipPercent =
      typeof order.tipAmount === "number" && Number.isFinite(order.tipAmount)
        ? Math.max(order.tipAmount, 0)
        : 0;
    const tipAmountCents = Math.round((safeDiscountedSubtotal * tipPercent) / 100);
    const deliveryFeeCents =
      order.type === "DELIVERY"
        ? Math.max(order.deliveryAddress?.deliveryFee ?? 0, 0)
        : 0;
    const totalCents = safeDiscountedSubtotal + tipAmountCents + deliveryFeeCents;

    return {
      id: order.id,
      number: order.number,
      createdAt: order.createdAt,
      orderType: order.type,
      paymentMethod: order.paymentMethod,
      status: order.canceled ? "CANCELED" : order.status,
      canceled: order.canceled,
      customer: {
        name: order.customer?.name ?? null,
        phone: order.customer?.phone ?? null,
      },
      items,
      subtotalCents,
      discountedSubtotalCents: safeDiscountedSubtotal,
      tipPercent,
      tipAmountCents,
      deliveryFeeCents,
      totalCents,
    };
  }

  async list(query: OrderListQuery): Promise<OrderListItem[]> {
    const rows = await prisma.$queryRaw<OrderRow[]>`
      WITH order_subtotals AS (
        SELECT
          op."orderId" AS "orderId",
          COALESCE(SUM(op."amount" * op."quantity"), 0)::numeric AS subtotal_cents
        FROM "OrderProducts" op
        GROUP BY op."orderId"
      )
      SELECT
        o."id",
        o."number",
        o."createdAt",
        o."type"::text AS "orderType",
        o."paymentMethod"::text AS "paymentMethod",
        o."status"::text AS "status",
        o."canceled",
        customer."name" AS "customerName",
        customer."phone" AS "customerPhone",
        (
          GREATEST(
            0,
            CASE
              WHEN o."progressiveDiscountSnapshot" IS NOT NULL
                AND jsonb_typeof(o."progressiveDiscountSnapshot"::jsonb) = 'object'
                AND (o."progressiveDiscountSnapshot"::jsonb ? 'discountedPrice')
                AND (o."progressiveDiscountSnapshot"::jsonb ->> 'discountedPrice') ~ '^-?[0-9]+(\\.[0-9]+)?$'
              THEN (o."progressiveDiscountSnapshot"::jsonb ->> 'discountedPrice')::numeric
              ELSE COALESCE(os.subtotal_cents, 0)
            END
          )
          + ROUND(
              (GREATEST(
                0,
                CASE
                  WHEN o."progressiveDiscountSnapshot" IS NOT NULL
                    AND jsonb_typeof(o."progressiveDiscountSnapshot"::jsonb) = 'object'
                    AND (o."progressiveDiscountSnapshot"::jsonb ? 'discountedPrice')
                    AND (o."progressiveDiscountSnapshot"::jsonb ->> 'discountedPrice') ~ '^-?[0-9]+(\\.[0-9]+)?$'
                  THEN (o."progressiveDiscountSnapshot"::jsonb ->> 'discountedPrice')::numeric
                  ELSE COALESCE(os.subtotal_cents, 0)
                END
              ) * COALESCE(o."tipAmount", 0)::numeric) / 100.0
            )
        )::bigint::text AS "totalCents"
      FROM "Order" o
      LEFT JOIN "Customer" customer ON customer."id" = o."customerId"
      LEFT JOIN order_subtotals os ON os."orderId" = o."id"
      WHERE (${query.includeCanceled} = true OR o."canceled" = false)
        AND (${query.from}::text IS NULL OR timezone(${query.timezone}, o."createdAt")::date >= ${query.from}::date)
        AND (${query.to}::text IS NULL OR timezone(${query.timezone}, o."createdAt")::date <= ${query.to}::date)
      ORDER BY o."createdAt" DESC
      LIMIT ${query.limit}
    `;

    return rows.map((row: OrderRow) => ({
      id: row.id,
      number: row.number,
      createdAt: row.createdAt,
      orderType: row.orderType,
      paymentMethod: row.paymentMethod,
      status: row.canceled ? "CANCELED" : row.status,
      canceled: row.canceled,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      totalCents: Number(row.totalCents || "0"),
    }));
  }
}

function extractDiscountedSubtotalFromSnapshot(value: unknown): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (!("discountedPrice" in value)) return null;
  const discountedPrice = (value as { discountedPrice?: unknown }).discountedPrice;
  if (typeof discountedPrice !== "number" || !Number.isFinite(discountedPrice)) {
    return null;
  }
  return Math.round(discountedPrice);
}
