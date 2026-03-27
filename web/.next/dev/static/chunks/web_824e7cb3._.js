(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/web/utils/calculatePrice.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateCartWithProgressiveDiscount",
    ()=>calculateCartWithProgressiveDiscount
]);
function calculateCartWithProgressiveDiscount(categories, cart, progressiveDiscount) {
    const productMap = new Map();
    for (const category of categories){
        for (const product of category.products){
            productMap.set(product.id, product);
        }
    }
    let fullPrice = 0; // comparedAt total
    let actualPrice = 0; // real total
    for (const item of cart.items){
        const product = productMap.get(item.productId);
        if (!product) continue;
        const price = typeof product.price === "number" ? product.price : 0;
        const compared = typeof product.comparedAtPrice === "number" ? product.comparedAtPrice : price;
        fullPrice += compared;
        actualPrice += price;
    }
    fullPrice = Number(fullPrice.toFixed(2));
    actualPrice = Number(actualPrice.toFixed(2));
    // --- Progressive discount uses comparedAt logic for eligibility
    let appliedStep = null;
    if (progressiveDiscount?.steps?.length) {
        appliedStep = progressiveDiscount.steps.filter((step)=>step.type === "PERCENTAGEDISCOUNT" && typeof step.amount === "number" && fullPrice >= step.amount).sort((a, b)=>(b.amount ?? 0) - (a.amount ?? 0))[0] ?? null;
    }
    let discountedPrice = actualPrice;
    if (appliedStep?.discount) {
        discountedPrice = actualPrice * (1 - appliedStep.discount / 100);
    }
    discountedPrice = Number(discountedPrice.toFixed(2));
    const discountAmount = Number((fullPrice - discountedPrice).toFixed(2));
    return {
        fullPrice,
        discountedPrice,
        discountAmount,
        appliedStep
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/web/utils/formatCurrecy.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
function formatCurrency(cents) {
    return `$${(cents / 100).toFixed(2)}`;
}
const __TURBOPACK__default__export__ = formatCurrency;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/web/app/components/Price.tsx [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const e = new Error("Could not parse module '[project]/web/app/components/Price.tsx'\n\nExpected '</', got ')'");
e.code = 'MODULE_UNPARSABLE';
throw e;
}),
]);

//# sourceMappingURL=web_824e7cb3._.js.map