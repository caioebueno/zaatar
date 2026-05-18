import type { TOrder } from "@/src/types/order";
import type {
  PreparationStep,
  PreparationStepCategory,
  PreparationStepModifierTrack,
} from "./station.types";

export function buildPreparationStepCategories(
  order: TOrder,
  preparationSteps: PreparationStep[],
): PreparationStepCategory[] {
  const orderCreatedAt = new Date(order.createdAt);
  const baseCreatedAt = Number.isNaN(orderCreatedAt.getTime())
    ? new Date()
    : orderCreatedAt;
  const stationGoalMinutesMap = new Map<string, number>();

  for (const step of preparationSteps) {
    const goalMinutes =
      typeof step.goalMinutes === "number" && step.goalMinutes > 0
        ? Math.floor(step.goalMinutes)
        : 0;
    const currentGoal = stationGoalMinutesMap.get(step.stationId) ?? 0;
    if (goalMinutes > currentGoal) {
      stationGoalMinutesMap.set(step.stationId, goalMinutes);
    } else if (!stationGoalMinutesMap.has(step.stationId)) {
      stationGoalMinutesMap.set(step.stationId, currentGoal);
    }
  }
  const categoriesMap = new Map<string, PreparationStepCategory>();

  for (const orderProduct of order.orderProducts) {
    const productSteps = preparationSteps.filter((step) =>
      step.productIds.includes(orderProduct.productId),
    );

    for (const step of productSteps) {
      let category = categoriesMap.get(step.stationId);

      if (!category) {
        category = {
          id: crypto.randomUUID(),
          stationId: step.stationId,
          completed: false,
          orderId: order.id,
          steps: [],
          snoozes: [],
        };

        categoriesMap.set(step.stationId, category);
      }

      const comments =
        step.includeComments && orderProduct.comments?.trim()
          ? orderProduct.comments.trim()
          : undefined;

      const selectedModifierIds =
        orderProduct.selectedModifierGroupItemIds ?? [];
      const resolvedModifiers =
        step.includeModifiers && selectedModifierIds.length > 0
          ? selectedModifierIds.map(
              (item): PreparationStepModifierTrack => ({
                id: crypto.randomUUID(),
                completed: false,
                modifierGroupItem: item,
              }),
            )
          : undefined;

      const hasComments = !!comments;
      const hasModifiers = !!resolvedModifiers?.length;
      const canGroup = !hasComments && !hasModifiers;

      const existingTrack = canGroup
        ? category.steps.find(
            (track) =>
              track.preparationStepId === step.id &&
              !track.comments &&
              (!track.preparationStepModifiers ||
                track.preparationStepModifiers.length === 0),
          )
        : undefined;

      if (existingTrack) {
        existingTrack.quantity += orderProduct.quantity;
        continue;
      }

      category.steps.push({
        id: crypto.randomUUID(),
        name: step.name,
        quantity: orderProduct.quantity,
        completed: false,
        goalMinutes: stationGoalMinutesMap.get(step.stationId) ?? 0,
        expectedAt:
          (stationGoalMinutesMap.get(step.stationId) ?? 0) > 0
            ? new Date(
                baseCreatedAt.getTime() +
                  (stationGoalMinutesMap.get(step.stationId) ?? 0) * 60_000,
              ).toISOString()
            : undefined,
        comments,
        completedComments: false,
        preparationStepModifiers: resolvedModifiers,
        preparationStepId: step.id,
        preparationStepCategoryId: category.id,
      });
    }
  }

  return Array.from(categoriesMap.values())
    .filter((category) => category.steps.length > 0)
    .map((category) => ({
      ...category,
      completed: category.steps.every((step) => step.completed),
    }));
}
