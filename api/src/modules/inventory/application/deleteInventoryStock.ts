import { InventoryError } from "../domain/inventory.errors.js";
import type { InventoryRepository } from "../domain/inventory.repository.js";
import type { DeleteInventoryStockInput } from "../domain/inventory.types.js";

export async function deleteInventoryStockUseCase(
  repository: InventoryRepository,
  input: DeleteInventoryStockInput,
) {
  if (!input.placeId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "placeId" });
  }

  if (!input.productId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "productId" });
  }

  return repository.deleteStock({
    ...input,
    placeId: input.placeId.trim(),
    productId: input.productId.trim(),
  });
}
