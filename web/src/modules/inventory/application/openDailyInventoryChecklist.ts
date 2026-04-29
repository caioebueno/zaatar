import type { InventoryRepository } from "../domain/inventory.repository";
import type { OpenDailyInventoryChecklistInput } from "../domain/inventory.types";

export async function openDailyInventoryChecklistUseCase(
  repository: InventoryRepository,
  input: OpenDailyInventoryChecklistInput,
) {
  return repository.openDailyChecklist(input);
}
