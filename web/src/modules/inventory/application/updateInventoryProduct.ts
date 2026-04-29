import { InventoryError } from "../domain/inventory.errors";
import type { InventoryRepository } from "../domain/inventory.repository";
import type { UpdateInventoryProductInput } from "../domain/inventory.types";

export async function updateInventoryProductUseCase(
  repository: InventoryRepository,
  input: UpdateInventoryProductInput,
) {
  if (!input.productId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "productId" });
  }

  if (input.name !== undefined && input.name.trim().length === 0) {
    throw new InventoryError("INVALID_PARAMS", { field: "name" });
  }

  if (input.unit !== undefined && input.unit.trim().length === 0) {
    throw new InventoryError("INVALID_PARAMS", { field: "unit" });
  }

  if (
    input.minQuantity !== undefined &&
    (!Number.isInteger(input.minQuantity) || input.minQuantity < 0)
  ) {
    throw new InventoryError("INVALID_PARAMS", { field: "minQuantity" });
  }

  if (
    input.alertThreshold !== undefined &&
    input.alertThreshold !== null &&
    (!Number.isInteger(input.alertThreshold) || input.alertThreshold < 0)
  ) {
    throw new InventoryError("INVALID_PARAMS", { field: "alertThreshold" });
  }

  return repository.updateProduct({
    ...input,
    productId: input.productId.trim(),
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.unit !== undefined ? { unit: input.unit.trim() } : {}),
    ...(input.notes !== undefined
      ? { notes: input.notes ? input.notes.trim() : null }
      : {}),
  });
}
