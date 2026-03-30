"use client";

import TCart, { TCartItem } from "@/types/cart";
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
   Pure Functions
========================= */

function addItemToCart(cart: TCart, item: TCartItem): TCart {
  return {
    items: [...cart.items, item],
  };
}

function removeItemFromCart(cart: TCart, productId: string): TCart {
  const index = cart.items.findIndex((item) => item.productId === productId);

  if (index === -1) return cart;

  return {
    items: cart.items.filter((_, i) => i !== index),
  };
}

function updateItemQuantityInCart(
  cart: TCart,
  productId: string,
  newQuantity: number,
): TCart {
  if (newQuantity <= 0) {
    return {
      items: cart.items.filter((item) => item.productId !== productId),
    };
  }

  return {
    items: cart.items.map((item) => {
      if (item.productId === productId)
        return {
          ...item,
          quantity: newQuantity,
        };
      return item;
    }),
  };
}

function clearCartState(): TCart {
  return { items: [] };
}

function getInitialCart(): TCart {
  if (typeof window === "undefined") {
    return { items: [] };
  }

  try {
    const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!storedCart) {
      return { items: [] };
    }

    const parsedCart = JSON.parse(storedCart) as TCart;

    if (!parsedCart || !Array.isArray(parsedCart.items)) {
      return { items: [] };
    }

    return parsedCart;
  } catch {
    return { items: [] };
  }
}

/* =========================
   Context
========================= */

type CartContextType = {
  cart: TCart;
  addItem: (item: TCartItem) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, newQuantity: number) => void;
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

  const addItem = (item: TCartItem) => {
    setCart((prev) => addItemToCart(prev, item));
  };

  const removeItem = (productId: string) => {
    setCart((prev) => removeItemFromCart(prev, productId));
  };

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    setCart((prev) => updateItemQuantityInCart(prev, productId, newQuantity));
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
