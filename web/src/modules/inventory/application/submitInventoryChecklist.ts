import { InventoryError } from "../domain/inventory.errors";
import type { InventoryRepository } from "../domain/inventory.repository";
import type { SubmitInventoryChecklistInput } from "../domain/inventory.types";

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
