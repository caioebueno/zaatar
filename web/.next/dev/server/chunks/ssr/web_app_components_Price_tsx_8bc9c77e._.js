module.exports = [
"[project]/web/app/components/Price.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CartProvider",
    ()=>CartProvider,
    "useCart",
    ()=>useCart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
/* =========================
   Constants
========================= */ const CART_STORAGE_KEY = "cart";
/* =========================
   Pure Functions
========================= */ function addItemToCart(cart, item) {
    return {
        items: [
            ...cart.items,
            item
        ]
    };
}
function removeItemFromCart(cart, productId) {
    const index = cart.items.findIndex((item)=>item.productId === productId);
    if (index === -1) return cart;
    return {
        items: cart.items.filter((_, i)=>i !== index)
    };
}
function updateItemQuantityInCart(cart, productId, newQuantity) {
    if (newQuantity <= 0) {
        return {
            items: cart.items.filter((item)=>item.productId !== productId)
        };
    }
    const currentQuantity = cart.items.filter((item)=>item.productId === productId).length;
    if (currentQuantity === newQuantity) {
        return cart;
    }
    if (newQuantity > currentQuantity) {
        const quantityToAdd = newQuantity - currentQuantity;
        return {
            items: [
                ...cart.items,
                ...Array.from({
                    length: quantityToAdd
                }, ()=>({
                        productId
                    }))
            ]
        };
    }
    const quantityToRemove = currentQuantity - newQuantity;
    let removed = 0;
    return {
        items: cart.items.filter((item)=>{
            if (item.productId === productId && removed < quantityToRemove) {
                removed += 1;
                return false;
            }
            return true;
        })
    };
}
function clearCartState() {
    return {
        items: []
    };
}
function getInitialCart() {
    if ("TURBOPACK compile-time truthy", 1) {
        return {
            items: []
        };
    }
    //TURBOPACK unreachable
    ;
}
const CartContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
function CartProvider({ children }) {
    const [cart, setCart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(getInitialCart);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        try {
            window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        } catch  {
        // ignore storage errors
        }
    }, [
        cart
    ]);
    const addItem = (item)=>{
        setCart((prev)=>addItemToCart(prev, item));
    };
    const removeItem = (productId)=>{
        setCart((prev)=>removeItemFromCart(prev, productId));
    };
    const updateItemQuantity = (productId, newQuantity)=>{
        setCart((prev)=>updateItemQuantityInCart(prev, productId, newQuantity));
    };
    const clearCart = ()=>{
        setCart(clearCartState());
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CartContext.Provider, {
        value: {
            cart,
            addItem,
            removeItem,
            updateItemQuantity,
            clearCart
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/web/app/components/Price.tsx",
        lineNumber: 152,
        columnNumber: 5
    }, this);
}
function useCart() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
}
}),
];

//# sourceMappingURL=web_app_components_Price_tsx_8bc9c77e._.js.map