import prisma from "../../../../prisma.js";
import type {
  OrderDetail,
  OrderDetailLineItem,
  OrderListItem,
  OrderListQuery,
  OrdersRepository,
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
