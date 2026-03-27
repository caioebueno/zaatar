import { TProgressiveDiscountStep } from "../src/types/progressiveDiscount";

export function getProgressiveDiscountStepProgress(
  currentStep: TProgressiveDiscountStep,
  allSteps: TProgressiveDiscountStep[],
  price: number,
): number {
  if (typeof currentStep.amount !== "number" || currentStep.amount <= 0) {
    return 0;
  }

  const sortedSteps = [...allSteps]
    .filter((step) => typeof step.amount === "number")
    .sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0));

  const stepIndex = sortedSteps.findIndex((s) => s.id === currentStep.id);
  if (stepIndex === -1) return 0;

  const previousStep = stepIndex > 0 ? sortedSteps[stepIndex - 1] : null;
  const previousAmount = previousStep?.amount ?? 0;
  const currentAmount = currentStep.amount;

  // Not in progress (already achieved or not reached previous step yet)
  if (price >= currentAmount || price < previousAmount) {
    return 0;
  }

  const range = currentAmount - previousAmount;
  if (range <= 0) return 0;

  const rawProgress = (price - previousAmount) / range; // 0 → 1

  // Convert to 3 steps
  if (rawProgress <= 1 / 3) return 33;
  if (rawProgress <= 2 / 3) return 66;
  return 100;
}
