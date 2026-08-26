import type { InventoryRepository } from "../domain/inventory.repository.js";
import type { OpenDailyInventoryChecklistInput } from "../domain/inventory.types.js";

export async function openDailyInventoryChecklistUseCase(
  repository: InventoryRepository,
  input: OpenDailyInventoryChecklistInput,
) {
  return repository.openDailyChecklist(input);
}
