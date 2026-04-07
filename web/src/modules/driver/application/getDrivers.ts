import type { DriverRepository } from "../domain/driver.repository";

export async function getDriversUseCase(repository: DriverRepository) {
  return repository.list();
}
