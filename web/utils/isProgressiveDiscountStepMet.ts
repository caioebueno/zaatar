import TCart from "@/types/cart";
import { TProgressiveDiscountStep } from "../src/types/progressiveDiscount";
import TCategory from "../src/types/category";
import TProduct from "../src/types/product";

export function isProgressiveDiscountStepMet(
  step: TProgressiveDiscountStep,
  cart: TCart,
  categories: TCategory[],
  additionalProducts?: TProduct[],
  excludedFromProgressiveDiscountProductIds?: string[],
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

  for (const product of additionalProducts ?? []) {
    if (!productMap.has(product.id)) {
      productMap.set(product.id, product);
    }
  }

  const excludedProductIdSet = new Set(
    excludedFromProgressiveDiscountProductIds ?? [],
  );

  let cartTotal = 0;

  for (const item of cart.items) {
    if (excludedProductIdSet.has(item.productId)) {
      continue;
    }

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
