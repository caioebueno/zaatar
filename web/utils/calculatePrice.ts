import TCart from "@/types/cart";
import TCategory from "../../src/types/category";
import TProgressiveDiscount, {
  TProgressiveDiscountStep,
} from "../../src/types/progressiveDiscount";
import TProduct from "../../src/types/product";

type TResult = {
  fullPrice: number;
  discountedPrice: number;
  discountAmount: number;
  appliedStep: TProgressiveDiscountStep | null;
};

export function calculateCartWithProgressiveDiscount(
  categories: TCategory[],
  cart: TCart,
  progressiveDiscount: TProgressiveDiscount | null
): TResult {
  const productMap = new Map<string, TProduct>();

  for (const category of categories) {
    for (const product of category.products) {
      productMap.set(product.id, product);
    }
  }

  let fullPrice = 0;
  let actualPrice = 0;

  for (const item of cart.items) {
    const product = productMap.get(item.productId);
    if (!product) continue;

    const quantity = typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 0;

    const price = typeof product.price === "number" ? product.price : 0;

    const compared =
      typeof product.comparedAtPrice === "number"
        ? product.comparedAtPrice
        : price;

    fullPrice += compared * quantity;
    actualPrice += price * quantity;
  }

  fullPrice = Number(fullPrice.toFixed(2));
  actualPrice = Number(actualPrice.toFixed(2));

  let appliedStep: TProgressiveDiscountStep | null = null;

  if (progressiveDiscount?.steps?.length) {
    appliedStep =
      progressiveDiscount.steps
        .filter(
          (step) =>
            step.type === "PERCENTAGEDISCOUNT" &&
            typeof step.amount === "number" &&
            fullPrice >= step.amount
        )
        .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0] ?? null;
  }

  let discountedPrice = actualPrice;

  if (
    appliedStep?.type === "PERCENTAGEDISCOUNT" &&
    typeof appliedStep.discount === "number"
  ) {
    discountedPrice = actualPrice * (1 - appliedStep.discount / 100);
  }

  discountedPrice = Number(discountedPrice.toFixed(2));

  const discountAmount = Number((fullPrice - discountedPrice).toFixed(2));

  return {
    fullPrice,
    discountedPrice,
    discountAmount,
    appliedStep,
  };
}
