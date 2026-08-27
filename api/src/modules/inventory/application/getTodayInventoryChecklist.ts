import type { InventoryRepository } from "../domain/inventory.repository.js";

export async function getTodayInventoryChecklistUseCase(
  repository: InventoryRepository,
  date: string,
) {
  return repository.getChecklistByDate(date);
}
