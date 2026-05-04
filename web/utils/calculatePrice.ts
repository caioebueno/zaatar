import TCart, { TCartItem } from "@/types/cart";
import TCategory from "../src/types/category";
import TProgressiveDiscount, {
  TProgressiveDiscountStep,
} from "../src/types/progressiveDiscount";
import TProduct from "../src/types/product";

type TResult = {
  fullPrice: number;
  progressiveDiscountBaseFullPrice: number;
  discountedPrice: number;
  discountAmount: number;
  appliedStep: TProgressiveDiscountStep | null;
};

export function calculateCartWithProgressiveDiscount(
  categories: TCategory[],
  cart: TCart,
  progressiveDiscount: TProgressiveDiscount | null,
  additionalProducts?: TProduct[],
  excludedFromProgressiveDiscountProductIds?: string[],
): TResult {
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

  let fullPrice = 0;
  let progressiveDiscountBaseFullPrice = 0;
  let actualPrice = 0;
  let discountableActualPrice = 0;

  for (const item of cart.items) {
    const product = productMap.get(item.productId);
    if (!product) continue;

    const quantity =
      typeof item.quantity === "number" && item.quantity > 0
        ? item.quantity
        : 0;

    const price = typeof product.price === "number" ? product.price : 0;
    const modifierUnitPrice = getModifierUnitPrice(product, item);
    const comboSelectionUnitPrice = getComboSelectionUnitPrice(product, item);

    const compared =
      typeof product.comparedAtPrice === "number"
        ? product.comparedAtPrice
        : price;
    const itemFullPrice =
      (compared + modifierUnitPrice + comboSelectionUnitPrice) * quantity;

    fullPrice += itemFullPrice;
    const itemActualPrice =
      (price + modifierUnitPrice + comboSelectionUnitPrice) * quantity;
    actualPrice += itemActualPrice;
    if (!excludedProductIdSet.has(item.productId)) {
      progressiveDiscountBaseFullPrice += itemFullPrice;
      discountableActualPrice += itemActualPrice;
    }
  }

  fullPrice = Number(fullPrice.toFixed(2));
  progressiveDiscountBaseFullPrice = Number(
    progressiveDiscountBaseFullPrice.toFixed(2),
  );
  actualPrice = Number(actualPrice.toFixed(2));
  discountableActualPrice = Number(discountableActualPrice.toFixed(2));

  let appliedStep: TProgressiveDiscountStep | null = null;

  if (progressiveDiscount?.steps?.length) {
    appliedStep =
      progressiveDiscount.steps
        .filter(
          (step) =>
            step.type === "PERCENTAGEDISCOUNT" &&
            typeof step.amount === "number" &&
            progressiveDiscountBaseFullPrice >= step.amount,
        )
        .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0] ?? null;
  }

  let discountedPrice = actualPrice;

  if (
    appliedStep?.type === "PERCENTAGEDISCOUNT" &&
    typeof appliedStep.discount === "number"
  ) {
    const discountRate = 1 - appliedStep.discount / 100;
    const nonDiscountableActualPrice = actualPrice - discountableActualPrice;
    discountedPrice =
      nonDiscountableActualPrice + discountableActualPrice * discountRate;
  }

  discountedPrice = Number(discountedPrice.toFixed(2));

  const discountAmount = Number((fullPrice - discountedPrice).toFixed(2));

  return {
    fullPrice,
    progressiveDiscountBaseFullPrice,
    discountedPrice,
    discountAmount,
    appliedStep,
  };
}
