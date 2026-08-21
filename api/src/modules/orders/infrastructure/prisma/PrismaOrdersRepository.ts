import prisma from "../../../../prisma.js";
import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import type {
  DayWindow,
  OrderDetail,
  OrderDetailLineItem,
  OrderListItem,
  PaginatedOrderListQuery,
  PaginatedOrderListItem,
  PaginatedOrderListResult,
  OrderPaymentSummary,
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
  paidAt: Date | null;
  paymentMethod: string;
  sourcePlatform: string | null;
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
        AND: [
          {
            preparationStepCategories: {
              some: {
                stationId,
              },
            },
          },
          {
            OR: [
              {
                preparationStepCategories: {
                  some: {
                    stationId,
                    preparationStepTracks: {
                      some: {
                        completed: false,
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
          where: {
            stationId,
          },
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
          const isWithinWindow =
            order.createdAt >= window.start && order.createdAt < window.end;

          const categories = order.preparationStepCategories
            .map((category) => {
              const relevantTracks = category.preparationStepTracks.filter(
                (track) => isWithinWindow || !track.completed,
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
            payments: buildOrderPayments([], {
              amount: order.amount,
              paidAt: order.paidAt ?? null,
              paymentType: order.paymentMethod,
            }),
            tip: order.tipAmount ?? undefined,
            tipAmount: order.tipAmount ?? undefined,
            addressId: order.addressId ?? undefined,
            address: order.address ?? undefined,
            customer:
              order.customer ||
              (
                order as typeof order & {
                  customerNameSnapshot?: string | null;
                }
              ).customerNameSnapshot
                ? {
                    ...(order.customer?.id ? { id: order.customer.id } : {}),
                    name:
                      order.customer?.name ??
                      (
                        order as typeof order & {
                          customerNameSnapshot?: string | null;
                        }
                      ).customerNameSnapshot ??
                      null,
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
    const storedPaymentsByOrderId = await loadOrderPaymentsByOrderIds([orderId]);

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
      sourcePlatform:
        (
          order as typeof order & {
            sourcePlatform?: string | null;
          }
        ).sourcePlatform ?? null,
      paymentMethod: order.paymentMethod,
      payments: buildOrderPayments(storedPaymentsByOrderId.get(order.id) ?? [], {
        amount: totalCents,
        paidAt: order.paidAt,
        paymentType: order.paymentMethod,
      }),
      status: order.canceled ? "CANCELED" : order.status,
      canceled: order.canceled,
      customer: {
        name:
          order.customer?.name ??
          (
            order as typeof order & {
              customerNameSnapshot?: string | null;
            }
          ).customerNameSnapshot ??
          null,
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
    const rows = await loadOrderListRows({
      includeCanceled: query.includeCanceled,
      from: query.from,
      to: query.to,
      timezone: query.timezone,
      limit: query.limit,
      offset: 0,
    });

    return mapOrderListItems(rows);
  }

  async listPaginated(
    query: PaginatedOrderListQuery,
  ): Promise<PaginatedOrderListResult> {
    const totalItems = await loadOrderListCount({
      includeCanceled: query.includeCanceled,
      from: query.from,
      to: query.to,
      timezone: query.timezone,
    });
    const offset = (query.page - 1) * query.pageSize;
    const rows =
      totalItems > 0
        ? await loadOrderListRows({
            includeCanceled: query.includeCanceled,
            from: query.from,
            to: query.to,
            timezone: query.timezone,
            limit: query.pageSize,
            offset,
          })
        : [];

    return {
      items: await mapPaginatedOrderListItems(rows),
      totalItems,
    };
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

type OrderPaymentRow = {
  amount: number | string;
  externalId: string | null;
  orderId: string;
  paidAt: Date | null;
  paymentProvider: string | null;
  paymentType: string;
};

type DetailedOrderRow = Awaited<
  ReturnType<
    typeof prisma.order.findMany<{
      include: {
        customer: {
          select: {
            name: true;
            phone: true;
          };
        };
        deliveryAddress: {
          select: {
            id: true;
            description: true;
            street: true;
            number: true;
            city: true;
            State: true;
            zipCode: true;
            lat: true;
            lng: true;
            complement: true;
            numberComplement: true;
            deliveryFee: true;
            expectedHandoffDuration: true;
          };
        };
        orderProducts: {
          include: {
            product: {
              select: {
                id: true;
                name: true;
              };
            };
            modifierGroupItems: {
              select: {
                id: true;
                name: true;
                description: true;
                price: true;
              };
            };
          };
          orderBy: {
            createdAt: "asc";
          };
        };
      };
    }>
  >
>[number];

type OrderListFilterInput = {
  from?: string;
  includeCanceled: boolean;
  timezone: string;
  to?: string;
};

type OrderListRowsInput = OrderListFilterInput & {
  limit: number;
  offset: number;
};

function buildOrderListWhereClause(query: OrderListFilterInput): Prisma.Sql {
  const from = query.from ?? null;
  const to = query.to ?? null;

  return Prisma.sql`
    (${query.includeCanceled} = true OR o."canceled" = false)
    AND (${from}::text IS NULL OR timezone(${query.timezone}, o."createdAt")::date >= ${from}::date)
    AND (${to}::text IS NULL OR timezone(${query.timezone}, o."createdAt")::date <= ${to}::date)
  `;
}

async function loadOrderListCount(query: OrderListFilterInput): Promise<number> {
  const whereClause = buildOrderListWhereClause(query);
  const [row] = await prisma.$queryRaw<Array<{ totalItems: string }>>`
    SELECT COUNT(*)::bigint::text AS "totalItems"
    FROM "Order" o
    WHERE ${whereClause}
  `;

  return Number(row?.totalItems ?? "0");
}

async function loadOrderListRows(query: OrderListRowsInput): Promise<OrderRow[]> {
  const whereClause = buildOrderListWhereClause(query);

  return prisma.$queryRaw<OrderRow[]>`
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
      o."paidAt",
      o."type"::text AS "orderType",
      o."paymentMethod"::text AS "paymentMethod",
      o."sourcePlatform"::text AS "sourcePlatform",
      o."status"::text AS "status",
      o."canceled",
      COALESCE(customer."name", o."customerNameSnapshot") AS "customerName",
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
    WHERE ${whereClause}
    ORDER BY o."createdAt" DESC
    LIMIT ${query.limit}
    OFFSET ${query.offset}
  `;
}

async function mapOrderListItems(rows: OrderRow[]): Promise<OrderListItem[]> {
  const storedPaymentsByOrderId = await loadOrderPaymentsByOrderIds(
    rows.map((row) => row.id),
  );

  return rows.map((row: OrderRow) => ({
    id: row.id,
    number: row.number,
    createdAt: row.createdAt,
    orderType: row.orderType,
    sourcePlatform: row.sourcePlatform,
    paymentMethod: row.paymentMethod,
    payments: buildOrderPayments(storedPaymentsByOrderId.get(row.id) ?? [], {
      amount: Number(row.totalCents || "0"),
      paidAt: row.paidAt,
      paymentType: row.paymentMethod,
    }),
    status: row.canceled ? "CANCELED" : row.status,
    canceled: row.canceled,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    totalCents: Number(row.totalCents || "0"),
  }));
}

async function mapPaginatedOrderListItems(
  rows: OrderRow[],
): Promise<PaginatedOrderListItem[]> {
  const orderIds = rows.map((row) => row.id);
  const uniqueOrderIds = Array.from(new Set(orderIds));

  if (uniqueOrderIds.length === 0) {
    return [];
  }

  const [orders, storedPaymentsByOrderId] = await Promise.all([
    prisma.order.findMany({
      where: {
        id: {
          in: uniqueOrderIds,
        },
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        deliveryAddress: {
          select: {
            id: true,
            description: true,
            street: true,
            number: true,
            city: true,
            State: true,
            zipCode: true,
            lat: true,
            lng: true,
            complement: true,
            numberComplement: true,
            deliveryFee: true,
            expectedHandoffDuration: true,
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
            modifierGroupItems: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    }),
    loadOrderPaymentsByOrderIds(uniqueOrderIds),
  ]);

  const orderById = new Map(orders.map((order) => [order.id, order]));

  return rows.flatMap((row) => {
    const order = orderById.get(row.id);
    if (!order) return [];

    return [mapPaginatedOrderItem(order, storedPaymentsByOrderId)];
  });
}

function mapPaginatedOrderItem(
  order: DetailedOrderRow,
  storedPaymentsByOrderId: Map<string, OrderPaymentSummary[]>,
): PaginatedOrderListItem {
  const sourcePlatform =
    (
      order as DetailedOrderRow & {
        sourcePlatform?: string | null;
      }
    ).sourcePlatform ?? null;
  const items = order.orderProducts.map((item) => {
    const lineTotalCents = item.amount * item.quantity;

    return {
      productId: item.productId,
      productName: item.product?.name ?? "Unknown product",
      quantity: item.quantity,
      unitAmountCents: item.amount,
      lineTotalCents,
      ...(item.comments ? { comments: item.comments } : {}),
      modifierGroupItems: item.modifierGroupItems.map((modifierItem) => ({
        id: modifierItem.id,
        name: modifierItem.name,
        price: modifierItem.price,
        ...(modifierItem.description ? { description: modifierItem.description } : {}),
      })),
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
  const customerNameSnapshot =
    (
      order as DetailedOrderRow & {
        customerNameSnapshot?: string | null;
      }
    ).customerNameSnapshot ?? null;

  return {
    id: order.id,
    number: order.number,
    ...(order.externalId ? { externalId: order.externalId } : { externalId: null }),
    createdAt: order.createdAt,
    ...(order.scheduleFor ? { scheduleFor: order.scheduleFor.toISOString() } : {}),
    ...(order.language ? { language: order.language } : { language: null }),
    ...(order.paidAt ? { paidAt: order.paidAt.toISOString() } : { paidAt: null }),
    ...(order.deliveredAt ? { deliveredAt: order.deliveredAt.toISOString() } : { deliveredAt: null }),
    orderType: order.type,
    sourcePlatform,
    paymentMethod: order.paymentMethod,
    paymentProvider: order.paymentProvider ?? null,
    payments: buildOrderPayments(storedPaymentsByOrderId.get(order.id) ?? [], {
      amount: totalCents,
      paidAt: order.paidAt,
      paymentType: order.paymentMethod,
    }),
    status: order.canceled ? "CANCELED" : order.status,
    canceled: order.canceled,
    customer: {
      name: order.customer?.name ?? customerNameSnapshot,
      phone: order.customer?.phone ?? null,
    },
    ...(order.deliveryAddressId
      ? { deliveryAddressId: order.deliveryAddressId }
      : { deliveryAddressId: null }),
    ...(order.deliveryAddress
      ? {
          deliveryAddress: {
            id: order.deliveryAddress.id,
            description: order.deliveryAddress.description,
            street: order.deliveryAddress.street,
            number: order.deliveryAddress.number,
            city: order.deliveryAddress.city,
            state: order.deliveryAddress.State,
            zipCode: order.deliveryAddress.zipCode,
            lat: order.deliveryAddress.lat,
            lng: order.deliveryAddress.lng,
            ...(order.deliveryAddress.complement
              ? { complement: order.deliveryAddress.complement }
              : {}),
            ...(order.deliveryAddress.numberComplement
              ? { numberComplement: order.deliveryAddress.numberComplement }
              : {}),
            ...(typeof order.deliveryAddress.deliveryFee === "number"
              ? { deliveryFee: order.deliveryAddress.deliveryFee }
              : {}),
            ...(typeof order.deliveryAddress.expectedHandoffDuration === "number"
              ? {
                  expectedHandoffDuration:
                    order.deliveryAddress.expectedHandoffDuration,
                }
              : {}),
          },
        }
      : { deliveryAddress: null }),
    ...(order.dispatchId ? { dispatchId: order.dispatchId } : { dispatchId: null }),
    ...(order.branchId ? { branchId: order.branchId } : { branchId: null }),
    tags: Array.isArray(order.tags) ? order.tags : [],
    ...(order.progressiveDiscountSnapshot &&
    typeof order.progressiveDiscountSnapshot === "object"
      ? { progressiveDiscountSnapshot: order.progressiveDiscountSnapshot }
      : {}),
    items,
    subtotalCents,
    discountedSubtotalCents: safeDiscountedSubtotal,
    tipPercent,
    tipAmountCents,
    deliveryFeeCents,
    totalCents,
  };
}

async function loadOrderPaymentsByOrderIds(
  orderIds: string[],
): Promise<Map<string, OrderPaymentSummary[]>> {
  const uniqueOrderIds = Array.from(new Set(orderIds.filter(Boolean)));
  const paymentsByOrderId = new Map<string, OrderPaymentSummary[]>();

  if (uniqueOrderIds.length === 0) {
    return paymentsByOrderId;
  }

  try {
    const rows = await prisma.$queryRaw<OrderPaymentRow[]>`
      SELECT
        "orderId",
        "amount",
        "paidAt",
        "paymentProvider"::text AS "paymentProvider",
        "externalId",
        "paymentType"::text AS "paymentType"
      FROM "OrderPayment"
      WHERE "orderId" IN (${Prisma.join(uniqueOrderIds)})
      ORDER BY "createdAt" ASC, "id" ASC
    `;

    for (const row of rows) {
      const payments = paymentsByOrderId.get(row.orderId) ?? [];
      payments.push({
        amount: Number(row.amount || 0),
        externalId: row.externalId,
        paidAt: row.paidAt ? row.paidAt.toISOString() : null,
        paymentProvider: row.paymentProvider,
        paymentType: row.paymentType,
      });
      paymentsByOrderId.set(row.orderId, payments);
    }
  } catch {
    return paymentsByOrderId;
  }

  return paymentsByOrderId;
}

function buildOrderPayments(
  storedPayments: OrderPaymentSummary[],
  fallback: {
    amount: number;
    externalId?: string | null;
    paidAt: Date | string | null;
    paymentProvider?: string | null;
    paymentType: string;
  },
): OrderPaymentSummary[] {
  if (storedPayments.length > 0) {
    return storedPayments;
  }

  return [
    {
      amount: Math.max(0, Math.round(fallback.amount || 0)),
      externalId: fallback.externalId ?? null,
      paidAt:
        fallback.paidAt instanceof Date
          ? fallback.paidAt.toISOString()
          : fallback.paidAt,
      paymentProvider: fallback.paymentProvider ?? null,
      paymentType: fallback.paymentType,
    },
  ];
}
