import { InventoryError } from "../domain/inventory.errors";
import type { InventoryRepository } from "../domain/inventory.repository";
import type { UpsertInventoryStockInput } from "../domain/inventory.types";

export async function upsertInventoryStockUseCase(
  repository: InventoryRepository,
  input: UpsertInventoryStockInput,
) {
  if (!input.placeId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "placeId" });
  }

  if (!input.productId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "productId" });
  }

  if (!Number.isInteger(input.currentQuantity) || input.currentQuantity < 0) {
    throw new InventoryError("INVALID_PARAMS", { field: "currentQuantity" });
  }

  if (
    input.minQuantity !== undefined &&
    (!Number.isInteger(input.minQuantity) || input.minQuantity < 0)
  ) {
    throw new InventoryError("INVALID_PARAMS", { field: "minQuantity" });
  }

  return repository.upsertStock({
    ...input,
    placeId: input.placeId.trim(),
    productId: input.productId.trim(),
  });
}
