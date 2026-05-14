import prisma from "../../../../prisma.js";
import type {
  FeedbackListItem,
  FeedbackListQuery,
  FeedbackRepository,
  FeedbackSentiment,
} from "../../application/ports/FeedbackRepository.js";

type FeedbackRow = {
  comment: string | null;
  createdAt: Date;
  customerName: string | null;
  customerPhone: string | null;
  deliverySpeed: number | null;
  id: string;
  language: string | null;
  orderId: string;
  orderNumber: string | null;
  orderStatus: string | null;
  orderType: string | null;
  overallRating: number;
  productQuality: number | null;
  rewardId: string | null;
  rewardProductId: string | null;
  rewardProductName: string | null;
  rewardQuantity: number | null;
  rewardStatus: string | null;
  rewardTitle: string | null;
  sentiment: string;
  serviceExperience: number | null;
  temperature: number | null;
};

export class PrismaFeedbackRepository implements FeedbackRepository {
  async list(query: FeedbackListQuery): Promise<FeedbackListItem[]> {
    const rows = await prisma.$queryRaw<FeedbackRow[]>`
      SELECT
        cf."id",
        cf."createdAt",
        cf."orderId",
        cf."language",
        cf."overallRating",
        cf."sentiment"::text AS "sentiment",
        cf."productQuality",
        cf."temperature",
        cf."deliverySpeed",
        cf."serviceExperience",
        cf."comment",
        o."number" AS "orderNumber",
        o."status"::text AS "orderStatus",
        o."type"::text AS "orderType",
        c."name" AS "customerName",
        c."phone" AS "customerPhone",
        cr."id" AS "rewardId",
        cr."title" AS "rewardTitle",
        cr."status"::text AS "rewardStatus",
        cr."quantity" AS "rewardQuantity",
        cr."productId" AS "rewardProductId",
        p."name" AS "rewardProductName"
      FROM "CustomerFeedback" cf
      LEFT JOIN "Order" o ON o."id" = cf."orderId"
      LEFT JOIN "Customer" c ON c."id" = cf."customerId"
      LEFT JOIN "CustomerReward" cr ON cr."feedbackId" = cf."id"
      LEFT JOIN "Product" p ON p."id" = cr."productId"
      WHERE (${query.sentiment}::text IS NULL OR cf."sentiment"::text = ${query.sentiment}::text)
        AND (${query.from}::text IS NULL OR timezone(${query.timezone}, cf."createdAt")::date >= ${query.from}::date)
        AND (${query.to}::text IS NULL OR timezone(${query.timezone}, cf."createdAt")::date <= ${query.to}::date)
      ORDER BY cf."createdAt" DESC
      LIMIT ${query.limit}
    `;

    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      orderStatus: row.orderStatus,
      orderType: row.orderType,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      language: row.language,
      overallRating: Number(row.overallRating ?? 0),
      sentiment: row.sentiment as FeedbackSentiment,
      productQuality: toNullableNumber(row.productQuality),
      temperature: toNullableNumber(row.temperature),
      deliverySpeed: toNullableNumber(row.deliverySpeed),
      serviceExperience: toNullableNumber(row.serviceExperience),
      comment: row.comment,
      reward: row.rewardId
        ? {
            id: row.rewardId,
            title: row.rewardTitle ?? "Reward",
            status: row.rewardStatus ?? "ACTIVE",
            quantity: toNullableNumber(row.rewardQuantity),
            productId: row.rewardProductId,
            productName: row.rewardProductName,
          }
        : null,
    }));
  }
}

function toNullableNumber(value: number | null): number | null {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}
