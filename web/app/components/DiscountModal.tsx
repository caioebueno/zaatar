"use client";

// import { useState } from "react";
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
import TProgressiveDiscount from "../../../src/types/progressiveDiscount";

type TDiscountModal = {
  progressiveDiscount: TProgressiveDiscount
  open: boolean
  onOpenChange: (value: boolean) => void
}

const DiscountModal: React.FC<TDiscountModal> = ({
  progressiveDiscount,
  onOpenChange,
  open
}) => {
  // const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}
      //onOpenChange={setOpen}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-4">
          <DialogTitle className="font-bold">Progressive Discount</DialogTitle>
          <DialogDescription className="gap-2 flex flex-col">
            <span className="text-[22px] font-bold">
              Buy More, Save More
            </span>
            <span className="font-medium">Add more pizzas, sfihas, or drinks to unlock better savings. Spend $60 or more and get a special prize on us.</span>
          </DialogDescription>
        </DialogHeader>
        <ProgressiveDiscountBar progressiveDiscount={progressiveDiscount} />
        <DialogFooter>
          <Button className="font-bold bg-brandBackground py-3 h-full text-background" onClick={() => onOpenChange(false)}>
            Order Now!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DiscountModal
