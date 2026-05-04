import prisma from "../../prisma";

export type OrderTagCount = {
  tag: string;
  orders: number;
};

export type OrderTagsOverview = {
  taggedOrders: number;
  topTags: OrderTagCount[];
};

export async function getOrderTagsOverview(): Promise<OrderTagsOverview> {
  const [summary] = await prisma.$queryRaw<
    Array<{
      tagged_orders: string;
    }>
  >`
    SELECT
      COUNT(*)::text AS tagged_orders
    FROM "Order" o
    WHERE COALESCE(o."canceled", false) = false
      AND cardinality(COALESCE(o."tags", ARRAY[]::text[])) > 0;
  `;

  const topTagRows = await prisma.$queryRaw<
    Array<{
      tag: string;
      orders: string;
    }>
  >`
    SELECT
      tags.tag AS tag,
      COUNT(DISTINCT o."id")::text AS orders
    FROM "Order" o
    CROSS JOIN LATERAL unnest(COALESCE(o."tags", ARRAY[]::text[])) AS tags(tag)
    WHERE COALESCE(o."canceled", false) = false
      AND NULLIF(TRIM(tags.tag), '') IS NOT NULL
    GROUP BY tags.tag
    ORDER BY COUNT(DISTINCT o."id") DESC, tags.tag ASC
    LIMIT 20;
  `;

  return {
    taggedOrders: Number(summary?.tagged_orders ?? "0"),
    topTags: topTagRows.map((row) => ({
      tag: row.tag,
      orders: Number(row.orders),
    })),
  };
}
