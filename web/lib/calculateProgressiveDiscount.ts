import TCart from "@/types/cart";
import TProgressiveDiscount, {
  TProgressiveDiscountStep,
} from "../src/types/progressiveDiscount";

type TCalculateProgressiveDiscountInput = {
  cart: TCart;
  progressiveDiscount: TProgressiveDiscount;
  unitPrice: number;
};

type TCalculateProgressiveDiscountResult = {
  fullPrice: number;
  discountedPrice: number;
  discountAmount: number;
  appliedStep: TProgressiveDiscountStep | null;
};

export function calculateProgressiveDiscount({
  cart,
  progressiveDiscount,
  unitPrice,
}: TCalculateProgressiveDiscountInput): TCalculateProgressiveDiscountResult {
  const quantity = cart.items.length;
  const fullPrice = quantity * unitPrice;

  if (!progressiveDiscount.steps.length || quantity === 0) {
    return {
      fullPrice,
      discountedPrice: fullPrice,
      discountAmount: 0,
      appliedStep: null,
    };
  }

  // Find the best eligible step based on highest amount requirement met
  const appliedStep =
    progressiveDiscount.steps
      .filter(
        (step) => typeof step.amount === "number" && quantity >= step.amount,
      )
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))[0] ?? null;

  if (!appliedStep) {
    return {
      fullPrice,
      discountedPrice: fullPrice,
      discountAmount: 0,
      appliedStep: null,
    };
  }

  let discountedPrice = fullPrice;

  if (
    appliedStep.type === "PERCENTAGEDISCOUNT" &&
    typeof appliedStep.discount === "number"
  ) {
    discountedPrice = fullPrice * (1 - appliedStep.discount / 100);
  }

  // GIFT does not change price here
  discountedPrice = Math.max(0, Number(discountedPrice.toFixed(2)));

  return {
    fullPrice: Number(fullPrice.toFixed(2)),
    discountedPrice,
    discountAmount: Number((fullPrice - discountedPrice).toFixed(2)),
    appliedStep,
  };
}
