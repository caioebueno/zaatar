import { isProgressiveDiscountStepMet } from "@/utils/isProgressiveDiscountStepMet";
import TProgressiveDiscount, {
  TProgressiveDiscountStep,
} from "../../src/types/progressiveDiscount";
import { FiStar } from "react-icons/fi";
import TCart from "@/types/cart";
import TCategory from "../../src/types/category";
import { getProgressiveDiscountStepProgress } from "@/utils/getProgressiveDiscountStepProgress";
import type { CSSProperties } from "react";

type TProgressiveDiscountBar = {
  progressiveDiscount: TProgressiveDiscount;
  cart?: TCart;
  categories?: TCategory[];
  countPrice?: number;
  animateFill?: boolean;
  demoFill?: boolean;
};

const ProgressiveDiscountBar: React.FC<TProgressiveDiscountBar> = ({
  progressiveDiscount,
  cart,
  categories,
  countPrice,
  animateFill = false,
  demoFill = false,
}) => {
  return (
    <div className="flex flex-row items-center gap-[-5px]">
      <style jsx global>{`
        @keyframes progressive-discount-fill {
          0% {
            width: 0;
          }
          100% {
            width: var(--pd-target-width);
          }
        }

        .progressive-discount-fill {
          width: var(--pd-target-width);
          animation: progressive-discount-fill 900ms ease-out both;
        }

        @keyframes progressive-discount-badge-fill {
          0% {
            background: #ffffff;
            color: #1f2937;
          }
          100% {
            background: #304240;
            color: #ffffff;
          }
        }

        .progressive-discount-badge-fill {
          animation: progressive-discount-badge-fill 450ms ease-out both;
        }

        @keyframes progressive-discount-prize-pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.12);
          }
          100% {
            transform: scale(1);
          }
        }

        .progressive-discount-prize-pulse {
          animation: progressive-discount-prize-pulse 1s ease-in-out infinite;
        }

        .progressive-discount-prize-badge-animated {
          animation:
            progressive-discount-badge-fill 450ms ease-out
              var(--pd-badge-delay, 0ms) both,
            progressive-discount-prize-pulse 1s ease-in-out
              calc(var(--pd-badge-delay, 0ms) + 450ms) infinite;
        }
      `}</style>
      <div className="bg-brandBackground h-6 w-6 rounded-full z-20"></div>
      {progressiveDiscount.steps.map((step, stepIndex) => (
        <ProgressiveDiscountBarStep
          progressiveDiscountStep={step}
          key={step.id}
          cart={cart}
          categories={categories}
          countPrice={countPrice}
          progressiveDiscountSteps={progressiveDiscount.steps}
          animateFill={animateFill}
          demoFill={demoFill}
          stepIndex={stepIndex}
        />
      ))}
    </div>
  );
};

type TProgressiveDiscountBarStep = {
  progressiveDiscountStep: TProgressiveDiscountStep;
  progressiveDiscountSteps?: TProgressiveDiscountStep[];
  cart?: TCart;
  categories?: TCategory[];
  countPrice?: number;
  animateFill?: boolean;
  demoFill?: boolean;
  stepIndex?: number;
};

const ProgressiveDiscountBarStep: React.FC<TProgressiveDiscountBarStep> = ({
  progressiveDiscountStep,
  cart,
  categories,
  countPrice,
  progressiveDiscountSteps,
  animateFill = false,
  demoFill = false,
  stepIndex = 0,
}) => {
  const active =
    cart && categories
      ? isProgressiveDiscountStepMet(progressiveDiscountStep, cart, categories)
      : false;

  const progress =
    countPrice && progressiveDiscountSteps
      ? getProgressiveDiscountStepProgress(
          progressiveDiscountStep,
          progressiveDiscountSteps,
          countPrice,
        )
      : 0;
  const targetWidth = demoFill ? 100 : active ? 100 : progress > 0 ? progress : 0;
  const demoBadgeDelayMs = stepIndex * 260 + 380;
  const fillStyle = {
    "--pd-target-width": `${targetWidth}%`,
    width: animateFill ? undefined : `${targetWidth}%`,
    height: "10px",
    background: "#304240",
    animationDelay: demoFill ? `${stepIndex * 260}ms` : undefined,
  } as CSSProperties & { ["--pd-target-width"]: string };
  const badgeFillStyle = demoFill
    ? ({
        animationDelay: `${demoBadgeDelayMs}ms`,
      } as CSSProperties)
    : undefined;
  const prizeBadgeStyle = demoFill
    ? ({
        "--pd-badge-delay": `${demoBadgeDelayMs}ms`,
      } as CSSProperties & { ["--pd-badge-delay"]: string })
    : undefined;
  const fillClassName = animateFill || demoFill
    ? "progressive-discount-fill"
    : "transition-all duration-1000";

  if (progressiveDiscountStep.type === "GIFT")
    return (
      <>
        <div className={`h-2.5 -m-0.5 flex-1 bg-background `}>
          <div style={fillStyle} className={fillClassName}></div>
        </div>
        <div
          style={prizeBadgeStyle}
          className={`p-2.5 text-sm font-bold rounded-full transition-all duration-1000 ${
            demoFill
              ? "bg-background text-text progressive-discount-prize-badge-animated"
              : active
                ? "bg-brandBackground text-white"
                : "bg-background"
          }`}
        >
          <FiStar fill="#F7CA37" color="#F7CA37" size={20}></FiStar>
        </div>
      </>
    );
  return (
    <>
      <div className={`h-2.5 -m-0.5 flex-1 bg-background `}>
        <div style={fillStyle} className={fillClassName}></div>
      </div>
      <div
        style={badgeFillStyle}
        className={`p-2.5 text-sm z-10 font-bold rounded-full transition-all duration-1000 ${
          demoFill
            ? "bg-background text-text progressive-discount-badge-fill"
            : active
              ? "bg-brandBackground text-white"
              : "bg-background"
        }`}
      >
        <span className="text-nowrap">
          %{progressiveDiscountStep.discount} off
        </span>
      </div>
    </>
  );
};

export default ProgressiveDiscountBar;
