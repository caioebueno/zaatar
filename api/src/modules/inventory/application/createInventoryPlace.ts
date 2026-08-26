import { InventoryError } from "../domain/inventory.errors.js";
import type { InventoryRepository } from "../domain/inventory.repository.js";
import type { CreateInventoryPlaceInput } from "../domain/inventory.types.js";

export async function createInventoryPlaceUseCase(
  repository: InventoryRepository,
  input: CreateInventoryPlaceInput,
) {
  const name = input.name.trim();

  if (name.length === 0) {
    throw new InventoryError("INVALID_PARAMS", { field: "name" });
  }

  return repository.createPlace({
    ...input,
    name,
  });
}
