import { InventoryError } from "../domain/inventory.errors.js";
import type { InventoryRepository } from "../domain/inventory.repository.js";
import type { AckInventoryAlertInput } from "../domain/inventory.types.js";

export async function ackInventoryAlertUseCase(
  repository: InventoryRepository,
  input: AckInventoryAlertInput,
) {
  if (!input.alertId.trim()) {
    throw new InventoryError("INVALID_PARAMS", { field: "alertId" });
  }

  return repository.ackAlert({
    ...input,
    alertId: input.alertId.trim(),
  });
}
