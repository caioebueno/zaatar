(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/web/app/components/CartContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
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
        return {
            items: cart.items.map((item)=>{
                if (item.productId === productId) return {
                    ...item,
                    quantity: newQuantity
                };
                return item;
            })
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
        fileName: "[project]/web/app/components/CartContext.tsx",
        lineNumber: 153,
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
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
"[project]/node_modules/nuqs/dist/context-C4spomkL.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "a",
    ()=>useAdapterProcessUrlSearchParams,
    "c",
    ()=>debug,
    "i",
    ()=>useAdapterDefaultOptions,
    "l",
    ()=>warn,
    "n",
    ()=>createAdapterProvider,
    "o",
    ()=>renderQueryString,
    "r",
    ()=>useAdapter,
    "s",
    ()=>error,
    "t",
    ()=>context
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
//#region src/lib/debug.ts
const debugEnabled = isDebugEnabled();
function debug(message, ...args) {
    if (!debugEnabled) return;
    const msg = sprintf(message, ...args);
    performance.mark(msg);
    try {
        console.log(message, ...args);
    } catch  {
        console.log(msg);
    }
}
function warn(message, ...args) {
    if (!debugEnabled) return;
    console.warn(message, ...args);
}
function sprintf(base, ...args) {
    return base.replace(/%[sfdO]/g, (match)=>{
        const arg = args.shift();
        return match === "%O" && arg ? JSON.stringify(arg).replace(/"([^"]+)":/g, "$1:") : String(arg);
    });
}
function isDebugEnabled() {
    if (typeof window === "undefined") return (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.DEBUG || "").includes("nuqs");
    try {
        const test = "nuqs-localStorage-test";
        if (typeof localStorage === "undefined") return false;
        localStorage.setItem(test, test);
        const isStorageAvailable = localStorage.getItem(test) === test;
        localStorage.removeItem(test);
        return isStorageAvailable && (localStorage.getItem("debug") || "").includes("nuqs");
    } catch  {
        return false;
    }
}
//#endregion
//#region src/lib/errors.ts
const errors = {
    303: "Multiple adapter contexts detected. This might happen in monorepos.",
    404: "nuqs requires an adapter to work with your framework.",
    409: "Multiple versions of the library are loaded. This may lead to unexpected behavior. Currently using `%s`, but `%s` (via the %s adapter) was about to load on top.",
    414: "Max safe URL length exceeded. Some browsers may not be able to accept this URL. Consider limiting the amount of state stored in the URL.",
    422: "Invalid options combination: `limitUrlUpdates: debounce` should be used in SSR scenarios, with `shallow: false`",
    429: "URL update rate-limited by the browser. Consider increasing `throttleMs` for key(s) `%s`. %O",
    500: "Empty search params cache. Search params can't be accessed in Layouts.",
    501: "Search params cache already populated. Have you called `parse` twice?"
};
function error(code) {
    return `[nuqs] ${errors[code]}
  See https://nuqs.dev/NUQS-${code}`;
}
//#endregion
//#region src/lib/url-encoding.ts
function renderQueryString(search) {
    if (search.size === 0) return "";
    const query = [];
    for (const [key, value] of search.entries()){
        const safeKey = key.replace(/#/g, "%23").replace(/&/g, "%26").replace(/\+/g, "%2B").replace(/=/g, "%3D").replace(/\?/g, "%3F");
        query.push(`${safeKey}=${encodeQueryValue(value)}`);
    }
    const queryString = "?" + query.join("&");
    warnIfURLIsTooLong(queryString);
    return queryString;
}
function encodeQueryValue(input) {
    return input.replace(/%/g, "%25").replace(/\+/g, "%2B").replace(/ /g, "+").replace(/#/g, "%23").replace(/&/g, "%26").replace(/"/g, "%22").replace(/'/g, "%27").replace(/`/g, "%60").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/[\x00-\x1F]/g, (char)=>encodeURIComponent(char));
}
const URL_MAX_LENGTH = 2e3;
function warnIfURLIsTooLong(queryString) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (typeof location === "undefined") return;
    const url = new URL(location.href);
    url.search = queryString;
    if (url.href.length > URL_MAX_LENGTH) console.warn(error(414));
}
//#endregion
//#region src/adapters/lib/context.ts
const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])({
    useAdapter () {
        throw new Error(error(404));
    }
});
context.displayName = "NuqsAdapterContext";
if (debugEnabled && typeof window !== "undefined") {
    if (window.__NuqsAdapterContext && window.__NuqsAdapterContext !== context) console.error(error(303));
    window.__NuqsAdapterContext = context;
}
/**
* Create a custom adapter (context provider) for nuqs to work with your framework / router.
*
* Adapters are based on React Context,
*
* @param useAdapter
* @returns
*/ function createAdapterProvider(useAdapter) {
    return ({ children, defaultOptions, processUrlSearchParams, ...props })=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(context.Provider, {
            ...props,
            value: {
                useAdapter,
                defaultOptions,
                processUrlSearchParams
            }
        }, children);
}
function useAdapter(watchKeys) {
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(context);
    if (!("useAdapter" in value)) throw new Error(error(404));
    return value.useAdapter(watchKeys);
}
const useAdapterDefaultOptions = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(context).defaultOptions;
const useAdapterProcessUrlSearchParams = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(context).processUrlSearchParams;
;
 //# sourceMappingURL=context-C4spomkL.js.map
}),
"[project]/node_modules/nuqs/dist/debounce-PSGthE_7.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "a",
    ()=>write,
    "c",
    ()=>throttle,
    "i",
    ()=>isAbsentFromUrl,
    "n",
    ()=>globalThrottleQueue,
    "o",
    ()=>debounce,
    "r",
    ()=>createEmitter,
    "s",
    ()=>defaultRateLimit,
    "t",
    ()=>debounceController
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nuqs/dist/context-C4spomkL.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
;
//#region src/lib/queues/rate-limiting.ts
function getDefaultThrottle() {
    if (typeof window === "undefined") return 50;
    if (!Boolean(window.GestureEvent)) return 50;
    try {
        const match = navigator.userAgent?.match(/version\/([\d\.]+) safari/i);
        return parseFloat(match[1]) >= 17 ? 120 : 320;
    } catch  {
        return 320;
    }
}
function throttle(timeMs) {
    return {
        method: "throttle",
        timeMs
    };
}
function debounce(timeMs) {
    return {
        method: "debounce",
        timeMs
    };
}
const defaultRateLimit = throttle(getDefaultThrottle());
//#endregion
//#region src/lib/search-params.ts
function isAbsentFromUrl(query) {
    return query === null || Array.isArray(query) && query.length === 0;
}
function write(serialized, key, searchParams) {
    if (typeof serialized === "string") searchParams.set(key, serialized);
    else {
        searchParams.delete(key);
        for (const v of serialized)searchParams.append(key, v);
        if (!searchParams.has(key)) searchParams.set(key, "");
    }
    return searchParams;
}
//#endregion
//#region src/lib/emitter.ts
function createEmitter() {
    const all = /* @__PURE__ */ new Map();
    return {
        on (type, handler) {
            const handlers = all.get(type) || [];
            handlers.push(handler);
            all.set(type, handlers);
            return ()=>this.off(type, handler);
        },
        off (type, handler) {
            const handlers = all.get(type);
            if (handlers) all.set(type, handlers.filter((h)=>h !== handler));
        },
        emit (type, event) {
            all.get(type)?.forEach((handler)=>handler(event));
        }
    };
}
//#endregion
//#region src/lib/timeout.ts
function timeout(callback, ms, signal) {
    function onTick() {
        callback();
        signal.removeEventListener("abort", onAbort);
    }
    const id = setTimeout(onTick, ms);
    function onAbort() {
        clearTimeout(id);
        signal.removeEventListener("abort", onAbort);
    }
    signal.addEventListener("abort", onAbort);
}
//#endregion
//#region src/lib/with-resolvers.ts
function withResolvers() {
    const P = Promise;
    if (Promise.hasOwnProperty("withResolvers")) return Promise.withResolvers();
    let resolve = ()=>{};
    let reject = ()=>{};
    return {
        promise: new P((res, rej)=>{
            resolve = res;
            reject = rej;
        }),
        resolve,
        reject
    };
}
//#endregion
//#region src/lib/compose.ts
function compose(fns, final) {
    let next = final;
    for(let i = fns.length - 1; i >= 0; i--){
        const fn = fns[i];
        if (!fn) continue;
        const prev = next;
        next = ()=>fn(prev);
    }
    next();
}
//#endregion
//#region src/lib/queues/throttle.ts
function getSearchParamsSnapshotFromLocation() {
    return new URLSearchParams(location.search);
}
var ThrottledQueue = class {
    updateMap = /* @__PURE__ */ new Map();
    options = {
        history: "replace",
        scroll: false,
        shallow: true
    };
    timeMs = defaultRateLimit.timeMs;
    transitions = /* @__PURE__ */ new Set();
    resolvers = null;
    controller = null;
    lastFlushedAt = 0;
    resetQueueOnNextPush = false;
    push({ key, query, options }, timeMs = defaultRateLimit.timeMs) {
        if (this.resetQueueOnNextPush) {
            this.reset();
            this.resetQueueOnNextPush = false;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs gtq] Enqueueing %s=%s %O", key, query, options);
        this.updateMap.set(key, query);
        if (options.history === "push") this.options.history = "push";
        if (options.scroll) this.options.scroll = true;
        if (options.shallow === false) this.options.shallow = false;
        if (options.startTransition) this.transitions.add(options.startTransition);
        if (!Number.isFinite(this.timeMs) || timeMs > this.timeMs) this.timeMs = timeMs;
    }
    getQueuedQuery(key) {
        return this.updateMap.get(key);
    }
    getPendingPromise({ getSearchParamsSnapshot = getSearchParamsSnapshotFromLocation }) {
        return this.resolvers?.promise ?? Promise.resolve(getSearchParamsSnapshot());
    }
    flush({ getSearchParamsSnapshot = getSearchParamsSnapshotFromLocation, rateLimitFactor = 1, ...adapter }, processUrlSearchParams) {
        this.controller ??= new AbortController();
        if (!Number.isFinite(this.timeMs)) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs gtq] Skipping flush due to throttleMs=Infinity");
            return Promise.resolve(getSearchParamsSnapshot());
        }
        if (this.resolvers) return this.resolvers.promise;
        this.resolvers = withResolvers();
        const flushNow = ()=>{
            this.lastFlushedAt = performance.now();
            const [search, error] = this.applyPendingUpdates({
                ...adapter,
                autoResetQueueOnUpdate: adapter.autoResetQueueOnUpdate ?? true,
                getSearchParamsSnapshot
            }, processUrlSearchParams);
            if (error === null) {
                this.resolvers.resolve(search);
                this.resetQueueOnNextPush = true;
            } else this.resolvers.reject(search);
            this.resolvers = null;
        };
        const runOnNextTick = ()=>{
            const timeSinceLastFlush = performance.now() - this.lastFlushedAt;
            const timeMs = this.timeMs;
            const flushInMs = rateLimitFactor * Math.max(0, timeMs - timeSinceLastFlush);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(`[nuqs gtq] Scheduling flush in %f ms. Throttled at %f ms (x%f)`, flushInMs, timeMs, rateLimitFactor);
            if (flushInMs === 0) flushNow();
            else timeout(flushNow, flushInMs, this.controller.signal);
        };
        timeout(runOnNextTick, 0, this.controller.signal);
        return this.resolvers.promise;
    }
    abort() {
        this.controller?.abort();
        this.controller = new AbortController();
        this.resolvers?.resolve(new URLSearchParams());
        this.resolvers = null;
        return this.reset();
    }
    reset() {
        const queuedKeys = Array.from(this.updateMap.keys());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs gtq] Resetting queue %s", JSON.stringify(Object.fromEntries(this.updateMap)));
        this.updateMap.clear();
        this.transitions.clear();
        this.options = {
            history: "replace",
            scroll: false,
            shallow: true
        };
        this.timeMs = defaultRateLimit.timeMs;
        return queuedKeys;
    }
    applyPendingUpdates(adapter, processUrlSearchParams) {
        const { updateUrl, getSearchParamsSnapshot } = adapter;
        let search = getSearchParamsSnapshot();
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(`[nuqs gtq] Applying %d pending update(s) on top of %s`, this.updateMap.size, search.toString());
        if (this.updateMap.size === 0) return [
            search,
            null
        ];
        const items = Array.from(this.updateMap.entries());
        const options = {
            ...this.options
        };
        const transitions = Array.from(this.transitions);
        if (adapter.autoResetQueueOnUpdate) this.reset();
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs gtq] Flushing queue %O with options %O", items, options);
        for (const [key, value] of items)if (value === null) search.delete(key);
        else search = write(value, key, search);
        if (processUrlSearchParams) search = processUrlSearchParams(search);
        try {
            compose(transitions, ()=>{
                updateUrl(search, options);
            });
            return [
                search,
                null
            ];
        } catch (err) {
            console.error((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["s"])(429), items.map(([key])=>key).join(), err);
            return [
                search,
                err
            ];
        }
    }
};
const globalThrottleQueue = new ThrottledQueue();
//#endregion
//#region src/lib/queues/useSyncExternalStores.ts
/**
* Like `useSyncExternalStore`, but for subscribing to multiple keys.
*
* Each key becomes the key of the returned object,
* and the value is the result of calling `getKeySnapshot` with that key.
*
* @param keys - A list of keys to subscribe to.
* @param subscribeKey - A function that takes a key and a callback,
* subscribes to an external store using that key (calling the callback when
* state changes occur), and returns a function to unsubscribe from that key.
* @param getKeySnapshot - A function that takes a key and returns the snapshot for that key.
* It will be called on the server and on the client, so it needs to handle both
* environments.
*/ function useSyncExternalStores(keys, subscribeKey, getKeySnapshot) {
    const snapshot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSyncExternalStores.useCallback[snapshot]": ()=>{
            const record = Object.fromEntries(keys.map({
                "useSyncExternalStores.useCallback[snapshot].record": (key)=>[
                        key,
                        getKeySnapshot(key)
                    ]
            }["useSyncExternalStores.useCallback[snapshot].record"]));
            return [
                JSON.stringify(record),
                record
            ];
        }
    }["useSyncExternalStores.useCallback[snapshot]"], [
        keys.join(","),
        getKeySnapshot
    ]);
    const cacheRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    if (cacheRef.current === null) cacheRef.current = snapshot();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSyncExternalStores.useSyncExternalStore.useCallback": (callback)=>{
            const off = keys.map({
                "useSyncExternalStores.useSyncExternalStore.useCallback.off": (key)=>subscribeKey(key, callback)
            }["useSyncExternalStores.useSyncExternalStore.useCallback.off"]);
            return ({
                "useSyncExternalStores.useSyncExternalStore.useCallback": ()=>off.forEach({
                        "useSyncExternalStores.useSyncExternalStore.useCallback": (unsubscribe)=>unsubscribe()
                    }["useSyncExternalStores.useSyncExternalStore.useCallback"])
            })["useSyncExternalStores.useSyncExternalStore.useCallback"];
        }
    }["useSyncExternalStores.useSyncExternalStore.useCallback"], [
        keys.join(","),
        subscribeKey
    ]), {
        "useSyncExternalStores.useSyncExternalStore": ()=>{
            const [cacheKey, record] = snapshot();
            if (cacheRef.current[0] === cacheKey) return cacheRef.current[1];
            cacheRef.current = [
                cacheKey,
                record
            ];
            return record;
        }
    }["useSyncExternalStores.useSyncExternalStore"], {
        "useSyncExternalStores.useSyncExternalStore": ()=>cacheRef.current[1]
    }["useSyncExternalStores.useSyncExternalStore"]);
}
//#endregion
//#region src/lib/queues/debounce.ts
var DebouncedPromiseQueue = class {
    callback;
    resolvers = withResolvers();
    controller = new AbortController();
    queuedValue = void 0;
    constructor(callback){
        this.callback = callback;
    }
    abort() {
        this.controller.abort();
        this.queuedValue = void 0;
    }
    push(value, timeMs) {
        this.queuedValue = value;
        this.controller.abort();
        this.controller = new AbortController();
        timeout(()=>{
            const outputResolvers = this.resolvers;
            try {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs dq] Flushing debounce queue", value);
                const callbackPromise = this.callback(value);
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs dq] Reset debounce queue %O", this.queuedValue);
                this.queuedValue = void 0;
                this.resolvers = withResolvers();
                callbackPromise.then((output)=>outputResolvers.resolve(output)).catch((error)=>outputResolvers.reject(error));
            } catch (error) {
                this.queuedValue = void 0;
                outputResolvers.reject(error);
            }
        }, timeMs, this.controller.signal);
        return this.resolvers.promise;
    }
};
var DebounceController = class {
    throttleQueue;
    queues = /* @__PURE__ */ new Map();
    queuedQuerySync = createEmitter();
    constructor(throttleQueue = new ThrottledQueue()){
        this.throttleQueue = throttleQueue;
    }
    useQueuedQueries(keys) {
        return useSyncExternalStores(keys, (key, callback)=>this.queuedQuerySync.on(key, callback), (key)=>this.getQueuedQuery(key));
    }
    push(update, timeMs, adapter, processUrlSearchParams) {
        if (!Number.isFinite(timeMs)) {
            const getSnapshot = adapter.getSearchParamsSnapshot ?? getSearchParamsSnapshotFromLocation;
            return Promise.resolve(getSnapshot());
        }
        const key = update.key;
        if (!this.queues.has(key)) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs dqc] Creating debounce queue for `%s`", key);
            const queue = new DebouncedPromiseQueue((update)=>{
                this.throttleQueue.push(update);
                return this.throttleQueue.flush(adapter, processUrlSearchParams).finally(()=>{
                    if (this.queues.get(update.key)?.queuedValue === void 0) {
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs dqc] Cleaning up empty queue for `%s`", update.key);
                        this.queues.delete(update.key);
                    }
                    this.queuedQuerySync.emit(update.key);
                });
            });
            this.queues.set(key, queue);
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs dqc] Enqueueing debounce update %O", update);
        const promise = this.queues.get(key).push(update, timeMs);
        this.queuedQuerySync.emit(key);
        return promise;
    }
    abort(key) {
        const queue = this.queues.get(key);
        if (!queue) return (passThrough)=>passThrough;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs dqc] Aborting debounce queue %s=%s", key, queue.queuedValue?.query);
        this.queues.delete(key);
        queue.abort();
        this.queuedQuerySync.emit(key);
        return (promise)=>{
            promise.then(queue.resolvers.resolve, queue.resolvers.reject);
            return promise;
        };
    }
    abortAll() {
        for (const [key, queue] of this.queues.entries()){
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs dqc] Aborting debounce queue %s=%s", key, queue.queuedValue?.query);
            queue.abort();
            queue.resolvers.resolve(new URLSearchParams());
            this.queuedQuerySync.emit(key);
        }
        this.queues.clear();
    }
    getQueuedQuery(key) {
        const debouncedQueued = this.queues.get(key)?.queuedValue?.query;
        if (debouncedQueued !== void 0) return debouncedQueued;
        return this.throttleQueue.getQueuedQuery(key);
    }
};
const debounceController = new DebounceController(globalThrottleQueue);
;
 //# sourceMappingURL=debounce-PSGthE_7.js.map
}),
"[project]/node_modules/nuqs/dist/reset-p1J0pPAX.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "n",
    ()=>setQueueResetMutex,
    "r",
    ()=>spinQueueResetMutex,
    "t",
    ()=>resetQueues
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$debounce$2d$PSGthE_7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nuqs/dist/debounce-PSGthE_7.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nuqs/dist/context-C4spomkL.js [app-client] (ecmascript)");
;
;
//#region src/lib/queues/reset.ts
let mutex = 0;
function setQueueResetMutex(value = 1) {
    mutex = value;
}
function spinQueueResetMutex(onReset = resetQueues) {
    mutex = Math.max(0, mutex - 1);
    if (mutex > 0) return;
    onReset();
}
function resetQueues() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs] Aborting queues");
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$debounce$2d$PSGthE_7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["t"].abortAll();
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$debounce$2d$PSGthE_7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["n"].abort().forEach((key)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$debounce$2d$PSGthE_7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["t"].queuedQuerySync.emit(key));
}
;
 //# sourceMappingURL=reset-p1J0pPAX.js.map
}),
"[project]/node_modules/nuqs/dist/patch-history-CLy38Aj7.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "i",
    ()=>shouldPatchHistory,
    "n",
    ()=>markHistoryAsPatched,
    "r",
    ()=>patchHistory,
    "t",
    ()=>historyUpdateMarker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nuqs/dist/context-C4spomkL.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$reset$2d$p1J0pPAX$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nuqs/dist/reset-p1J0pPAX.js [app-client] (ecmascript)");
;
;
//#region src/adapters/lib/patch-history.ts
const historyUpdateMarker = "__nuqs__";
function getSearchParams(url) {
    if (url instanceof URL) return url.searchParams;
    if (url.startsWith("?")) return new URLSearchParams(url);
    try {
        return new URL(url, location.origin).searchParams;
    } catch  {
        return new URLSearchParams(url);
    }
}
function shouldPatchHistory(adapter) {
    if (typeof history === "undefined") return false;
    if (history.nuqs?.version && history.nuqs.version !== "2.8.9") {
        console.error((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["s"])(409), history.nuqs.version, `2.8.9`, adapter);
        return false;
    }
    if (history.nuqs?.adapters?.includes(adapter)) return false;
    return true;
}
function markHistoryAsPatched(adapter) {
    history.nuqs = history.nuqs ?? {
        version: "2.8.9",
        adapters: []
    };
    history.nuqs.adapters.push(adapter);
}
function patchHistory(emitter, adapter) {
    if (!shouldPatchHistory(adapter)) return;
    let lastSearchSeen = typeof location === "object" ? location.search : "";
    emitter.on("update", (search)=>{
        const searchString = search.toString();
        lastSearchSeen = searchString.length ? "?" + searchString : "";
    });
    window.addEventListener("popstate", ()=>{
        lastSearchSeen = location.search;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$reset$2d$p1J0pPAX$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["t"])();
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs %s] Patching history (%s adapter)", "2.8.9", adapter);
    function sync(url) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$reset$2d$p1J0pPAX$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["r"])();
        try {
            if (new URL(url, location.origin).search === lastSearchSeen) return;
        } catch  {}
        try {
            emitter.emit("update", getSearchParams(url));
        } catch (e) {
            console.error(e);
        }
    }
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function nuqs_pushState(state, marker, url) {
        originalPushState.call(history, state, "", url);
        if (url && marker !== historyUpdateMarker) sync(url);
    };
    history.replaceState = function nuqs_replaceState(state, marker, url) {
        originalReplaceState.call(history, state, "", url);
        if (url && marker !== historyUpdateMarker) sync(url);
    };
    markHistoryAsPatched(adapter);
}
;
 //# sourceMappingURL=patch-history-CLy38Aj7.js.map
}),
"[project]/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
"[project]/node_modules/nuqs/dist/impl.app-HXOL9k0k.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "n",
    ()=>useNuqsNextAppRouterAdapter,
    "t",
    ()=>NavigationSpy
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nuqs/dist/context-C4spomkL.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$reset$2d$p1J0pPAX$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nuqs/dist/reset-p1J0pPAX.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$patch$2d$history$2d$CLy38Aj7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nuqs/dist/patch-history-CLy38Aj7.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
;
;
;
;
//#region src/adapters/next/impl.app.ts
const NUM_HISTORY_CALLS_PER_UPDATE = 3;
function onPopState() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$reset$2d$p1J0pPAX$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["n"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$reset$2d$p1J0pPAX$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["t"])();
}
function onHistoryStateUpdate() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$reset$2d$p1J0pPAX$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["r"])(()=>{
        queueMicrotask(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$reset$2d$p1J0pPAX$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["t"]);
    });
}
function patchHistory() {
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$patch$2d$history$2d$CLy38Aj7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["i"])("next/app")) return;
    const originalReplaceState = history.replaceState;
    const originalPushState = history.pushState;
    history.replaceState = function nuqs_replaceState(state, title, url) {
        onHistoryStateUpdate();
        return originalReplaceState.call(history, state, title, url);
    };
    history.pushState = function nuqs_pushState(state, title, url) {
        onHistoryStateUpdate();
        return originalPushState.call(history, state, title, url);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$patch$2d$history$2d$CLy38Aj7$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["n"])("next/app");
}
function NavigationSpy() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "NavigationSpy.useEffect": ()=>{
            patchHistory();
            window.addEventListener("popstate", onPopState);
            return ({
                "NavigationSpy.useEffect": ()=>window.removeEventListener("popstate", onPopState)
            })["NavigationSpy.useEffect"];
        }
    }["NavigationSpy.useEffect"], []);
    return null;
}
function useNuqsNextAppRouterAdapter() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [optimisticSearchParams, setOptimisticSearchParams] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOptimistic"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])());
    return {
        searchParams: optimisticSearchParams,
        updateUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
            "useNuqsNextAppRouterAdapter.useCallback": (search, options)=>{
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["startTransition"])({
                    "useNuqsNextAppRouterAdapter.useCallback": ()=>{
                        if (!options.shallow) setOptimisticSearchParams(search);
                        const url = renderURL(search);
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])("[nuqs next/app] Updating url: %s", url);
                        const updateMethod = options.history === "push" ? history.pushState : history.replaceState;
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$reset$2d$p1J0pPAX$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["n"])(NUM_HISTORY_CALLS_PER_UPDATE);
                        updateMethod.call(history, null, "", url);
                        if (options.scroll) window.scrollTo(0, 0);
                        if (!options.shallow) router.replace(url, {
                            scroll: false
                        });
                    }
                }["useNuqsNextAppRouterAdapter.useCallback"]);
            }
        }["useNuqsNextAppRouterAdapter.useCallback"], []),
        rateLimitFactor: NUM_HISTORY_CALLS_PER_UPDATE,
        autoResetQueueOnUpdate: true
    };
}
function renderURL(search) {
    const { origin, pathname, hash } = location;
    return origin + pathname + (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["o"])(search) + hash;
}
;
 //# sourceMappingURL=impl.app-HXOL9k0k.js.map
}),
"[project]/node_modules/nuqs/dist/adapters/next/app.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NuqsAdapter",
    ()=>NuqsAdapter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nuqs/dist/context-C4spomkL.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$impl$2e$app$2d$HXOL9k0k$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/nuqs/dist/impl.app-HXOL9k0k.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
'use client';
;
;
;
//#region src/adapters/next/app.ts
const Provider = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$context$2d$C4spomkL$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["n"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$impl$2e$app$2d$HXOL9k0k$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["n"]);
function NuqsAdapter({ children, ...adapterProps }) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(Provider, {
        ...adapterProps,
        children: [
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Suspense"], {
                key: "nuqs-adapter-suspense-navspy",
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$nuqs$2f$dist$2f$impl$2e$app$2d$HXOL9k0k$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["t"])
            }),
            children
        ]
    });
}
;
 //# sourceMappingURL=app.js.map
}),
]);

//# sourceMappingURL=_d7452f61._.js.map