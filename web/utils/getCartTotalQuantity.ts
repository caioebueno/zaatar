import TCart from "@/types/cart";

export function getCartTotalQuantity(cart: TCart): number {
  return cart.items.reduce((total, item) => {
    const qty =
      typeof item.quantity === "number" && item.quantity > 0
        ? item.quantity
        : 0;

    return total + qty;
  }, 0);
}
