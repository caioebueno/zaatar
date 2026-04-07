import type { DispatchRepository } from "../domain/dispatch.repository";

export async function getDispatchesUseCase(repository: DispatchRepository) {
  return repository.list();
}
