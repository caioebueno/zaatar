import TCart from "@/types/cart";
import TCategory from "../../src/types/category";
import TProgressiveDiscount, {
  TProgressiveDiscountStep,
} from "../../src/types/progressiveDiscount";
import TProduct from "../../src/types/product";

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
  categories: TCategory[]
): TResult | null {
  const productMap = new Map<string, TProduct>();

  for (const category of categories) {
    for (const product of category.products) {
      productMap.set(product.id, product);
    }
  }

  const product = productMap.get(productId);

  if (!product) return null;

  let cartFullPrice = 0;
  let cartActualPrice = 0;

  for (const item of cart.items) {
    const cartProduct = productMap.get(item.productId);
    if (!cartProduct) continue;

    const quantity =
      typeof item.quantity === "number" && item.quantity > 0
        ? item.quantity
        : 0;

    const price =
      typeof cartProduct.price === "number" ? cartProduct.price : 0;

    const compared =
      typeof cartProduct.comparedAtPrice === "number"
        ? cartProduct.comparedAtPrice
        : price;

    cartFullPrice += compared * quantity;
    cartActualPrice += price * quantity;
  }

  const productActualPrice =
    typeof product.price === "number" ? product.price : 0;

  const productFullPrice =
    typeof product.comparedAtPrice === "number"
      ? product.comparedAtPrice
      : productActualPrice;

  const nextCartFullPrice = Number(
    (cartFullPrice + productFullPrice).toFixed(2)
  );

  let appliedStep: TProgressiveDiscountStep | null = null;

  if (progressiveDiscount?.steps?.length) {
    appliedStep =
      progressiveDiscount.steps
        .filter(
          (step) =>
            step.type === "PERCENTAGEDISCOUNT" &&
            typeof step.amount === "number" &&
            nextCartFullPrice >= step.amount
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
