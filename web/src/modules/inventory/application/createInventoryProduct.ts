import { InventoryError } from "../domain/inventory.errors";
import type { InventoryRepository } from "../domain/inventory.repository";
import type { CreateInventoryProductInput } from "../domain/inventory.types";

export async function createInventoryProductUseCase(
  repository: InventoryRepository,
  input: CreateInventoryProductInput,
) {
  const name = input.name.trim();
  const unit = input.unit.trim();

  if (name.length === 0) {
    throw new InventoryError("INVALID_PARAMS", { field: "name" });
  }

  if (unit.length === 0) {
    throw new InventoryError("INVALID_PARAMS", { field: "unit" });
  }

  if (!Number.isInteger(input.minQuantity) || input.minQuantity < 0) {
    throw new InventoryError("INVALID_PARAMS", { field: "minQuantity" });
  }

  if (
    input.alertThreshold !== undefined &&
    input.alertThreshold !== null &&
    (!Number.isInteger(input.alertThreshold) || input.alertThreshold < 0)
  ) {
    throw new InventoryError("INVALID_PARAMS", { field: "alertThreshold" });
  }

  return repository.createProduct({
    ...input,
    name,
    unit,
    ...(input.notes !== undefined
      ? {
          notes: input.notes ? input.notes.trim() : null,
        }
      : {}),
  });
}
