import { DriverNotFoundError } from "../errors/DriverNotFoundError.js";
import { InvalidDriverIdError } from "../errors/InvalidDriverIdError.js";
import type { DriverRepository } from "../ports/DriverRepository.js";

export type GetDriverByIdUseCaseInput = {
  driverId: string;
};

export type GetDriverByIdUseCaseOutput = {
  active: boolean;
  activatedAt: string | null;
  activationEvents: Array<{
    createdAt: string;
    status: "ACTIVATED" | "DEACTIVATED";
  }>;
  createdAt: string;
  deactivatedAt: string | null;
  id: string;
  name: string;
  phone: string | null;
  priorityLevel: number;
};

export class GetDriverByIdUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  async execute(input: GetDriverByIdUseCaseInput): Promise<GetDriverByIdUseCaseOutput> {
    const driverId = normalizeDriverId(input.driverId);
    const driver = await this.driverRepository.findById(driverId);

    if (!driver) {
      throw new DriverNotFoundError();
    }

    return {
      id: driver.id,
      createdAt: driver.createdAt.toISOString(),
      name: driver.name,
      phone: driver.phone,
      active: driver.active,
      activatedAt: driver.activatedAt ? driver.activatedAt.toISOString() : null,
      activationEvents: driver.activationEvents.map((event) => ({
        createdAt: event.createdAt.toISOString(),
        status: event.status,
      })),
      deactivatedAt: driver.deactivatedAt ? driver.deactivatedAt.toISOString() : null,
      priorityLevel: driver.priorityLevel,
    };
  }
}

function normalizeDriverId(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidDriverIdError();
  }
  return normalized;
}
