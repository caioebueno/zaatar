import { randomUUID } from "node:crypto";
import prisma from "../../../../prisma.js";
import { DriverPhoneAlreadyInUseError } from "../../application/errors/DriverPhoneAlreadyInUseError.js";
import type {
  CreateDriverInput,
  DriverActivationEventRecord,
  DriverRecord,
  DriverRepository,
  UpdateDriverInput,
} from "../../application/ports/DriverRepository.js";

type DriverRow = {
  active: boolean;
  activatedAt: Date | null;
  createdAt: Date;
  deactivatedAt: Date | null;
  id: string;
  name: string;
  phone: string | null;
  priorityLevel: number;
};

type DriverActivationEventRow = {
  createdAt: Date;
  driverId: string;
  status: "ACTIVATED" | "DEACTIVATED";
};

export class PrismaDriverRepository implements DriverRepository {
  async create(input: CreateDriverInput): Promise<DriverRecord> {
    try {
      const existingRows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Driver"
        WHERE "phone" = ${input.phone}
        LIMIT 1
      `;

      if (existingRows.length > 0) {
        throw new DriverPhoneAlreadyInUseError();
      }

      await prisma.$executeRaw`
        INSERT INTO "Driver" (
          "id",
          "createdAt",
          "name",
          "phone",
          "active",
          "activatedAt",
          "deactivatedAt",
          "priorityLevel"
        )
        VALUES (
          ${input.id},
          NOW(),
          ${input.name},
          ${input.phone},
          ${input.active},
          CASE WHEN ${input.active} THEN NOW() ELSE NULL END,
          CASE WHEN ${input.active} THEN NULL ELSE NOW() END,
          ${input.priorityLevel}
        )
      `;

      const activationStatus: "ACTIVATED" | "DEACTIVATED" = input.active
        ? "ACTIVATED"
        : "DEACTIVATED";
      await prisma.$executeRaw`
        INSERT INTO "DriverActivationEvent" (
          "id",
          "createdAt",
          "driverId",
          "status"
        )
        VALUES (
          ${randomUUID()},
          NOW(),
          ${input.id},
          CAST(${activationStatus} AS "DriverActivationStatus")
        )
      `;

      const created = await this.findById(input.id);
      if (!created) {
        throw new Error("Failed to create driver");
      }

      return created;
    } catch (error) {
      if (error instanceof DriverPhoneAlreadyInUseError) {
        throw new DriverPhoneAlreadyInUseError();
      }

      if (isUniqueConstraintError(error)) {
        throw new DriverPhoneAlreadyInUseError();
      }

      throw error;
    }
  }

  async getMaxPriorityLevel(): Promise<number | null> {
    const rows = await prisma.$queryRaw<Array<{ maxPriorityLevel: number | null }>>`
      SELECT MAX("priorityLevel")::int AS "maxPriorityLevel"
      FROM "Driver"
    `;

    return rows[0]?.maxPriorityLevel ?? null;
  }

  async list(): Promise<DriverRecord[]> {
    const driverRows = await prisma.$queryRaw<DriverRow[]>`
        SELECT
          "id",
          "createdAt",
          "name",
          "phone",
          "active",
          "activatedAt",
          "deactivatedAt",
          "priorityLevel"
      FROM "Driver"
      ORDER BY "priorityLevel" ASC, "createdAt" ASC
    `;

    return this.buildDriverRecordsWithEvents(driverRows);
  }

  async findById(id: string): Promise<DriverRecord | null> {
    const driverRows = await prisma.$queryRaw<DriverRow[]>`
        SELECT
          "id",
          "createdAt",
          "name",
          "phone",
          "active",
          "activatedAt",
          "deactivatedAt",
          "priorityLevel"
      FROM "Driver"
      WHERE "id" = ${id}
      LIMIT 1
    `;

    const records = await this.buildDriverRecordsWithEvents(driverRows);
    return records[0] ?? null;
  }

  async update(input: UpdateDriverInput): Promise<DriverRecord> {
    try {
      const currentStateRows = await prisma.$queryRaw<Array<{ active: boolean }>>`
        SELECT "active"
        FROM "Driver"
        WHERE "id" = ${input.id}
        LIMIT 1
      `;
      const currentState = currentStateRows[0];

      if (input.phone) {
        const existingRows = await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT "id"
          FROM "Driver"
          WHERE "phone" = ${input.phone}
            AND "id" <> ${input.id}
          LIMIT 1
        `;

        if (existingRows.length > 0) {
          throw new DriverPhoneAlreadyInUseError();
        }
      }

      await prisma.$executeRaw`
        UPDATE "Driver"
        SET
          "name" = ${input.name},
          "phone" = ${input.phone},
          "active" = ${input.active},
          "activatedAt" = CASE
            WHEN "active" <> ${input.active} AND ${input.active} = TRUE THEN NOW()
            ELSE "activatedAt"
          END,
          "deactivatedAt" = CASE
            WHEN "active" <> ${input.active} AND ${input.active} = FALSE THEN NOW()
            ELSE "deactivatedAt"
          END,
          "priorityLevel" = ${input.priorityLevel}
        WHERE "id" = ${input.id}
      `;

      if (currentState && currentState.active !== input.active) {
        const activationStatus: "ACTIVATED" | "DEACTIVATED" = input.active
          ? "ACTIVATED"
          : "DEACTIVATED";

        await prisma.$executeRaw`
          INSERT INTO "DriverActivationEvent" (
            "id",
            "createdAt",
            "driverId",
            "status"
          )
          VALUES (
            ${randomUUID()},
            NOW(),
            ${input.id},
            CAST(${activationStatus} AS "DriverActivationStatus")
          )
        `;
      }

      const updated = await this.findById(input.id);
      if (!updated) {
        throw new Error("Failed to update driver");
      }

      return updated;
    } catch (error) {
      if (error instanceof DriverPhoneAlreadyInUseError) {
        throw new DriverPhoneAlreadyInUseError();
      }

      if (isUniqueConstraintError(error)) {
        throw new DriverPhoneAlreadyInUseError();
      }

      throw error;
    }
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM "Driver"
      WHERE "id" = ${id}
    `;

    return Number(result) > 0;
  }

  private async buildDriverRecordsWithEvents(driverRows: DriverRow[]): Promise<DriverRecord[]> {
    if (driverRows.length === 0) return [];

    const driverIds = driverRows.map((row) => row.id);
    const eventsByDriver = await this.loadActivationEventsByDriverIds(driverIds);

    return driverRows.map((row) => ({
      ...row,
      activationEvents: eventsByDriver.get(row.id) ?? [],
    }));
  }

  private async loadActivationEventsByDriverIds(
    driverIds: string[],
  ): Promise<Map<string, DriverActivationEventRecord[]>> {
    if (driverIds.length === 0) {
      return new Map();
    }

    const rows = await prisma.$queryRaw<DriverActivationEventRow[]>`
      SELECT
        "driverId",
        "createdAt",
        "status"
      FROM "DriverActivationEvent"
      WHERE "driverId" = ANY(${driverIds}::text[])
      ORDER BY "createdAt" ASC
    `;

    const map = new Map<string, DriverActivationEventRecord[]>();

    for (const row of rows) {
      const current = map.get(row.driverId) ?? [];
      current.push({
        createdAt: row.createdAt,
        status: row.status,
      });
      map.set(row.driverId, current);
    }

    return map;
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const dbError = error as {
    code?: string;
    meta?: {
      driverAdapterError?: {
        cause?: {
          code?: string;
        };
      };
    };
  };

  if (dbError.code === "P2002") return true;
  if (dbError.meta?.driverAdapterError?.cause?.code === "23505") return true;

  return false;
}
