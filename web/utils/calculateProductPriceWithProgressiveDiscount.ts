import TCart, { TCartItem } from "@/types/cart";
import TCategory from "../src/types/category";
import TProgressiveDiscount, {
  TProgressiveDiscountStep,
} from "../src/types/progressiveDiscount";
import TProduct from "../src/types/product";

type TResult = {
  fullPrice: number;
  actualPrice: number;
  discountedPrice: number;
  discountAmount: number;
  appliedStep: TProgressiveDiscountStep | null;
};

export function calculateProductPriceWithProgressiveDiscount(
  productId: string,
  progressiveDiscount: TProgressiveDiscount | null,
  cart: TCart,
  categories: TCategory[],
  options?: {
    cartItem?: TCartItem;
  },
): TResult | null {
  const getModifierUnitPrice = (product: TProduct, cartItem?: TCartItem) => {
    if (!cartItem?.modifiers?.length || !product.modifierGroups?.length) {
      return 0;
    }

    const modifierPriceMap = new Map<string, number>();

    for (const modifierGroup of product.modifierGroups) {
      for (const modifierItem of modifierGroup.items) {
        modifierPriceMap.set(modifierItem.id, modifierItem.price);
      }
    }

    return cartItem.modifiers.reduce(
      (sum, modifier) => sum + (modifierPriceMap.get(modifier.modifierItemId) ?? 0),
      0,
    );
  };

  const productMap = new Map<string, TProduct>();

  for (const category of categories) {
    for (const product of category.products) {
      productMap.set(product.id, product);
    }
  }

  const product = productMap.get(productId);

  if (!product) return null;

  let cartFullPrice = 0;

  for (const item of cart.items) {
    const cartProduct = productMap.get(item.productId);
    if (!cartProduct) continue;

    const quantity =
      typeof item.quantity === "number" && item.quantity > 0
        ? item.quantity
        : 0;

    const price = typeof cartProduct.price === "number" ? cartProduct.price : 0;
    const modifierUnitPrice = getModifierUnitPrice(cartProduct, item);

    const compared =
      typeof cartProduct.comparedAtPrice === "number"
        ? cartProduct.comparedAtPrice
        : price;

    cartFullPrice += (compared + modifierUnitPrice) * quantity;
  }

  const productBasePrice = typeof product.price === "number" ? product.price : 0;
  const productModifierUnitPrice = getModifierUnitPrice(product, options?.cartItem);
  const productActualPrice = productBasePrice + productModifierUnitPrice;

  const productBaseFullPrice =
    typeof product.comparedAtPrice === "number"
      ? product.comparedAtPrice
      : productBasePrice;

  const productFullPrice = productBaseFullPrice + productModifierUnitPrice;

  const thresholdCartFullPrice =
    options?.cartItem === undefined ? cartFullPrice + productFullPrice : cartFullPrice;

  const nextCartFullPrice = Number(thresholdCartFullPrice.toFixed(2));

  let appliedStep: TProgressiveDiscountStep | null = null;

  if (progressiveDiscount?.steps?.length) {
    appliedStep =
      progressiveDiscount.steps
        .filter(
          (step) =>
            step.type === "PERCENTAGEDISCOUNT" &&
            typeof step.amount === "number" &&
            nextCartFullPrice >= step.amount,
        )
        .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0] ?? null;
  }

  let discountedPrice = productActualPrice;

  if (
    appliedStep?.type === "PERCENTAGEDISCOUNT" &&
    typeof appliedStep.discount === "number"
  ) {
    discountedPrice = productActualPrice * (1 - appliedStep.discount / 100);
  }

  discountedPrice = Number(discountedPrice.toFixed(2));

  return {
    fullPrice: Number(productFullPrice.toFixed(2)),
    actualPrice: Number(productActualPrice.toFixed(2)),
    discountedPrice,
    discountAmount: Number((productFullPrice - discountedPrice).toFixed(2)),
    appliedStep,
  };
}
