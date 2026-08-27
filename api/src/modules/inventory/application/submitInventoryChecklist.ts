import { InventoryError } from "../domain/inventory.errors.js";
import type { InventoryRepository } from "../domain/inventory.repository.js";
import type { SubmitInventoryChecklistInput } from "../domain/inventory.types.js";

export async function submitInventoryChecklistUseCase(
  repository: InventoryRepository,
  input: SubmitInventoryChecklistInput,
) {
  if (!input.checklistId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "checklistId" });
  }

  return repository.submitChecklist({
    ...input,
    checklistId: input.checklistId.trim(),
  });
}
