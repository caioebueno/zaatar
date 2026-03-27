module.exports = [
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/src/getCustomerData.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40d75a8fc6f5e685fcacae55367520ede9c1cc5942":"default"},"",""] */ __turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '../prisma'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
const getCustomerData = async (data)=>{
    const findCustomer = await prisma.customer.findFirst({
        where: {
            phone: data.phone
        },
        include: {
            addresses: true
        }
    });
    if (!findCustomer) {
        const createdCustomer = await prisma.customer.create({
            data: {
                id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomUUID"])(),
                phone: data.phone
            }
        });
        return {
            id: createdCustomer.id,
            name: createdCustomer.name
        };
    }
    return {
        id: findCustomer.id,
        name: findCustomer.name,
        addresses: findCustomer.addresses.map((address)=>({
                id: address.id,
                city: address.city,
                createdAt: address.createdAt.toISOString(),
                description: address.description,
                lat: address.lat,
                lng: address.lng,
                number: address.number,
                state: address.State,
                street: address.street,
                zipCode: address.zipCode,
                complement: address.complement || undefined,
                numberComplement: address.numberComplement || undefined,
                customerId: address.customerId || undefined
            }))
    };
};
const __TURBOPACK__default__export__ = getCustomerData;
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getCustomerData
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getCustomerData, "40d75a8fc6f5e685fcacae55367520ede9c1cc5942", null);
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/addNewDeliveryAddress.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40a6d0aa104283db779b4591cb60dcd859911af8aa":"default"},"",""] */ __turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '../prisma'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
const addNewDeliveryAddress = async (data)=>{
    const createdAddress = await prisma.deliveryAddress.create({
        data: {
            id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
            State: data.address.state,
            city: data.address.city,
            description: data.address.description,
            lat: data.address.lat,
            lng: data.address.lng,
            street: data.address.street,
            zipCode: data.address.zipCode,
            complement: data.address.complement,
            customerId: data.address.customerId,
            numberComplement: data.address.numberComplement,
            number: data.address.number
        }
    });
    return {
        id: createdAddress.id,
        city: createdAddress.city,
        createdAt: createdAddress.createdAt.toISOString(),
        description: createdAddress.description,
        lat: createdAddress.lat,
        lng: createdAddress.lng,
        number: createdAddress.number,
        state: createdAddress.State,
        street: createdAddress.street,
        zipCode: createdAddress.zipCode,
        complement: createdAddress.complement || undefined,
        customerId: createdAddress.customerId || undefined,
        numberComplement: createdAddress.numberComplement || undefined
    };
};
const __TURBOPACK__default__export__ = addNewDeliveryAddress;
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    addNewDeliveryAddress
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addNewDeliveryAddress, "40a6d0aa104283db779b4591cb60dcd859911af8aa", null);
}),
"[project]/src/updateCustomerName.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40c9572dbb995dc2cd5f51e8f549b98ede5d93b5aa":"default"},"",""] */ __turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '../prisma'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
const updateCustomerName = async (data)=>{
    const customer = await prisma.customer.update({
        where: {
            id: data.customerId
        },
        data: {
            name: data.name
        }
    });
    return {
        id: customer.id,
        name: customer.name
    };
};
const __TURBOPACK__default__export__ = updateCustomerName;
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    updateCustomerName
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateCustomerName, "40c9572dbb995dc2cd5f51e8f549b98ede5d93b5aa", null);
}),
"[project]/src/getProgressiveDiscount.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
(()=>{
    const e = new Error("Cannot find module '../prisma'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
const getProgressiveDiscount = async ()=>{
    const prismaProgressiveDiscount = await prisma.progressiveDiscount.findUnique({
        where: {
            id: "bdbe5049-241f-4d93-8b88-ddeef5f34880"
        },
        select: {
            id: true,
            steps: true
        }
    });
    if (!prismaProgressiveDiscount) return null;
    return {
        id: prismaProgressiveDiscount?.id,
        steps: prismaProgressiveDiscount?.steps.map((step)=>({
                id: step.id,
                type: step.discountType,
                amount: step.amount || undefined,
                discount: step.discount || undefined
            }))
    };
};
const __TURBOPACK__default__export__ = getProgressiveDiscount;
}),
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
"[project]/src/getProducts.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
(()=>{
    const e = new Error("Cannot find module '../prisma'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
const getProducts = async ()=>{
    const prismaCategories = await prisma.category.findMany({
        select: {
            id: true,
            name: true,
            products: {
                include: {
                    photos: true
                }
            }
        }
    });
    const prismaProgressiveDiscount = await prisma.progressiveDiscount.findUnique({
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
}),
"[project]/src/createOrder.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40d33e6b0e0148313a718fc37d63cbf86c76b54e67":"default"},"",""] */ __turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '../prisma'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$getProgressiveDiscount$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/getProgressiveDiscount.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$utils$2f$calculateProductPriceWithProgressiveDiscount$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/utils/calculateProductPriceWithProgressiveDiscount.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/getProducts.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
const createOrder = async (data)=>{
    if (!data.addressId && data.orderType === "DELIVERY") throw {
        code: "INVALID_PARAMS",
        data: {
            message: "DELIVERY_MUST_HAVE_ADDRESS"
        }
    };
    const progressiveDiscount = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$getProgressiveDiscount$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])();
    const productData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])();
    const createdOrder = await prisma.order.create({
        data: {
            id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
            amount: 0,
            addressId: data.addressId,
            customerId: data.customerId,
            paymentMethod: data.paymentMethod,
            tipAmount: data.tipAmount,
            type: data.orderType,
            orderProducts: {
                createMany: {
                    data: data.cart.items.map((item)=>{
                        const price = (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$utils$2f$calculateProductPriceWithProgressiveDiscount$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["calculateProductPriceWithProgressiveDiscount"])(item.productId, progressiveDiscount, data.cart, productData.categories);
                        if (!price) throw {
                            code: "ERROR_CALCULATING_PRICE",
                            data: {
                                productId: item.productId
                            }
                        };
                        return {
                            id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
                            amount: price.actualPrice,
                            productId: item.productId,
                            fullAmount: price.fullPrice,
                            quantity: item.quantity
                        };
                    })
                }
            }
        }
    });
    return {
        id: createdOrder.id,
        createdAt: createdOrder.createdAt.toISOString(),
        orderProducts: [],
        paymentMethod: createdOrder.paymentMethod,
        type: createdOrder.type
    };
};
const __TURBOPACK__default__export__ = createOrder;
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createOrder
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createOrder, "40d33e6b0e0148313a718fc37d63cbf86c76b54e67", null);
}),
"[project]/web/.next-internal/server/app/menu/[lg]/cart/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/getCustomerData.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/addNewDeliveryAddress.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/src/updateCustomerName.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/src/createOrder.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/getCustomerData.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/addNewDeliveryAddress.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/updateCustomerName.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/createOrder.ts [app-rsc] (ecmascript)");
;
;
;
;
}),
"[project]/web/.next-internal/server/app/menu/[lg]/cart/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/getCustomerData.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/addNewDeliveryAddress.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/src/updateCustomerName.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE3 => \"[project]/src/createOrder.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "40a6d0aa104283db779b4591cb60dcd859911af8aa",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "40c9572dbb995dc2cd5f51e8f549b98ede5d93b5aa",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "40d33e6b0e0148313a718fc37d63cbf86c76b54e67",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"],
    "40d75a8fc6f5e685fcacae55367520ede9c1cc5942",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f2e$next$2d$internal$2f$server$2f$app$2f$menu$2f5b$lg$5d2f$cart$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE3__$3d3e$__$225b$project$5d2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/web/.next-internal/server/app/menu/[lg]/cart/page/actions.js { ACTIONS_MODULE0 => "[project]/src/getCustomerData.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/addNewDeliveryAddress.ts [app-rsc] (ecmascript)", ACTIONS_MODULE2 => "[project]/src/updateCustomerName.ts [app-rsc] (ecmascript)", ACTIONS_MODULE3 => "[project]/src/createOrder.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$getCustomerData$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/getCustomerData.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$addNewDeliveryAddress$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/addNewDeliveryAddress.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$updateCustomerName$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/updateCustomerName.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$createOrder$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/createOrder.ts [app-rsc] (ecmascript)");
}),
"[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/* eslint-disable import/no-extraneous-dependencies */ Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "registerServerReference", {
    enumerable: true,
    get: function() {
        return _server.registerServerReference;
    }
});
const _server = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)"); //# sourceMappingURL=server-reference.js.map
}),
"[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// This function ensures that all the exported values are valid server actions,
// during the runtime. By definition all actions are required to be async
// functions, but here we can only check that they are functions.
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ensureServerEntryExports", {
    enumerable: true,
    get: function() {
        return ensureServerEntryExports;
    }
});
function ensureServerEntryExports(actions) {
    for(let i = 0; i < actions.length; i++){
        const action = actions[i];
        if (typeof action !== 'function') {
            throw Object.defineProperty(new Error(`A "use server" file can only export async functions, found ${typeof action}.\nRead more: https://nextjs.org/docs/messages/invalid-use-server-value`), "__NEXT_ERROR_CODE", {
                value: "E352",
                enumerable: false,
                configurable: true
            });
        }
    }
} //# sourceMappingURL=action-validate.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__fb4b7337._.js.map