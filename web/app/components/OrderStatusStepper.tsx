"use client";

import { TOrderStatus, TOrderType } from "@/src/types/order";
import { useRouter } from "next/navigation";
import {
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";
import Button from "./Button";

type TOrderStatusStepper = {
  content: {
    [key: string]: string;
  };
  status: TOrderStatus;
  type: TOrderType;
};

const deliverySteps = [
  {
    status: "ACCEPTED" as TOrderStatus,
    icon: FiCheckCircle,
    label: "accepted",
  },
  {
    status: "PREPARING" as TOrderStatus,
    icon: FiClock,
    label: "preparing",
  },
  {
    status: "DELIVERING" as TOrderStatus,
    icon: FiTruck,
    label: "outForDelivery",
  },
  {
    status: "DELIVERED" as TOrderStatus,
    icon: FiPackage,
    label: "delivered",
  },
];

const takeawaySteps = [
  {
    status: "ACCEPTED" as TOrderStatus,
    icon: FiCheckCircle,
    label: "accepted",
  },
  {
    status: "PREPARING" as TOrderStatus,
    icon: FiClock,
    label: "preparing",
  },
  {
    status: "DELIVERED" as TOrderStatus,
    icon: FiShoppingBag,
    label: "ready",
  },
];

const getTakeawayStepIndex = (status: TOrderStatus): number => {
  if (status === "ACCEPTED") return 0;
  if (status === "PREPARING") return 1;
  return 2;
};

const OrderStatusStepper: React.FC<TOrderStatusStepper> = ({
  content,
  status,
  type,
}) => {
  const router = useRouter();
  const steps = type === "TAKEAWAY" ? takeawaySteps : deliverySteps;
  const activeStepIndex =
    type === "TAKEAWAY"
      ? getTakeawayStepIndex(status)
      : deliverySteps.findIndex((step) => step.status === status);
  const orderTypeLabel =
    type === "TAKEAWAY" ? content["takeAway"] : content["delivery"];
    const orderTypeIcon =  type === "TAKEAWAY" ? <FiShoppingBag color="" /> : <FiTruck />

  return (
    <div className="w-full max-w-[900px] px-4 pt-8 pb-6 flex flex-col gap-4">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-2 sm:gap-3 px-8">
          {steps.map((step, index) => {
            const isCompleted = index <= activeStepIndex;
            const isActive = index === activeStepIndex;
            const isLast = index === steps.length - 1;
            const Icon = step.icon;

            return (
              <>
                <div className="flex flex-col items-center">
                  <div
                    aria-label={content[step.label]}
                    title={content[step.label]}
                    className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition-transform ${
                      isCompleted
                        ? "border-brandBackground bg-brandBackground text-white"
                        : "border-[#CCD0D0] bg-white text-lightText"
                    }`}
                  >
                    <Icon size={18} className={isActive ? "scale-110" : ""} />
                  </div>
                  <span className="sr-only">{content[step.label]}</span>
                </div>
                {!isLast && (
                  <div
                    className={`mx-2 h-0.5 flex-1 rounded-full ${
                      index < activeStepIndex
                        ? "bg-brandBackground"
                        : "bg-[#CCD0D0]"
                    }`}
                  />
                )}
              </>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-3 pb-2">
          {/* <span className="text-base font-semibold text-lightText">
            <div className="flex flex-row gap-2 items-center">
              <div className="text-lightText text-xl">{orderTypeIcon}</div>
               {orderTypeLabel}
            </div>
           
          </span> */}
          <Button
            onClick={() => router.refresh()}
            className="bg-brandBackground py-3! px-3 text-base gap-2 flex-1"
          >
            <FiRefreshCw size={16} />
            {content["refreshStatus"]}
          </Button>
        </div>
        
      </div>
    </div>
  );
};

export default OrderStatusStepper;
