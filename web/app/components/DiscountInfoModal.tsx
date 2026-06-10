"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ProgressiveDiscountBar from "./ProgressiveDiscountBar";
import { useCart } from "./CartContext";
import { TGetProductsResponse } from "../../src/getProducts";

type TDiscountInfoModal = {
  data: TGetProductsResponse;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  content: { [key: string]: string };
  lg: string;
};

const DiscountInfoModal: React.FC<TDiscountInfoModal> = ({
  data,
  open,
  onOpenChange,
  content,
}) => {
  const { cart } = useCart();

  if (!data.progressiveDiscount) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-4">
          <DialogTitle className="font-bold">
            {content["progressiveDiscount"] ?? "Progressive Discount"}
          </DialogTitle>
          <DialogDescription className="gap-2 flex flex-col">
            <span className="text-[22px] font-bold">
              {content["upsellBuyMoreSaveMore"] ?? "Buy More, Save More"}
            </span>
            <span className="font-medium">
              {content["upsellInfoDescription"] ??
                "Add more items to unlock better savings and earn a special prize."}
            </span>
          </DialogDescription>
        </DialogHeader>
        <ProgressiveDiscountBar
          progressiveDiscount={data.progressiveDiscount}
          cart={cart}
          categories={data.categories}
          additionalProducts={data.activePromotion?.products}
          excludedFromProgressiveDiscountProductIds={data.promotionProductIds}
        />
        <DialogFooter>
          <Button
            className="font-bold bg-brandBackground py-3 h-full text-background"
            onClick={() => onOpenChange(false)}
          >
            {content["orderNow"] ?? "Order Now!"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountInfoModal;
