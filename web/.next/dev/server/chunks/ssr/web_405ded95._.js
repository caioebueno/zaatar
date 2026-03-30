module.exports = [
"[project]/web/prisma/index.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$generated$2f$prisma$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/generated/prisma/index.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/@prisma/adapter-pg/dist/index.mjs [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
const adapter = new __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f40$prisma$2f$adapter$2d$pg$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PrismaPg"]({
    connectionString: process.env.DATABASE_URL
});
const prisma = new __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$generated$2f$prisma$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PrismaClient"]({
    adapter
});
const __TURBOPACK__default__export__ = prisma;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/web/utils/calculateProductPriceWithProgressiveDiscount.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateProductPriceWithProgressiveDiscount",
    ()=>calculateProductPriceWithProgressiveDiscount
]);
function calculateProductPriceWithProgressiveDiscount(productId, progressiveDiscount, cart, categories) {
    const productMap = new Map();
    for (const category of categories){
        for (const product of category.products){
            productMap.set(product.id, product);
        }
    }
    const product = productMap.get(productId);
    if (!product) return null;
    let cartFullPrice = 0;
    let cartActualPrice = 0;
    for (const item of cart.items){
        const cartProduct = productMap.get(item.productId);
        if (!cartProduct) continue;
        const quantity = typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 0;
        const price = typeof cartProduct.price === "number" ? cartProduct.price : 0;
        const compared = typeof cartProduct.comparedAtPrice === "number" ? cartProduct.comparedAtPrice : price;
        cartFullPrice += compared * quantity;
        cartActualPrice += price * quantity;
    }
    const productActualPrice = typeof product.price === "number" ? product.price : 0;
    const productFullPrice = typeof product.comparedAtPrice === "number" ? product.comparedAtPrice : productActualPrice;
    const nextCartFullPrice = Number((cartFullPrice + productFullPrice).toFixed(2));
    let appliedStep = null;
    if (progressiveDiscount?.steps?.length) {
        appliedStep = progressiveDiscount.steps.filter((step)=>step.type === "PERCENTAGEDISCOUNT" && typeof step.amount === "number" && nextCartFullPrice >= step.amount).sort((a, b)=>(b.amount ?? 0) - (a.amount ?? 0))[0] ?? null;
    }
    let discountedPrice = productActualPrice;
    if (appliedStep?.type === "PERCENTAGEDISCOUNT" && typeof appliedStep.discount === "number") {
        discountedPrice = productActualPrice * (1 - appliedStep.discount / 100);
    }
    discountedPrice = Number(discountedPrice.toFixed(2));
    return {
        fullPrice: Number(productFullPrice.toFixed(2)),
        actualPrice: Number(productActualPrice.toFixed(2)),
        discountedPrice,
        discountAmount: Number((productFullPrice - discountedPrice).toFixed(2)),
        appliedStep
    };
}
}),
"[project]/web/.next-internal/server/app/menu/[lg]/cart/page/actions.js { ACTIONS_MODULE0 => \"[project]/web/src/getProducts.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/web/src/getCustomerData.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/web/src/addNewDeliveryAddress.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/web/src/updateCustomerName.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE4 => \"[project]/web/src/createOrder.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/getProducts.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/getCustomerData.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/addNewDeliveryAddress.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/updateCustomerName.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/createOrder.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/web/.next-internal/server/app/menu/[lg]/cart/page/actions.js { ACTIONS_MODULE0 => \"[project]/web/src/getProducts.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/web/src/getCustomerData.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/web/src/addNewDeliveryAddress.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/web/src/updateCustomerName.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE4 => \"[project]/web/src/createOrder.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "00223c93922a0fc1c165d0957ca23972447dc2dc82",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "403439ec2059eae5b92dd1679c7dedb96442604e9a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "407215534b11ab8f1c07aef6263c7e60818b047b74",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "407a30e8638f195f1a65cf49038efbcf9ff4320301",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "40cb97b45b5728520081bba674e022ce0a50cb297a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f2e$next$2d$internal$2f$server$2f$app$2f$menu$2f5b$lg$5d2f$cart$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$web$2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$web$2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$web$2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$web$2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$web$2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/web/.next-internal/server/app/menu/[lg]/cart/page/actions.js { ACTIONS_MODULE0 => "[project]/web/src/getProducts.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/web/src/getCustomerData.ts [app-rsc] (ecmascript)", ACTIONS_MODULE2 => "[project]/web/src/addNewDeliveryAddress.ts [app-rsc] (ecmascript)", ACTIONS_MODULE3 => "[project]/web/src/updateCustomerName.ts [app-rsc] (ecmascript)", ACTIONS_MODULE4 => "[project]/web/src/createOrder.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/getProducts.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/getCustomerData.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/addNewDeliveryAddress.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/updateCustomerName.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/createOrder.ts [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f2e$next$2d$internal$2f$server$2f$app$2f$menu$2f5b$lg$5d2f$cart$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$web$2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$web$2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$web$2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$web$2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$web$2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$web$2f2e$next$2d$internal$2f$server$2f$app$2f$menu$2f5b$lg$5d2f$cart$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$web$2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$web$2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$web$2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$web$2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE4__$3d3e$__$225b$project$5d2f$web$2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=web_405ded95._.js.map