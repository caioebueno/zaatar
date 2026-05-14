import type { DriverRecord, DriverRepository } from "../ports/DriverRepository.js";

export type ListDriversUseCaseOutput = Array<{
  active: boolean;
  createdAt: string;
  id: string;
  name: string;
  phone: string | null;
  priorityLevel: number;
}>;

export class ListDriversUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  async execute(): Promise<ListDriversUseCaseOutput> {
    const drivers = await this.driverRepository.list();
    return drivers.map(mapDriver);
  }
}

function mapDriver(driver: DriverRecord) {
  return {
    id: driver.id,
    createdAt: driver.createdAt.toISOString(),
    name: driver.name,
    phone: driver.phone,
    active: driver.active,
    priorityLevel: driver.priorityLevel,
  };
}
