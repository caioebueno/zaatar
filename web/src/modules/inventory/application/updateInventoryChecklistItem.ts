import { InventoryError } from "../domain/inventory.errors";
import type { InventoryRepository } from "../domain/inventory.repository";
import type { UpdateInventoryChecklistItemInput } from "../domain/inventory.types";

export async function updateInventoryChecklistItemUseCase(
  repository: InventoryRepository,
  input: UpdateInventoryChecklistItemInput,
) {
  if (!input.checklistId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "checklistId" });
  }

  if (!input.itemId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "itemId" });
  }

  if (!Number.isInteger(input.countedQuantity) || input.countedQuantity < 0) {
    throw new InventoryError("INVALID_PARAMS", { field: "countedQuantity" });
  }

  return repository.updateChecklistItem({
    ...input,
    checklistId: input.checklistId.trim(),
    itemId: input.itemId.trim(),
    notes: input.notes ? input.notes.trim() : null,
  });
}
