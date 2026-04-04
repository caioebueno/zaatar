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
  const categoriesMap = new Map<string, PreparationStepCategory>();

  for (const orderProduct of order.orderProducts) {
    const categoryId = orderProduct.product?.categoryId;
    if (!categoryId) continue;

    let category = categoriesMap.get(categoryId);

    if (!category) {
      category = {
        id: crypto.randomUUID(),
        categoryId,
        completed: false,
        orderId: order.id,
        steps: [],
        snoozes: [],
      };

      categoriesMap.set(categoryId, category);
    }

    const productSteps = preparationSteps.filter((step) =>
      step.productIds.includes(orderProduct.productId),
    );

    for (const step of productSteps) {
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
