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
import TProgressiveDiscount from "../../src/types/progressiveDiscount";

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
  // const [open, setOpen] = useState(false);

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
            <span className="font-medium">{content["addMore"]}</span>
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
