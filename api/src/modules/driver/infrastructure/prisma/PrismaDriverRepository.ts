import prisma from "../../../../prisma.js";
import { DriverPhoneAlreadyInUseError } from "../../application/errors/DriverPhoneAlreadyInUseError.js";
import type {
  CreateDriverInput,
  DriverRecord,
  DriverRepository,
  UpdateDriverInput,
} from "../../application/ports/DriverRepository.js";

type DriverRow = {
  active: boolean;
  createdAt: Date;
  id: string;
  name: string;
  phone: string | null;
  priorityLevel: number;
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
          "priorityLevel"
        )
        VALUES (
          ${input.id},
          NOW(),
          ${input.name},
          ${input.phone},
          ${input.active},
          ${input.priorityLevel}
        )
      `;

      const createdRows = await prisma.$queryRaw<DriverRow[]>`
        SELECT
          "id",
          "createdAt",
          "name",
          "phone",
          "active",
          "priorityLevel"
        FROM "Driver"
        WHERE "id" = ${input.id}
        LIMIT 1
      `;

      const created = createdRows[0];
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
    const rows = await prisma.$queryRaw<DriverRow[]>`
      SELECT
        "id",
        "createdAt",
        "name",
        "phone",
        "active",
        "priorityLevel"
      FROM "Driver"
      ORDER BY "priorityLevel" ASC, "createdAt" ASC
    `;

    return rows;
  }

  async findById(id: string): Promise<DriverRecord | null> {
    const rows = await prisma.$queryRaw<DriverRow[]>`
      SELECT
        "id",
        "createdAt",
        "name",
        "phone",
        "active",
        "priorityLevel"
      FROM "Driver"
      WHERE "id" = ${id}
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async update(input: UpdateDriverInput): Promise<DriverRecord> {
    try {
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
          "priorityLevel" = ${input.priorityLevel}
        WHERE "id" = ${input.id}
      `;

      const rows = await prisma.$queryRaw<DriverRow[]>`
        SELECT
          "id",
          "createdAt",
          "name",
          "phone",
          "active",
          "priorityLevel"
        FROM "Driver"
        WHERE "id" = ${input.id}
        LIMIT 1
      `;

      const updated = rows[0];
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
