import { randomUUID } from "crypto";
import prisma from "@/prisma";
import type { DriverRepository } from "../../domain/driver.repository";
import type {
  CreateDriverInput,
  Driver,
  UpdateDriverPriorityInput,
} from "../../domain/driver.types";

type DriverRow = {
  id: string;
  createdAt: Date;
  name: string;
  active: boolean;
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

  async updatePriority(data: UpdateDriverPriorityInput): Promise<Driver> {
    const [driver] = await prisma.$queryRaw<DriverRow[]>`
      UPDATE "Driver"
      SET "priorityLevel" = ${data.priorityLevel}
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
}

export const prismaDriverRepository = new PrismaDriverRepository();
