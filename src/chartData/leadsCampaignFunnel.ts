import prisma from "../../prisma";

export async function leadsCampaignFunnel(campaignId: string) {
  const rows = await prisma.$queryRaw<
    Array<{
      messages_sent: string;
      customer_ids: string[] | null;
      orders_made: string;
    }>
  >`
    WITH first_message AS (
      SELECT
        pm."customerId",
        MIN(pm."sentAt") AS first_sent_at
      FROM "PromotialMessage" pm
      WHERE pm."campaignId" = ${campaignId}
      GROUP BY pm."customerId"
    ),
    converters AS (
      SELECT DISTINCT fm."customerId"
      FROM first_message fm
      JOIN "Order" o
        ON o."customerId" = fm."customerId"
       AND o."createdAt" > fm.first_sent_at
    ),
    msg_count AS (
      SELECT COUNT(*)::bigint AS messages_sent
      FROM "PromotialMessage"
      WHERE "campaignId" = ${campaignId}
    )
    SELECT
      mc.messages_sent::text AS messages_sent,
      (SELECT COUNT(*)::bigint FROM converters)::text AS orders_made,
      (SELECT array_agg(c."customerId") FROM converters c) AS customer_ids
    FROM msg_count mc;
  `;

  const r = rows[0] ?? {
    messages_sent: "0",
    orders_made: "0",
    customer_ids: [],
  };

  return {
    campaignId,
    messagesSent: Number(r.messages_sent) || 0,
    ordersMade: Number(r.orders_made) || 0,
    customerIds: r.customer_ids ?? [],
  };
}
