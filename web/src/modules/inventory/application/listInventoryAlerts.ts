import type { InventoryRepository } from "../domain/inventory.repository";
import type { ListInventoryAlertsInput } from "../domain/inventory.types";

export async function listInventoryAlertsUseCase(
  repository: InventoryRepository,
  input?: ListInventoryAlertsInput,
) {
  return repository.listAlerts(input);
}
