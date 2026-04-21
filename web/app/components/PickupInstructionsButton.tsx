"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import Button from "@/app/components/Button";
import Image from "next/image";
import { useMemo, useState } from "react";

type TPickupInstructionsButton = {
  content: {
    [key: string]: string;
  };
};

const PickupInstructionsButton: React.FC<TPickupInstructionsButton> = ({
  content,
}) => {
  const [open, setOpen] = useState(false);

  const steps = useMemo(
    () => [
      {
        key: "step-1",
        imageSrc: "/pizza.png",
        title:
          content["verifyPickupStep1Title"] || "Check your order number",
        description:
          content["verifyPickupStep1Description"] ||
          "Use the order number shown on this confirmation screen.",
      },
      {
        key: "step-2",
        imageSrc: "/logo.png",
        title: content["verifyPickupStep2Title"] || "Go to pickup counter",
        description:
          content["verifyPickupStep2Description"] ||
          "Head to Zaatar Grill & Pizza and go to the pickup area.",
      },
      {
        key: "step-3",
        imageSrc: "/pizza.png",
        title: content["verifyPickupStep3Title"] || "Confirm and collect",
        description:
          content["verifyPickupStep3Description"] ||
          "Show your order number to our team and pick up your order.",
      },
    ],
    [content],
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-yellow-400 px-4 py-3 mb-6 rounded-xl flex flex-row items-center gap-2 w-full justify-center cursor-pointer"
        type="button"
      >
        <span className="font-bold text-lg">
          {content["verifyPickup"] || "Verify pickup instructions"}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-0 left-0 translate-x-0 translate-y-0 w-dvw h-dvh max-w-none p-0 overflow-hidden rounded-none grid-rows-[auto,1fr,auto] gap-0">
          <div className="px-5 py-4 border-b border-[#E6E6E6]">
            <DialogTitle className="text-xl font-bold text-text">
              {content["verifyPickupModalTitle"] || "How to pick up your order"}
            </DialogTitle>
          </div>

          <div className="p-4 flex flex-col gap-3 min-h-0 overflow-y-auto items-center">
            {steps.map((step, index) => {
              return (
                <div
                  key={step.key}
                  className="border border-[#E6E6E6] rounded-xl p-3 flex flex-col gap-3 bg-background max-w-[700px] w-full"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-brandBackground text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-text">{step.title}</span>
                  </div>

                  <div className="relative w-full h-40 rounded-lg overflow-hidden bg-[#F5F5F5]">
                    <Image
                      src={step.imageSrc}
                      alt={step.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <p className="text-sm text-lightText font-medium">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-4 border-t border-[#E6E6E6] bg-foreground flex flex-row justify-center">
            <Button
              onClick={() => setOpen(false)}
              className="w-full bg-brandBackground text-white max-w-[700px]"
            >
              {content["verifyPickupDone"] || "Got it"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PickupInstructionsButton;
