import prisma from "@/prisma";
import { Prisma } from "@/src/generated/prisma";
import type { BranchRepository } from "../../domain/branch.repository";
import type {
  BranchWorkingHours,
  OperationHours,
} from "../../domain/branch.types";
import { normalizeOperationHours } from "../../domain/branch.types";

function toPrismaOperationHours(
  operationHours: OperationHours,
): Prisma.InputJsonObject {
  return {
    monday: operationHours.monday.map((range) => ({
      from: range.from,
      to: range.to,
    })),
    tuesday: operationHours.tuesday.map((range) => ({
      from: range.from,
      to: range.to,
    })),
    wednesday: operationHours.wednesday.map((range) => ({
      from: range.from,
      to: range.to,
    })),
    thursday: operationHours.thursday.map((range) => ({
      from: range.from,
      to: range.to,
    })),
    friday: operationHours.friday.map((range) => ({
      from: range.from,
      to: range.to,
    })),
    saturday: operationHours.saturday.map((range) => ({
      from: range.from,
      to: range.to,
    })),
    sunday: operationHours.sunday.map((range) => ({
      from: range.from,
      to: range.to,
    })),
  };
}

type BranchWorkingHoursRow = {
  id: string;
  operationHours: Prisma.JsonValue | null;
};

class PrismaBranchRepository implements BranchRepository {
  async getWorkingHours(branchId: string): Promise<BranchWorkingHours | null> {
    const [branch] = await prisma.$queryRaw<BranchWorkingHoursRow[]>`
      SELECT "id", "operationHours"
      FROM "Branch"
      WHERE "id" = ${branchId}
      LIMIT 1
    `;

    if (!branch) return null;

    return {
      branchId: branch.id,
      operationHours: normalizeOperationHours(branch.operationHours),
    };
  }

  async saveWorkingHours(
    branchId: string,
    operationHours: OperationHours,
  ): Promise<BranchWorkingHours> {
    const serializedOperationHours = JSON.stringify(
      toPrismaOperationHours(operationHours),
    );

    const [branch] = await prisma.$queryRaw<BranchWorkingHoursRow[]>`
      UPDATE "Branch"
      SET "operationHours" = CAST(${serializedOperationHours} AS jsonb)
      WHERE "id" = ${branchId}
      RETURNING "id", "operationHours"
    `;

    if (!branch) {
      throw {
        code: "NOT_FOUND",
        details: {
          service: "BRANCH",
          id: branchId,
        },
      };
    }

    return {
      branchId: branch.id,
      operationHours: normalizeOperationHours(branch.operationHours),
    };
  }
}

export const prismaBranchRepository = new PrismaBranchRepository();
