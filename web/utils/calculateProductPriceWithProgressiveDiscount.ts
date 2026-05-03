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
  additionalProducts?: TProduct[],
  excludedFromProgressiveDiscountProductIds?: string[],
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

  const getComboSelectionUnitPrice = (product: TProduct, cartItem?: TCartItem) => {
    if (!cartItem?.comboSelections?.length || !product.comboSlots?.length) {
      return 0;
    }

    const slotOptionExtraPriceByKey = new Map<string, number>();

    for (const slot of product.comboSlots) {
      for (const option of slot.options) {
        slotOptionExtraPriceByKey.set(
          `${slot.id}:${option.productId}`,
          option.extraPrice,
        );
      }
    }

    return cartItem.comboSelections.reduce((sum, selection) => {
      const key = `${selection.slotId}:${selection.optionProductId}`;
      const optionExtraPrice = slotOptionExtraPriceByKey.get(key);
      const resolvedExtraPrice =
        typeof optionExtraPrice === "number"
          ? optionExtraPrice
          : typeof selection.extraPrice === "number"
            ? selection.extraPrice
            : 0;
      const quantity =
        typeof selection.quantity === "number" &&
        Number.isInteger(selection.quantity) &&
        selection.quantity > 0
          ? selection.quantity
          : 1;

      return sum + resolvedExtraPrice * quantity;
    }, 0);
  };

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

  const product = productMap.get(productId);

  if (!product) return null;

  let cartProgressiveDiscountBaseFullPrice = 0;

  for (const item of cart.items) {
    const cartProduct = productMap.get(item.productId);
    if (!cartProduct) continue;

    const quantity =
      typeof item.quantity === "number" && item.quantity > 0
        ? item.quantity
        : 0;

    const price = typeof cartProduct.price === "number" ? cartProduct.price : 0;
    const modifierUnitPrice = getModifierUnitPrice(cartProduct, item);
    const comboSelectionUnitPrice = getComboSelectionUnitPrice(cartProduct, item);

    const compared =
      typeof cartProduct.comparedAtPrice === "number"
        ? cartProduct.comparedAtPrice
        : price;
    const itemFullPrice =
      (compared + modifierUnitPrice + comboSelectionUnitPrice) * quantity;

    if (!excludedProductIdSet.has(item.productId)) {
      cartProgressiveDiscountBaseFullPrice += itemFullPrice;
    }
  }

  const productBasePrice = typeof product.price === "number" ? product.price : 0;
  const productModifierUnitPrice = getModifierUnitPrice(product, options?.cartItem);
  const productComboSelectionUnitPrice = getComboSelectionUnitPrice(
    product,
    options?.cartItem,
  );
  const productActualPrice =
    productBasePrice + productModifierUnitPrice + productComboSelectionUnitPrice;

  const productBaseFullPrice =
    typeof product.comparedAtPrice === "number"
      ? product.comparedAtPrice
      : productBasePrice;

  const productFullPrice =
    productBaseFullPrice + productModifierUnitPrice + productComboSelectionUnitPrice;
  const productExcludedFromProgressiveDiscount = excludedProductIdSet.has(productId);

  const thresholdCartFullPrice =
    options?.cartItem === undefined
      ? cartProgressiveDiscountBaseFullPrice +
        (productExcludedFromProgressiveDiscount ? 0 : productFullPrice)
      : cartProgressiveDiscountBaseFullPrice;

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
    !productExcludedFromProgressiveDiscount &&
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
