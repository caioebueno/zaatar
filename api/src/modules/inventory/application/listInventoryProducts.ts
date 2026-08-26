import type { InventoryRepository } from "../domain/inventory.repository.js";

export async function listInventoryProductsUseCase(repository: InventoryRepository) {
  return repository.listProducts();
}
