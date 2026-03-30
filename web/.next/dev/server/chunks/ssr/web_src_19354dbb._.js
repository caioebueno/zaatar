module.exports = [
"[project]/web/src/getCustomerData.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40cb97b45b5728520081bba674e022ce0a50cb297a":"default"},"",""] */ __turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/prisma/index.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
const getCustomerData = async (data)=>{
    const findCustomer = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].customer.findFirst({
        where: {
            phone: data.phone
        },
        include: {
            addresses: true
        }
    });
    if (!findCustomer) {
        const createdCustomer = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].customer.create({
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
(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getCustomerData
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getCustomerData, "40cb97b45b5728520081bba674e022ce0a50cb297a", null);
}),
"[project]/web/src/addNewDeliveryAddress.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"403439ec2059eae5b92dd1679c7dedb96442604e9a":"default"},"",""] */ __turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/prisma/index.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
const addNewDeliveryAddress = async (data)=>{
    const createdAddress = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].deliveryAddress.create({
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
(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    addNewDeliveryAddress
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addNewDeliveryAddress, "403439ec2059eae5b92dd1679c7dedb96442604e9a", null);
}),
"[project]/web/src/updateCustomerName.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"407a30e8638f195f1a65cf49038efbcf9ff4320301":"default"},"",""] */ __turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/prisma/index.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
const updateCustomerName = async (data)=>{
    const customer = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].customer.update({
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
(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    updateCustomerName
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateCustomerName, "407a30e8638f195f1a65cf49038efbcf9ff4320301", null);
}),
"[project]/web/src/getProgressiveDiscount.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/prisma/index.ts [app-rsc] (ecmascript)");
;
const getProgressiveDiscount = async ()=>{
    const prismaProgressiveDiscount = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].progressiveDiscount.findUnique({
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
"[project]/web/src/getProducts.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/prisma/index.ts [app-rsc] (ecmascript)");
;
const getProducts = async ()=>{
    const prismaCategories = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].category.findMany({
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
"[project]/web/src/createOrder.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"407215534b11ab8f1c07aef6263c7e60818b047b74":"default"},"",""] */ __turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/prisma/index.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getProgressiveDiscount$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/getProgressiveDiscount.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$utils$2f$calculateProductPriceWithProgressiveDiscount$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/utils/calculateProductPriceWithProgressiveDiscount.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/src/getProducts.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/web/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
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
    const progressiveDiscount = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getProgressiveDiscount$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])();
    const productData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$src$2f$getProducts$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"])();
    const createdOrder = await __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$prisma$2f$index$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].order.create({
        data: {
            id: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["randomUUID"])(),
            amount: 0,
            deliveryAddressId: data.addressId,
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
(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createOrder
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$web$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createOrder, "407215534b11ab8f1c07aef6263c7e60818b047b74", null);
}),
];

//# sourceMappingURL=web_src_19354dbb._.js.map