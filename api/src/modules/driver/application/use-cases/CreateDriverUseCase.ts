import { randomUUID } from "node:crypto";
import { InvalidCreateDriverPayloadError } from "../errors/InvalidCreateDriverPayloadError.js";
import type { CreateDriverInput, DriverRecord, DriverRepository } from "../ports/DriverRepository.js";

export type CreateDriverUseCaseInput = {
  active: unknown;
  name: unknown;
  phone: unknown;
  priorityLevel: unknown;
};

export type CreateDriverUseCaseOutput = {
  active: boolean;
  createdAt: string;
  id: string;
  name: string;
  phone: string | null;
  priorityLevel: number;
};

export class CreateDriverUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  async execute(input: CreateDriverUseCaseInput): Promise<CreateDriverUseCaseOutput> {
    const name = normalizeName(input.name);
    const phone = normalizePhone(input.phone);
    const active = normalizeActive(input.active);
    const priorityLevel = await normalizePriorityLevel(
      input.priorityLevel,
      this.driverRepository,
    );

    const created = await this.driverRepository.create({
      id: randomUUID(),
      name,
      phone,
      active,
      priorityLevel,
    });

    return mapDriverOutput(created);
  }
}

function normalizeName(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidCreateDriverPayloadError("name");
  }

  const normalized = value.trim();
  if (!normalized || normalized.length > 120) {
    throw new InvalidCreateDriverPayloadError("name");
  }

  return normalized;
}

function normalizePhone(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidCreateDriverPayloadError("phone");
  }

  const normalized = value.replace(/\D/g, "").trim();
  if (!normalized || normalized.length < 8 || normalized.length > 20) {
    throw new InvalidCreateDriverPayloadError("phone");
  }

  return normalized;
}

function normalizeActive(value: unknown): boolean {
  if (value === undefined) return true;
  if (typeof value !== "boolean") {
    throw new InvalidCreateDriverPayloadError("active");
  }

  return value;
}

async function normalizePriorityLevel(
  value: unknown,
  repository: DriverRepository,
): Promise<number> {
  if (value === undefined || value === null) {
    const maxPriorityLevel = await repository.getMaxPriorityLevel();
    return (maxPriorityLevel ?? -1) + 1;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new InvalidCreateDriverPayloadError("priorityLevel");
  }

  return value;
}

function mapDriverOutput(driver: DriverRecord): CreateDriverUseCaseOutput {
  return {
    id: driver.id,
    createdAt: driver.createdAt.toISOString(),
    name: driver.name,
    phone: driver.phone,
    active: driver.active,
    priorityLevel: driver.priorityLevel,
  };
}
