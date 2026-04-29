import { InventoryError } from "../domain/inventory.errors";
import type { InventoryRepository } from "../domain/inventory.repository";
import type { UpdateInventoryPlaceInput } from "../domain/inventory.types";

export async function updateInventoryPlaceUseCase(
  repository: InventoryRepository,
  input: UpdateInventoryPlaceInput,
) {
  if (!input.placeId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "placeId" });
  }

  if (input.name !== undefined && input.name.trim().length === 0) {
    throw new InventoryError("INVALID_PARAMS", { field: "name" });
  }

  return repository.updatePlace({
    ...input,
    placeId: input.placeId.trim(),
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
  });
}
