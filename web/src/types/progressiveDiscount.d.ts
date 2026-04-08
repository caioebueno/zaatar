import TProduct from "./product";

type TProgressiveDiscountStepType = "PERCENTAGEDISCOUNT" | "GIFT";

type TProgressiveDiscountStep = {
  id: string;
  amount?: number;
  discount?: number;
  type: TProgressiveDiscountStepType;
  prizes?: TProgressiveDiscountPrize[];
};

type TProgressiveDiscountPrizeProduct = Pick<
  TProduct,
  "id" | "name" | "translations" | "price" | "comparedAtPrice" | "photos"
>;

type TProgressiveDiscountPrize = {
  id: string;
  createdAt: string;
  name: string;
  quantity: number;
  imageUrl?: string | null;
  progressiveDiscountStepId: string;
  products: TProgressiveDiscountPrizeProduct[];
};

type TProgressiveDiscount = {
  id: string;
  steps: TProgressiveDiscountStep[];
};

export default TProgressiveDiscount;
export {
  TProgressiveDiscountStep,
  TProgressiveDiscountPrize,
  TProgressiveDiscountPrizeProduct,
};
