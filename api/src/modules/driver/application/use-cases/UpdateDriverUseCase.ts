import { DriverNotFoundError } from "../errors/DriverNotFoundError.js";
import { InvalidDriverIdError } from "../errors/InvalidDriverIdError.js";
import { InvalidUpdateDriverPayloadError } from "../errors/InvalidUpdateDriverPayloadError.js";
import type { DriverRepository } from "../ports/DriverRepository.js";

export type UpdateDriverUseCaseInput = {
  active: unknown;
  driverId: string;
  name: unknown;
  phone: unknown;
  priorityLevel: unknown;
};

export type UpdateDriverUseCaseOutput = {
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

export class UpdateDriverUseCase {
  constructor(private readonly driverRepository: DriverRepository) {}

  async execute(input: UpdateDriverUseCaseInput): Promise<UpdateDriverUseCaseOutput> {
    const driverId = normalizeDriverId(input.driverId);
    const current = await this.driverRepository.findById(driverId);

    if (!current) {
      throw new DriverNotFoundError();
    }

    if (
      input.name === undefined &&
      input.phone === undefined &&
      input.active === undefined &&
      input.priorityLevel === undefined
    ) {
      throw new InvalidUpdateDriverPayloadError("body");
    }

    const nextName =
      input.name === undefined ? current.name : normalizeName(input.name, "name");
    const nextPhone =
      input.phone === undefined ? current.phone : normalizePhone(input.phone);
    const nextActive =
      input.active === undefined ? current.active : normalizeBoolean(input.active, "active");
    const nextPriorityLevel =
      input.priorityLevel === undefined
        ? current.priorityLevel
        : normalizePriorityLevel(input.priorityLevel);

    const updated = await this.driverRepository.update({
      id: current.id,
      name: nextName,
      phone: nextPhone,
      active: nextActive,
      priorityLevel: nextPriorityLevel,
    });

    return {
      id: updated.id,
      createdAt: updated.createdAt.toISOString(),
      name: updated.name,
      phone: updated.phone,
      active: updated.active,
      activatedAt: updated.activatedAt ? updated.activatedAt.toISOString() : null,
      activationEvents: updated.activationEvents.map((event) => ({
        createdAt: event.createdAt.toISOString(),
        status: event.status,
      })),
      deactivatedAt: updated.deactivatedAt ? updated.deactivatedAt.toISOString() : null,
      priorityLevel: updated.priorityLevel,
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

function normalizeName(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InvalidUpdateDriverPayloadError(field);
  }

  const normalized = value.trim();
  if (!normalized || normalized.length > 120) {
    throw new InvalidUpdateDriverPayloadError(field);
  }

  return normalized;
}

function normalizePhone(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvalidUpdateDriverPayloadError("phone");
  }

  const normalized = value.replace(/\D/g, "").trim();
  if (!normalized || normalized.length < 8 || normalized.length > 20) {
    throw new InvalidUpdateDriverPayloadError("phone");
  }

  return normalized;
}

function normalizeBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") {
    throw new InvalidUpdateDriverPayloadError(field);
  }

  return value;
}

function normalizePriorityLevel(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new InvalidUpdateDriverPayloadError("priorityLevel");
  }

  return value;
}
