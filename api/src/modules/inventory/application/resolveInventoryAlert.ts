import { InventoryError } from "../domain/inventory.errors.js";
import type { InventoryRepository } from "../domain/inventory.repository.js";
import type { ResolveInventoryAlertInput } from "../domain/inventory.types.js";

export async function resolveInventoryAlertUseCase(
  repository: InventoryRepository,
  input: ResolveInventoryAlertInput,
) {
  if (!input.alertId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "alertId" });
  }

  return repository.resolveAlert({
    ...input,
    alertId: input.alertId.trim(),
  });
}
