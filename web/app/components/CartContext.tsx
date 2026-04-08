"use client";

import TCart, {
  TCartItem,
  TCartPrizeSelection,
  TSelectedModifier,
} from "@/types/cart";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

/* =========================
   Constants
========================= */
const CART_STORAGE_KEY = "cart";

/* =========================
   Helpers
========================= */

function generateCartItemId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeDescription(description?: string) {
  return description?.trim() ?? "";
}

function sortModifiers(modifiers?: TSelectedModifier[]) {
  return [...(modifiers ?? [])].sort((a, b) => {
    const aKey = `${a.modifierId}:${a.modifierItemId}`;
    const bKey = `${b.modifierId}:${b.modifierItemId}`;
    return aKey.localeCompare(bKey);
  });
}

function areModifiersEqual(
  a?: TSelectedModifier[],
  b?: TSelectedModifier[],
): boolean {
  const sortedA = sortModifiers(a);
  const sortedB = sortModifiers(b);

  if (sortedA.length !== sortedB.length) return false;

  return sortedA.every((item, index) => {
    const other = sortedB[index];
    return (
      item.modifierId === other.modifierId &&
      item.modifierItemId === other.modifierItemId
    );
  });
}

function areCartItemsMergeable(a: TCartItem, b: TCartItem): boolean {
  return (
    a.productId === b.productId &&
    normalizeDescription(a.description) ===
      normalizeDescription(b.description) &&
    areModifiersEqual(a.modifiers, b.modifiers)
  );
}

function ensureCartItemId(item: TCartItem): TCartItem {
  return {
    ...item,
    cartId: item.cartId || generateCartItemId(),
    modifiers: item.modifiers ?? [],
    description: normalizeDescription(item.description) || undefined,
  };
}

function sanitizeSelectedPrizeSelection(
  selectedPrize: unknown,
): TCartPrizeSelection | null {
  if (!selectedPrize || typeof selectedPrize !== "object") return null;

  const selectedPrizeObject = selectedPrize as {
    selectedPrizeId?: unknown;
    selectedProductIdsByPrizeId?: unknown;
  };

  const selectedPrizeId =
    typeof selectedPrizeObject.selectedPrizeId === "string" ||
    selectedPrizeObject.selectedPrizeId === null
      ? selectedPrizeObject.selectedPrizeId
      : null;

  const selectedProductIdsByPrizeId: Record<string, string[]> = {};

  if (
    selectedPrizeObject.selectedProductIdsByPrizeId &&
    typeof selectedPrizeObject.selectedProductIdsByPrizeId === "object"
  ) {
    for (const [prizeId, value] of Object.entries(
      selectedPrizeObject.selectedProductIdsByPrizeId as Record<string, unknown>,
    )) {
      if (!Array.isArray(value)) continue;
      selectedProductIdsByPrizeId[prizeId] = value.filter(
        (item): item is string => typeof item === "string",
      );
    }
  }

  return {
    selectedPrizeId,
    selectedProductIdsByPrizeId,
  };
}

/* =========================
   Pure Functions
========================= */

function addItemToCart(cart: TCart, item: TCartItem): TCart {
  const nextItem = ensureCartItemId(item);

  const existingIndex = cart.items.findIndex((cartItem) =>
    areCartItemsMergeable(cartItem, nextItem),
  );

  if (existingIndex === -1) {
    return {
      ...cart,
      items: [...cart.items, nextItem],
    };
  }

  return {
    ...cart,
    items: cart.items.map((cartItem, index) => {
      if (index !== existingIndex) return cartItem;

      return {
        ...cartItem,
        quantity: cartItem.quantity + nextItem.quantity,
      };
    }),
  };
}

function removeItemFromCart(cart: TCart, cartId: string): TCart {
  return {
    ...cart,
    items: cart.items.filter((item) => item.cartId !== cartId),
  };
}

function updateItemQuantityInCart(
  cart: TCart,
  cartId: string,
  newQuantity: number,
): TCart {
  if (newQuantity <= 0) {
    return {
      ...cart,
      items: cart.items.filter((item) => item.cartId !== cartId),
    };
  }

  return {
    ...cart,
    items: cart.items.map((item) => {
      if (item.cartId !== cartId) return item;

      return {
        ...item,
        quantity: newQuantity,
      };
    }),
  };
}

function clearCartState(): TCart {
  return { items: [], selectedPrize: null };
}

function getInitialCart(): TCart {
  if (typeof window === "undefined") {
    return { items: [], selectedPrize: null };
  }

  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!storedCart) {
      return { items: [], selectedPrize: null };
    }

    const parsedCart = JSON.parse(storedCart) as TCart;

    if (!parsedCart || !Array.isArray(parsedCart.items)) {
      return { items: [], selectedPrize: null };
    }

    return {
      items: parsedCart.items.map(ensureCartItemId),
      selectedPrize: sanitizeSelectedPrizeSelection(parsedCart.selectedPrize),
    };
  } catch {
    return { items: [], selectedPrize: null };
  }
}

/* =========================
   Context
========================= */

type CartContextType = {
  cart: TCart;
  addItem: (item: Omit<TCartItem, "cartId"> | TCartItem) => void;
  removeItem: (cartId: string) => void;
  updateItemQuantity: (cartId: string, newQuantity: number) => void;
  setSelectedPrize: (selectedPrize: TCartPrizeSelection | null) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<TCart>(getInitialCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  const addItem = (item: Omit<TCartItem, "cartId"> | TCartItem) => {
    setCart((prev) => addItemToCart(prev, item as TCartItem));
  };

  const removeItem = (cartId: string) => {
    setCart((prev) => removeItemFromCart(prev, cartId));
  };

  const updateItemQuantity = (cartId: string, newQuantity: number) => {
    setCart((prev) => updateItemQuantityInCart(prev, cartId, newQuantity));
  };

  const setSelectedPrize = (selectedPrize: TCartPrizeSelection | null) => {
    setCart((prev) => ({
      ...prev,
      selectedPrize,
    }));
  };

  const clearCart = () => {
    setCart(clearCartState());
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateItemQuantity,
        setSelectedPrize,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
