import type { InventoryRepository } from "../domain/inventory.repository.js";

export async function listInventoryStocksUseCase(
  repository: InventoryRepository,
  filters?: { placeId?: string | null },
) {
  return repository.listStocks(filters);
}
