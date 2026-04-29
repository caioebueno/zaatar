import type { InventoryRepository } from "../domain/inventory.repository";

export async function listInventoryPlacesUseCase(repository: InventoryRepository) {
  return repository.listPlaces();
}
