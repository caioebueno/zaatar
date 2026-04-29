import { InventoryError } from "../domain/inventory.errors";
import type { InventoryRepository } from "../domain/inventory.repository";
import type { TransferInventoryStockInput } from "../domain/inventory.types";

export async function transferInventoryStockUseCase(
  repository: InventoryRepository,
  input: TransferInventoryStockInput,
) {
  if (!input.fromPlaceId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "fromPlaceId" });
  }

  if (!input.toPlaceId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "toPlaceId" });
  }

  if (!input.productId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "productId" });
  }

  if (input.fromPlaceId.trim() === input.toPlaceId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "toPlaceId" });
  }

  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new InventoryError("INVALID_PARAMS", { field: "quantity" });
  }

  return repository.transferStock({
    ...input,
    fromPlaceId: input.fromPlaceId.trim(),
    toPlaceId: input.toPlaceId.trim(),
    productId: input.productId.trim(),
    notes: input.notes ? input.notes.trim() : null,
  });
}
