import TCart from "@/types/cart";
import { TProgressiveDiscountStep } from "../../src/types/progressiveDiscount";
import TCategory from "../../src/types/category";
import TProduct from "../../src/types/product";

export function isProgressiveDiscountStepMet(
  step: TProgressiveDiscountStep,
  cart: TCart,
  categories: TCategory[]
): boolean {
  if (typeof step.amount !== "number") {
    return false;
  }

  const productMap = new Map<string, TProduct>();

  for (const category of categories) {
    for (const product of category.products) {
      productMap.set(product.id, product);
    }
  }

  let cartTotal = 0;

  for (const item of cart.items) {
    const product = productMap.get(item.productId);
    if (!product) continue;

    const quantity =
      typeof item.quantity === "number" && item.quantity > 0
        ? item.quantity
        : 0;

    const price =
      typeof product.comparedAtPrice === "number"
        ? product.comparedAtPrice
        : typeof product.price === "number"
        ? product.price
        : 0;

    cartTotal += price * quantity;
  }

  return cartTotal >= step.amount;
}
