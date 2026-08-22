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
    const [createdDriver] = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO "Driver" ("id", "name", "active", "priorityLevel")
      VALUES (${randomUUID()}, ${data.name}, ${data.active ?? true}, ${data.priorityLevel})
      RETURNING "id"
    `;

    return this.findByIdOrThrow(createdDriver.id);
  }

  async list(): Promise<Driver[]> {
    const drivers = await prisma.$queryRaw<DriverRow[]>`
      SELECT
        driver."id",
        driver."createdAt",
        driver."name",
        EXISTS (
          SELECT 1
          FROM "DispatchRouteSession" session
          INNER JOIN "DispatchRoutePoint" point
            ON point."sessionId" = session."id"
          WHERE session."driverId" = driver."id"
            AND point."recordedAt" >= CURRENT_TIMESTAMP - INTERVAL '10 minutes'
        ) AS "active",
        driver."priorityLevel"
      FROM "Driver" driver
      ORDER BY driver."priorityLevel" ASC, driver."createdAt" ASC
    `;

    return drivers.map(mapDriver);
  }

  async updateActive(data: UpdateDriverActiveInput): Promise<Driver> {
    const [driver] = await prisma.$queryRaw<{ id: string }[]>`
      UPDATE "Driver"
      SET "active" = ${data.active}
      WHERE "id" = ${data.driverId}
      RETURNING "id"
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

    return this.findByIdOrThrow(driver.id);
  }

  async updatePriority(data: UpdateDriverPriorityInput): Promise<Driver> {
    const driverId = await prisma.$transaction(async (tx): Promise<string> => {
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

      return data.driverId;
    });

    return this.findByIdOrThrow(driverId);
  }

  private async findByIdOrThrow(driverId: string): Promise<Driver> {
    const [driver] = await prisma.$queryRaw<DriverRow[]>`
      SELECT
        driver."id",
        driver."createdAt",
        driver."name",
        EXISTS (
          SELECT 1
          FROM "DispatchRouteSession" session
          INNER JOIN "DispatchRoutePoint" point
            ON point."sessionId" = session."id"
          WHERE session."driverId" = driver."id"
            AND point."recordedAt" >= CURRENT_TIMESTAMP - INTERVAL '10 minutes'
        ) AS "active",
        driver."priorityLevel"
      FROM "Driver" driver
      WHERE driver."id" = ${driverId}
      LIMIT 1
    `;

    if (!driver) {
      throw {
        code: "NOT_FOUND",
        details: {
          service: "DRIVER",
          id: driverId,
        },
      };
    }

    return mapDriver(driver);
  }
}

export const prismaDriverRepository = new PrismaDriverRepository();
