import { randomUUID } from "crypto";
import prisma from "@/prisma";
import type { DriverRepository } from "../../domain/driver.repository";
import type {
  CreateDriverInput,
  Driver,
  UpdateDriverActiveInput,
  UpdateDriverPriorityInput,
} from "../../domain/driver.types";

type DriverRow = {
  id: string;
  createdAt: Date;
  name: string;
  active: boolean;
  priorityLevel: number;
};

type DriverPriorityRow = {
  id: string;
  createdAt: Date;
  priorityLevel: number;
};

function mapDriver(row: DriverRow): Driver {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    name: row.name,
    active: row.active,
    priorityLevel: row.priorityLevel,
  };
}

class PrismaDriverRepository implements DriverRepository {
  async create(data: CreateDriverInput): Promise<Driver> {
    const [driver] = await prisma.$queryRaw<DriverRow[]>`
      INSERT INTO "Driver" ("id", "name", "active", "priorityLevel")
      VALUES (${randomUUID()}, ${data.name}, ${data.active ?? true}, ${data.priorityLevel})
      RETURNING "id", "createdAt", "name", "active", "priorityLevel"
    `;

    return mapDriver(driver);
  }

  async list(): Promise<Driver[]> {
    const drivers = await prisma.$queryRaw<DriverRow[]>`
      SELECT "id", "createdAt", "name", "active", "priorityLevel"
      FROM "Driver"
      ORDER BY "priorityLevel" ASC, "createdAt" ASC
    `;

    return drivers.map(mapDriver);
  }

  async updateActive(data: UpdateDriverActiveInput): Promise<Driver> {
    const [driver] = await prisma.$queryRaw<DriverRow[]>`
      UPDATE "Driver"
      SET "active" = ${data.active}
      WHERE "id" = ${data.driverId}
      RETURNING "id", "createdAt", "name", "active", "priorityLevel"
    `;

    if (!driver) {
      throw {
        code: "NOT_FOUND",
        details: {
          service: "DRIVER",
          id: data.driverId,
        },
      };
    }

    return mapDriver(driver);
  }

  async updatePriority(data: UpdateDriverPriorityInput): Promise<Driver> {
    return prisma.$transaction(async (tx) => {
      const drivers = await tx.$queryRaw<DriverPriorityRow[]>`
        SELECT "id", "createdAt", "priorityLevel"
        FROM "Driver"
        ORDER BY "priorityLevel" ASC, "createdAt" ASC
        FOR UPDATE
      `;

      const targetDriver = drivers.find((driver) => driver.id === data.driverId);

      if (!targetDriver) {
        throw {
          code: "NOT_FOUND",
          details: {
            service: "DRIVER",
            id: data.driverId,
          },
        };
      }

      const orderedDriverIds = drivers
        .filter((driver) => driver.id !== data.driverId)
        .map((driver) => driver.id);
      const targetIndex = Math.max(
        0,
        Math.min(data.priorityLevel, orderedDriverIds.length),
      );

      orderedDriverIds.splice(targetIndex, 0, data.driverId);

      for (const [index, driverId] of orderedDriverIds.entries()) {
        await tx.$executeRaw`
          UPDATE "Driver"
          SET "priorityLevel" = ${index}
          WHERE "id" = ${driverId}
        `;
      }

      const [updatedDriver] = await tx.$queryRaw<DriverRow[]>`
        SELECT "id", "createdAt", "name", "active", "priorityLevel"
        FROM "Driver"
        WHERE "id" = ${data.driverId}
        LIMIT 1
      `;

      return mapDriver(updatedDriver);
    });
  }
}

export const prismaDriverRepository = new PrismaDriverRepository();
