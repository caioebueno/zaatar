import { InventoryError } from "../domain/inventory.errors";
import type { InventoryRepository } from "../domain/inventory.repository";
import type { AckInventoryAlertInput } from "../domain/inventory.types";

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
