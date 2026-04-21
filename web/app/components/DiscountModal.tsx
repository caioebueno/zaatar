"use client";

// import { useState } from "react";
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  // DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // your button or shadcn button
import ProgressiveDiscountBar from "./ProgressiveDiscountBar";
import TProgressiveDiscount from "../../src/types/progressiveDiscount";
import formatCurrency from "@/utils/formatCurrecy";

type TDiscountModal = {
  progressiveDiscount: TProgressiveDiscount;
  open: boolean;
  onOpenChange: (value: boolean) => void;
  content: {
    [key: string]: string;
  };
};

const DiscountModal: React.FC<TDiscountModal> = ({
  progressiveDiscount,
  onOpenChange,
  open,
  content,
}) => {
  const giftThresholdInCents = useMemo(() => {
    const amounts = progressiveDiscount.steps
      .filter(
        (step) =>
          step.type === "GIFT" &&
          typeof step.amount === "number" &&
          (step.prizes?.length || 0) > 0,
      )
      .map((step) => step.amount as number);

    if (amounts.length === 0) return null;
    return Math.min(...amounts);
  }, [progressiveDiscount.steps]);

  const formattedGiftThreshold = formatCurrency(giftThresholdInCents ?? 6000);
  const addMoreTemplate =
    content["addMore"] ||
    "Add more pizzas, sfihas, or drinks to unlock better savings. Spend {prizeAmount} or more and get a special prize on us.";
  const addMoreMessage = addMoreTemplate.includes("{prizeAmount}")
    ? addMoreTemplate.replaceAll("{prizeAmount}", formattedGiftThreshold)
    : addMoreTemplate;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      //onOpenChange={setOpen}
    >
      <DialogContent className="sm:max-w-md lg:rounded-xl">
        <DialogHeader className="gap-4">
          <DialogTitle className="font-bold">
            {content["progressiveDiscount"]}
          </DialogTitle>
          <DialogDescription className="gap-2 flex flex-col">
            <span className="text-[22px] font-bold">
              {content["progressiveDiscount"]}
            </span>
            <span className="font-medium">{addMoreMessage}</span>
          </DialogDescription>
        </DialogHeader>
        <ProgressiveDiscountBar
          progressiveDiscount={progressiveDiscount}
          animateFill={open}
          demoFill
        />
        <DialogFooter>
          <Button
            className="font-bold bg-brandBackground py-3 h-full text-background"
            onClick={() => onOpenChange(false)}
          >
            {content["orderNow"]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DiscountModal;
