import { InventoryError } from "../domain/inventory.errors";
import type { InventoryRepository } from "../domain/inventory.repository";
import type { UpdateInventoryStockChecklistPromptInput } from "../domain/inventory.types";

export async function updateInventoryStockChecklistPromptUseCase(
  repository: InventoryRepository,
  input: UpdateInventoryStockChecklistPromptInput,
) {
  if (!input.placeId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "placeId" });
  }

  if (!input.productId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "productId" });
  }

  return repository.updateStockChecklistPrompt({
    ...input,
    placeId: input.placeId.trim(),
    productId: input.productId.trim(),
  });
}
