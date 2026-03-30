module.exports = [
"[project]/web/src/getProducts.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

/* __next_internal_action_entry_do_not_use__ [{"00223c93922a0fc1c165d0957ca23972447dc2dc82":"default"},"",""] */ __turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/prisma/index.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
const getProducts = async ()=>{
    const prismaCategories = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].category.findMany({
        select: {
            id: true,
            name: true,
            products: {
                include: {
                    photos: true,
                    modifierGroups: {
                        include: {
                            items: true
                        }
                    }
                }
            }
        }
    });
    const prismaProgressiveDiscount = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].progressiveDiscount.findUnique({
        where: {
            id: "bdbe5049-241f-4d93-8b88-ddeef5f34880"
        },
        select: {
            id: true,
            steps: true
        }
    });
    return {
        progressiveDiscount: prismaProgressiveDiscount ? {
            id: prismaProgressiveDiscount?.id,
            steps: prismaProgressiveDiscount.steps.map((step)=>({
                    id: step.id,
                    type: step.discountType,
                    amount: step.amount || undefined,
                    discount: step.discount || undefined
                }))
        } : null,
        categories: prismaCategories.map((category)=>({
                id: category.id,
                title: category.name,
                products: category.products.map((product)=>({
                        id: product.id,
                        name: product.name,
                        description: product.description || undefined,
                        price: product.price || undefined,
                        comparedAtPrice: product.comparedAtPrice || undefined,
                        modifierGroups: product.modifierGroups.map((item)=>({
                                id: item.id,
                                required: item.required,
                                title: item.title,
                                items: item.items.map((modifierItem)=>({
                                        id: modifierItem.id,
                                        name: modifierItem.name,
                                        price: modifierItem.price
                                    }))
                            })),
                        photos: product.photos?.map((photo)=>({
                                id: photo.id,
                                // name: photo.name,
                                url: photo.url
                            }))
                    }))
            }))
    };
};
const __TURBOPACK__default__export__ = getProducts;
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getProducts
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getProducts, "00223c93922a0fc1c165d0957ca23972447dc2dc82", null);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=web_src_getProducts_ts_66b7ba3d._.js.map