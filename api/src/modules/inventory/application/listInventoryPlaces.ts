import type { InventoryRepository } from "../domain/inventory.repository.js";

export async function listInventoryPlacesUseCase(repository: InventoryRepository) {
  return repository.listPlaces();
}
