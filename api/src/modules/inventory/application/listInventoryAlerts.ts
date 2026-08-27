import type { InventoryRepository } from "../domain/inventory.repository.js";
import type { ListInventoryAlertsInput } from "../domain/inventory.types.js";

export async function listInventoryAlertsUseCase(
  repository: InventoryRepository,
  input?: ListInventoryAlertsInput,
) {
  return repository.listAlerts(input);
}
