import type { InventoryRepository } from "../domain/inventory.repository";

export async function getInventoryDashboardUseCase(
  repository: InventoryRepository,
  date?: string | null,
) {
  return repository.getDashboard(date);
}
