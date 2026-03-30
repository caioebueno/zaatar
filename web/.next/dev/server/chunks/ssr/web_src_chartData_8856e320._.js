module.exports = [
"[project]/web/src/chartData/clientOrderCout.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/prisma/index.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const MAX_ORDERS = 6;
const clientOrderCount = async ()=>{
    const customers = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].customer.findMany({
        select: {
            _count: {
                select: {
                    orders: true
                }
            }
        }
    });
    const counts = {};
    for (const customer of customers){
        const orderCount = customer._count.orders;
        const key = orderCount >= MAX_ORDERS ? `${MAX_ORDERS}+` : String(orderCount);
        counts[key] = (counts[key] || 0) + 1;
    }
    const result = [];
    // 0 → 5
    for(let i = 0; i < MAX_ORDERS; i++){
        result.push({
            orders: String(i),
            clients: counts[String(i)] || 0
        });
    }
    // 6+
    result.push({
        orders: `${MAX_ORDERS}+`,
        clients: counts[`${MAX_ORDERS}+`] || 0
    });
    return result;
};
const __TURBOPACK__default__export__ = clientOrderCount;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/web/src/chartData/averageTicketByMonth.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "averageTicketByMonth",
    ()=>averageTicketByMonth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/prisma/index.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
async function averageTicketByMonth(monthsBack = 12) {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].$queryRaw`
    SELECT
      to_char(date_trunc('month', o."createdAt"), 'YYYY-MM') AS month,
      AVG(o.amount)::numeric AS avg_cents,
      COUNT(*)::bigint AS orders,
      SUM(o.amount)::bigint AS revenue_cents
    FROM "Order" o
    WHERE o."createdAt" >= (date_trunc('month', now()) - (${monthsBack}::int || ' months')::interval)
    GROUP BY date_trunc('month', o."createdAt")
    ORDER BY date_trunc('month', o."createdAt") ASC;
  `;
    // convert cents -> dollars + parse numeric strings safely
    return rows.map((r)=>({
            month: r.month,
            avgTicket: Number(r.avg_cents),
            orders: Number(r.orders),
            revenue: Number(r.revenue_cents)
        }));
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/web/src/chartData/leadsCampaignFunnel.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "leadsCampaignFunnel",
    ()=>leadsCampaignFunnel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/prisma/index.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
async function leadsCampaignFunnel(campaignId) {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].$queryRaw`
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
        customer_ids: []
    };
    return {
        campaignId,
        messagesSent: Number(r.messages_sent) || 0,
        ordersMade: Number(r.orders_made) || 0,
        customerIds: r.customer_ids ?? []
    };
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/web/src/chartData/getAvgOrdersPerWeekByMonth.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "getAvgOrdersPerWeekByMonth",
    ()=>getAvgOrdersPerWeekByMonth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/prisma/index.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
async function getAvgOrdersPerWeekByMonth(monthsBack = 6) {
    const rows = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].$queryRaw`
    WITH months AS (
      SELECT
        date_trunc('month', d)::date AS month_start,
        (date_trunc('month', d) + interval '1 month')::date AS month_end,
        ((date_trunc('month', d) + interval '1 month')::date - date_trunc('month', d)::date)::numeric / 7 AS weeks
      FROM generate_series(
        date_trunc('month', now()) - (${monthsBack}::int * interval '1 month'),
        date_trunc('month', now()),
        interval '1 month'
      ) AS d
    ),
    orders_in_month AS (
      SELECT
        m.month_start,
        o."customerId",
        COUNT(*)::int AS orders_count
      FROM months m
      JOIN "Order" o
        ON o."createdAt" >= m.month_start
       AND o."createdAt" <  m.month_end
      GROUP BY m.month_start, o."customerId"
    ),
    agg AS (
      SELECT
        m.month_start,
        m.weeks,
        COUNT(oim."customerId")::bigint AS active_customers,
        COALESCE(SUM(oim.orders_count), 0)::bigint AS total_orders,
        COALESCE(AVG(oim.orders_count::numeric / NULLIF(m.weeks, 0)), 0)::numeric AS avg_per_customer_per_week
      FROM months m
      LEFT JOIN orders_in_month oim
        ON oim.month_start = m.month_start
      GROUP BY m.month_start, m.weeks
    )
    SELECT
      to_char(a.month_start, 'YYYY-MM') AS month,
      a.active_customers::text AS active_customers,
      a.total_orders::text AS total_orders,
      a.weeks::text AS weeks,
      a.avg_per_customer_per_week::text AS avg_per_customer_per_week
    FROM agg a
    ORDER BY a.month_start ASC;
  `;
    return rows.map((r)=>({
            month: r.month,
            activeCustomers: Number(r.active_customers) || 0,
            totalOrders: Number(r.total_orders) || 0,
            weeks: Number(r.weeks) || 0,
            avgOrdersPerCustomerPerWeek: Number(r.avg_per_customer_per_week) || 0
        }));
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=web_src_chartData_8856e320._.js.map