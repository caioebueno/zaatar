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
        imageSrc: "/pickup1.jpg",
        title:
          content["verifyPickupStep1Title"] || "Enter the GlobalPlatform parking lot",
        description:
          content["verifyPickupStep1Description"] ||
          "Drive into the GlobalPlatform parking lot to start your pickup.",
      },
      {
        key: "step-2",
        imageSrc: "/pickup2.jpg",
        title:
          content["verifyPickupStep2Title"] ||
          "Look for our sign on the right-hand side",
        description:
          content["verifyPickupStep2Description"] ||
          "You will see our sign with an arrow indicating the pickup route.",
      },
      {
        key: "step-3",
        imageSrc: "/pickup3.jpg",
        title: content["verifyPickupStep3Title"] || "Continue straight ahead",
        description:
          content["verifyPickupStep3Description"] ||
          "After passing the sign, keep driving straight until the pickup zone.",
      },
      {
        key: "step-4",
        imageSrc: "/pickup4.jpg",
        title: content["verifyPickupStep4Title"] || "Go to the pickup area",
        description:
          content["verifyPickupStep4Description"] ||
          "Park in the designated pickup area near our storefront.",
      },
      {
        key: "step-5",
        imageSrc: "/pickup5.jpg",
        title: content["verifyPickupStep5Title"] || "Ring the bell",
        description:
          content["verifyPickupStep5Description"] ||
          "Ring the bell and our team will assist you with your order.",
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
                  className="border border-[#E6E6E6] rounded-xl p-3 flex flex-col gap-3 bg-background max-w-[600px] w-full"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-brandBackground text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-text">{step.title}</span>
                  </div>

                  <div className="relative w-full h-40 md:h-60 rounded-lg overflow-hidden bg-[#F5F5F5]">
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
              className="w-full bg-brandBackground text-white max-w-[600px]"
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
