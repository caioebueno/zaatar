import { InventoryError } from "../domain/inventory.errors";
import type { InventoryRepository } from "../domain/inventory.repository";
import type { CreateInventoryPlaceInput } from "../domain/inventory.types";

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
