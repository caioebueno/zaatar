import { DriverNotFoundError } from "../errors/DriverNotFoundError.js";
import { InvalidDriverIdError } from "../errors/InvalidDriverIdError.js";
import type { DriverRepository } from "../ports/DriverRepository.js";

export type DeleteDriverUseCaseInput = {
  driverId: string;
};

export class DeleteDriverUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  async execute(input: DeleteDriverUseCaseInput): Promise<void> {
    const driverId = normalizeDriverId(input.driverId);
    const deleted = await this.driverRepository.deleteById(driverId);

    if (!deleted) {
      throw new DriverNotFoundError();
    }
  }
}

function normalizeDriverId(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidDriverIdError();
  }
  return normalized;
}
