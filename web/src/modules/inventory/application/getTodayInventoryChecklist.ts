import type { InventoryRepository } from "../domain/inventory.repository";

export async function getTodayInventoryChecklistUseCase(
  repository: InventoryRepository,
  date: string,
) {
  return repository.getChecklistByDate(date);
}
