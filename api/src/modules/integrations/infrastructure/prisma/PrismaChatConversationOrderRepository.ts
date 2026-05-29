import prisma from "../../../../prisma.js";
import { Prisma } from "../../../../../../web/src/generated/prisma/index.js";
import type { OrderDetail } from "../../../orders/application/ports/OrdersRepository.js";
import { PrismaOrdersRepository } from "../../../orders/infrastructure/prisma/PrismaOrdersRepository.js";
import type {
  ChatConversationOrder,
  ChatConversationOrderIntent,
  ChatConversationOrderRepository,
} from "../../application/ports/ChatConversationOrderRepository.js";

type OrderIdRow = {
  id: string;
};

type OrderIntentIdRow = {
  id: string;
};

type OrderIntentRow = {
  active: boolean;
  amount: number | null;
  createdAt: Date;
  customerId: string;
  deliveryAddressCity: string | null;
  deliveryAddressDeliveryFee: number | null;
  deliveryAddressDescription: string | null;
  deliveryAddressIdForObject: string | null;
  deliveryAddressLat: string | null;
  deliveryAddressLng: string | null;
  deliveryAddressNumber: string | null;
  deliveryAddressState: string | null;
  deliveryAddressStreet: string | null;
  deliveryAddressZipCode: string | null;
  deliveryAddressId: string | null;
  id: string;
  language: string | null;
  paymentMethod: "CARD" | "CASH" | "ZELLE";
  paymentProvider: "STRIPE" | null;
  progressiveDiscountSnapshot: unknown;
  status: "ACCEPTED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED";
  tags: string[];
  tipAmount: number | null;
  type: "DELIVERY" | "TAKEAWAY" | null;
  updatedAt: Date;
};

export class PrismaChatConversationOrderRepository
  implements ChatConversationOrderRepository
{
  private readonly ordersRepository = new PrismaOrdersRepository();

  async findLatestOrderByPhoneCandidates(
    phoneCandidates: string[],
  ): Promise<ChatConversationOrder | null> {
    const uniqueCandidates = Array.from(
      new Set(
        phoneCandidates
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      ),
    );
    if (uniqueCandidates.length === 0) {
      return null;
    }

    const rows = await prisma.$queryRaw<OrderIdRow[]>`
      SELECT
        o."id"
      FROM "Order" o
      INNER JOIN "Customer" customer ON customer."id" = o."customerId"
      WHERE customer."phone" IN (${Prisma.join(uniqueCandidates)})
        AND o."deliveredAt" IS NULL
      ORDER BY o."createdAt" DESC
      LIMIT 1
    `;

    const orderId = rows[0]?.id;
    if (!orderId) {
      return null;
    }

    const order = await this.ordersRepository.getById(orderId);
    if (!order) {
      return null;
    }

    return mapOrderDetailToChatConversationOrder(order);
  }

  async findActiveOrderIntentByPhoneCandidates(
    phoneCandidates: string[],
  ): Promise<ChatConversationOrderIntent | null> {
    const uniqueCandidates = Array.from(
      new Set(
        phoneCandidates
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
      ),
    );
    if (uniqueCandidates.length === 0) {
      return null;
    }

    const intentIdRows = await prisma.$queryRaw<OrderIntentIdRow[]>`
      SELECT
        oi."id"
      FROM "OrderIntent" oi
      INNER JOIN "Customer" customer ON customer."id" = oi."customerId"
      WHERE customer."phone" IN (${Prisma.join(uniqueCandidates)})
        AND oi."active" = true
      ORDER BY oi."updatedAt" DESC, oi."createdAt" DESC
      LIMIT 1
    `;

    const intentId = intentIdRows[0]?.id;
    if (!intentId) {
      return null;
    }

    const intentRows = await prisma.$queryRaw<OrderIntentRow[]>`
      SELECT
        oi."id",
        oi."customerId",
        oi."active",
        oi."createdAt",
        oi."updatedAt",
        oi."language",
        oi."status"::text AS "status",
        oi."type"::text AS "type",
        oi."paymentMethod"::text AS "paymentMethod",
        oi."paymentProvider"::text AS "paymentProvider",
        oi."tipAmount",
        oi."tags",
        oi."progressiveDiscountSnapshot",
        oi."amount",
        oi."deliveryAddressId",
        da."id" AS "deliveryAddressIdForObject",
        da."description" AS "deliveryAddressDescription",
        da."street" AS "deliveryAddressStreet",
        da."number" AS "deliveryAddressNumber",
        da."city" AS "deliveryAddressCity",
        da."State" AS "deliveryAddressState",
        da."zipCode" AS "deliveryAddressZipCode",
        da."lat" AS "deliveryAddressLat",
        da."lng" AS "deliveryAddressLng",
        da."deliveryFee" AS "deliveryAddressDeliveryFee"
      FROM "OrderIntent" oi
      LEFT JOIN "DeliveryAddress" da
        ON da."id" = oi."deliveryAddressId"
      WHERE oi."id" = ${intentId}
      LIMIT 1
    `;
    const intent = intentRows[0];
    if (!intent) {
      return null;
    }

    const intentProducts = await (prisma as any).orderIntentProduct.findMany({
      where: { orderIntentId: intentId },
      include: {
        modifierGroupItems: {
          select: { id: true },
        },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    return {
      id: intent.id,
      customerId: intent.customerId,
      active: intent.active,
      createdAt: intent.createdAt.toISOString(),
      updatedAt: intent.updatedAt.toISOString(),
      language: intent.language,
      deliveryAddress: intent.deliveryAddressIdForObject
        ? {
            id: intent.deliveryAddressIdForObject,
            description: intent.deliveryAddressDescription ?? "",
            street: intent.deliveryAddressStreet ?? "",
            number: intent.deliveryAddressNumber ?? "",
            city: intent.deliveryAddressCity ?? "",
            state: intent.deliveryAddressState ?? "",
            zipCode: intent.deliveryAddressZipCode ?? "",
            lat: intent.deliveryAddressLat ?? "",
            lng: intent.deliveryAddressLng ?? "",
            deliveryFee: intent.deliveryAddressDeliveryFee ?? 0,
          }
        : null,
      status: intent.status,
      type: intent.type,
      paymentMethod: intent.paymentMethod,
      paymentProvider: intent.paymentProvider,
      tipAmount: intent.tipAmount,
      tags: intent.tags ?? [],
      progressiveDiscountSnapshot: intent.progressiveDiscountSnapshot,
      amount: intent.amount,
      deliveryAddressId: intent.deliveryAddressId,
      orderProducts: intentProducts.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        comments: item.comments,
        fullAmount: item.fullAmount,
        amount: item.amount,
        modifierGroupItemIds: (item.modifierGroupItems ?? []).map(
          (modifier: { id: string }) => modifier.id,
        ),
      })),
    };
  }
}

function mapOrderDetailToChatConversationOrder(
  value: OrderDetail,
): ChatConversationOrder {
  return {
    ...value,
    createdAt: value.createdAt.toISOString(),
  };
}
