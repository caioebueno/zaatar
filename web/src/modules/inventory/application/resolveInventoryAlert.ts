import { InventoryError } from "../domain/inventory.errors";
import type { InventoryRepository } from "../domain/inventory.repository";
import type { ResolveInventoryAlertInput } from "../domain/inventory.types";

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
