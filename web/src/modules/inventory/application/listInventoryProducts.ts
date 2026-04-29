import type { InventoryRepository } from "../domain/inventory.repository";

export async function listInventoryProductsUseCase(repository: InventoryRepository) {
  return repository.listProducts();
}
