import prisma from "../../prisma";

const FLORIDA_TIME_ZONE = "America/New_York";

export type MenuVisitsDailyPoint = {
  day: string;
  visits: number;
  uniqueVisitors: number;
};

export type MenuVisitsTopMenu = {
  menuId: string | null;
  name: string;
  visits: number;
};

export type MenuVisitsTopPromotion = {
  promotionId: string | null;
  name: string;
  visits: number;
};

export type MenuVisitsTopLanguage = {
  language: string;
  visits: number;
};

export type MenuVisitsOverview = {
  totalVisits: number;
  uniqueVisitors: number;
  visitsLast7Days: number;
  uniqueVisitorsLast7Days: number;
  dailyLast7Days: MenuVisitsDailyPoint[];
  topMenus: MenuVisitsTopMenu[];
  topPromotions: MenuVisitsTopPromotion[];
  topLanguages: MenuVisitsTopLanguage[];
};

export async function getMenuVisitsOverview(): Promise<MenuVisitsOverview> {
  const [totalsRow] = await prisma.$queryRaw<
    Array<{
      total_visits: string;
      unique_visitors: string;
      visits_last_7_days: string;
      unique_visitors_last_7_days: string;
    }>
  >`
    WITH bounds AS (
      SELECT date_trunc('day', timezone(${FLORIDA_TIME_ZONE}, now()))::timestamp AS local_today_start
    )
    SELECT
      COUNT(*)::text AS total_visits,
      COUNT(DISTINCT mv."visitorId")::text AS unique_visitors,
      COUNT(*) FILTER (
        WHERE (mv."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date >= ((SELECT local_today_start::date FROM bounds) - 6)
      )::text AS visits_last_7_days,
      COUNT(DISTINCT mv."visitorId") FILTER (
        WHERE (mv."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date >= ((SELECT local_today_start::date FROM bounds) - 6)
      )::text AS unique_visitors_last_7_days
    FROM "MenuVisit" mv;
  `;

  const dailyRows = await prisma.$queryRaw<
    Array<{
      day: string;
      visits: string;
      unique_visitors: string;
    }>
  >`
    WITH local_bounds AS (
      SELECT date_trunc('day', timezone(${FLORIDA_TIME_ZONE}, now()))::timestamp AS local_today_start
    ),
    days AS (
      SELECT (
        local_bounds.local_today_start - (gs::text || ' days')::interval
      )::date AS day
      FROM local_bounds, generate_series(6, 0, -1) AS gs
    ),
    visit_counts AS (
      SELECT
        local_day AS day,
        COUNT(*)::bigint AS visits,
        COUNT(DISTINCT "visitorId")::bigint AS unique_visitors
      FROM (
        SELECT
          mv."visitorId",
          (mv."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date AS local_day
        FROM "MenuVisit" mv
        WHERE (mv."createdAt" AT TIME ZONE ${FLORIDA_TIME_ZONE})::date >= (
          SELECT (local_today_start::date - 6) FROM local_bounds
        )
      ) AS localized_visits
      GROUP BY local_day
    )
    SELECT
      to_char(d.day, 'YYYY-MM-DD') AS day,
      COALESCE(vc.visits, 0)::text AS visits,
      COALESCE(vc.unique_visitors, 0)::text AS unique_visitors
    FROM days d
    LEFT JOIN visit_counts vc ON vc.day = d.day
    ORDER BY d.day ASC;
  `;

  const topMenusRows = await prisma.$queryRaw<
    Array<{
      menu_id: string | null;
      menu_name: string | null;
      visits: string;
    }>
  >`
    SELECT
      mv."menuId" AS menu_id,
      m."name" AS menu_name,
      COUNT(*)::text AS visits
    FROM "MenuVisit" mv
    LEFT JOIN "Menu" m ON m."id" = mv."menuId"
    GROUP BY mv."menuId", m."name"
    ORDER BY COUNT(*) DESC
    LIMIT 5;
  `;

  const topPromotionsRows = await prisma.$queryRaw<
    Array<{
      promotion_id: string | null;
      promotion_name: string | null;
      visits: string;
    }>
  >`
    SELECT
      mv."promotionId" AS promotion_id,
      ep."name" AS promotion_name,
      COUNT(*)::text AS visits
    FROM "MenuVisit" mv
    LEFT JOIN "ExclusivePromotion" ep ON ep."id" = mv."promotionId"
    WHERE mv."promotionId" IS NOT NULL
    GROUP BY mv."promotionId", ep."name"
    ORDER BY COUNT(*) DESC
    LIMIT 5;
  `;

  const topLanguagesRows = await prisma.$queryRaw<
    Array<{
      language: string;
      visits: string;
    }>
  >`
    SELECT
      COALESCE(NULLIF(TRIM(mv."language"), ''), 'unknown') AS language,
      COUNT(*)::text AS visits
    FROM "MenuVisit" mv
    GROUP BY COALESCE(NULLIF(TRIM(mv."language"), ''), 'unknown')
    ORDER BY COUNT(*) DESC
    LIMIT 5;
  `;

  return {
    totalVisits: Number(totalsRow?.total_visits ?? "0"),
    uniqueVisitors: Number(totalsRow?.unique_visitors ?? "0"),
    visitsLast7Days: Number(totalsRow?.visits_last_7_days ?? "0"),
    uniqueVisitorsLast7Days: Number(
      totalsRow?.unique_visitors_last_7_days ?? "0",
    ),
    dailyLast7Days: dailyRows.map((row) => ({
      day: row.day,
      visits: Number(row.visits),
      uniqueVisitors: Number(row.unique_visitors),
    })),
    topMenus: topMenusRows.map((row) => ({
      menuId: row.menu_id,
      name: row.menu_name ?? (row.menu_id ? `Menu ${row.menu_id}` : "No Menu"),
      visits: Number(row.visits),
    })),
    topPromotions: topPromotionsRows.map((row) => ({
      promotionId: row.promotion_id,
      name:
        row.promotion_name ??
        (row.promotion_id ? `Promotion ${row.promotion_id}` : "No Promotion"),
      visits: Number(row.visits),
    })),
    topLanguages: topLanguagesRows.map((row) => ({
      language: row.language,
      visits: Number(row.visits),
    })),
  };
}
