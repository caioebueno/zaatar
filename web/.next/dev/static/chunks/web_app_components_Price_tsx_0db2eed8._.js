(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/web/app/components/Price.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CartProvider",
    ()=>CartProvider,
    "useCart",
    ()=>useCart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
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
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
        if (!storedCart) {
            return {
                items: []
            };
        }
        const parsedCart = JSON.parse(storedCart);
        if (!parsedCart || !Array.isArray(parsedCart.items)) {
            return {
                items: []
            };
        }
        return parsedCart;
    } catch  {
        return {
            items: []
        };
    }
}
const CartContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function CartProvider({ children }) {
    _s();
    const [cart, setCart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(getInitialCart);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CartProvider.useEffect": ()=>{
            try {
                window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
            } catch  {
            // ignore storage errors
            }
        }
    }["CartProvider.useEffect"], [
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CartContext.Provider, {
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
_s(CartProvider, "W+vhyCO8uqcMVWvuI2+DYJoI3as=");
_c = CartProvider;
function useCart() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
}
_s1(useCart, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "CartProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=web_app_components_Price_tsx_0db2eed8._.js.map