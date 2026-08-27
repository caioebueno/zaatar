import type { InventoryRepository } from "../domain/inventory.repository.js";

export async function getInventoryDashboardUseCase(
  repository: InventoryRepository,
  date?: string | null,
) {
  return repository.getDashboard(date);
}
