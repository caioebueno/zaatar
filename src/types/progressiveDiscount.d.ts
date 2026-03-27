type TProgressiveDiscountStepType = "PERCENTAGEDISCOUNT" | "GIFT";

type TProgressiveDiscountStep = {
  id: string;
  amount?: number;
  discount?: number;
  type: TProgressiveDiscountStepType;
};

type TProgressiveDiscount = {
  id: string;
  steps: TProgressiveDiscountStep[];
};

export default TProgressiveDiscount;
export { TProgressiveDiscountStep };
