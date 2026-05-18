import prisma from "../../../../prisma.js";
import type {
  StationListItem,
  StationPreparationStepItem,
  StationRepository,
} from "../../application/ports/StationRepository.js";

export class PrismaStationRepository implements StationRepository {
  async listStations(_input: { businessId: string }): Promise<StationListItem[]> {
    const rows = await prisma.station.findMany({
      select: {
        id: true,
        name: true,
        preparationSteps: {
          select: {
            id: true,
            name: true,
            goalMinutes: true,
            includeComments: true,
            includeModifiers: true,
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      preparationSteps: row.preparationSteps.map((s) => ({
        id: s.id,
        name: s.name,
        goalMinutes:
          typeof (s as { goalMinutes?: unknown }).goalMinutes === "number"
            ? Math.max(
                0,
                Math.floor((s as { goalMinutes?: number }).goalMinutes ?? 0),
              )
            : 0,
        includeComments: s.includeComments,
        includeModifiers: s.includeModifiers,
      })),
    }));
  }

  async createStation(input: { id: string; name: string }): Promise<StationListItem> {
    const row = await prisma.station.create({
      data: { id: input.id, name: input.name },
      select: {
        id: true,
        name: true,
        preparationSteps: {
          select: {
            id: true,
            name: true,
            goalMinutes: true,
            includeComments: true,
            includeModifiers: true,
          },
        },
      },
    });

    return {
      id: row.id,
      name: row.name,
      preparationSteps: row.preparationSteps.map((step) => ({
        id: step.id,
        name: step.name,
        goalMinutes:
          typeof (step as { goalMinutes?: unknown }).goalMinutes === "number"
            ? Math.max(
                0,
                Math.floor((step as { goalMinutes?: number }).goalMinutes ?? 0),
              )
            : 0,
        includeComments: step.includeComments,
        includeModifiers: step.includeModifiers,
      })),
    };
  }

  async updateStation(input: { id: string; name: string }): Promise<StationListItem | null> {
    try {
      const row = await prisma.station.update({
        where: { id: input.id },
        data: { name: input.name },
        select: {
            id: true,
            name: true,
            preparationSteps: {
            select: {
              id: true,
              name: true,
              goalMinutes: true,
              includeComments: true,
              includeModifiers: true,
            },
            orderBy: { name: "asc" },
          },
        },
      });

      return {
        id: row.id,
        name: row.name,
        preparationSteps: row.preparationSteps.map((step) => ({
          id: step.id,
          name: step.name,
          goalMinutes:
            typeof (step as { goalMinutes?: unknown }).goalMinutes === "number"
              ? Math.max(
                  0,
                  Math.floor((step as { goalMinutes?: number }).goalMinutes ?? 0),
                )
              : 0,
          includeComments: step.includeComments,
          includeModifiers: step.includeModifiers,
        })),
      };
    } catch {
      return null;
    }
  }

  async deleteStation(input: { id: string }): Promise<boolean> {
    try {
      await prisma.station.delete({ where: { id: input.id } });
      return true;
    } catch {
      return false;
    }
  }

  async createStep(input: {
    goalMinutes: number;
    id: string;
    stationId: string;
    name: string;
    includeComments: boolean;
    includeModifiers: boolean;
  }): Promise<StationPreparationStepItem> {
    const row = await prisma.$transaction(async (tx) => {
      const existingStationGoal = await tx.preparationStep.findFirst({
        where: { stationId: input.stationId },
        select: { goalMinutes: true },
      });

      const resolvedGoalMinutes =
        input.goalMinutes > 0
          ? Math.floor(input.goalMinutes)
          : (existingStationGoal?.goalMinutes ?? 0);

      const created = await tx.preparationStep.create({
        data: {
          id: input.id,
          name: input.name,
          includeComments: input.includeComments,
          includeModifiers: input.includeModifiers,
          stationId: input.stationId,
          goalMinutes: resolvedGoalMinutes,
        },
        select: {
          id: true,
          name: true,
          goalMinutes: true,
          includeComments: true,
          includeModifiers: true,
        },
      });

      if (input.goalMinutes !== resolvedGoalMinutes) {
        return created;
      }

      await tx.preparationStep.updateMany({
        where: { stationId: input.stationId },
        data: { goalMinutes: resolvedGoalMinutes },
      });

      return created;
    });

    return {
      id: row.id,
      name: row.name,
      goalMinutes:
        typeof (row as { goalMinutes?: unknown }).goalMinutes === "number"
          ? Math.max(
              0,
              Math.floor((row as { goalMinutes?: number }).goalMinutes ?? 0),
            )
          : 0,
      includeComments: row.includeComments,
      includeModifiers: row.includeModifiers,
    };
  }

  async updateStep(input: {
    id: string;
    goalMinutes?: number;
    name?: string;
    includeComments?: boolean;
    includeModifiers?: boolean;
  }): Promise<StationPreparationStepItem | null> {
    try {
      const row = await prisma.$transaction(async (tx) => {
        const current = await tx.preparationStep.findUnique({
          where: { id: input.id },
          select: { stationId: true },
        });

        if (!current) return null;

        const updated = await tx.preparationStep.update({
          where: { id: input.id },
          data: {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.goalMinutes !== undefined
              ? { goalMinutes: input.goalMinutes }
              : {}),
            ...(input.includeComments !== undefined
              ? { includeComments: input.includeComments }
              : {}),
            ...(input.includeModifiers !== undefined
              ? { includeModifiers: input.includeModifiers }
              : {}),
          },
          select: {
            id: true,
            name: true,
            goalMinutes: true,
            includeComments: true,
            includeModifiers: true,
          },
        });

        if (input.goalMinutes !== undefined) {
          await tx.preparationStep.updateMany({
            where: { stationId: current.stationId },
            data: { goalMinutes: input.goalMinutes },
          });
        }

        return updated;
      });

      if (!row) return null;

      return {
        id: row.id,
        name: row.name,
        goalMinutes:
          typeof (row as { goalMinutes?: unknown }).goalMinutes === "number"
            ? Math.max(
                0,
                Math.floor((row as { goalMinutes?: number }).goalMinutes ?? 0),
              )
            : 0,
        includeComments: row.includeComments,
        includeModifiers: row.includeModifiers,
      };
    } catch {
      return null;
    }
  }

  async deleteStep(input: { id: string }): Promise<boolean> {
    try {
      await prisma.preparationStep.delete({ where: { id: input.id } });
      return true;
    } catch {
      return false;
    }
  }

  async completeOrderTracksByStation(input: {
    orderId: string;
    stationId: string;
  }): Promise<{
    completedTracks: number;
    stationCompleted: boolean;
    totalTracks: number;
  }> {
    return prisma.$transaction(async (tx) => {
      const tracks = await tx.preparationStepTrack.findMany({
        where: {
          preparationStepCategory: {
            orderId: input.orderId,
          },
          preparationStep: {
            stationId: input.stationId,
          },
        },
        select: {
          id: true,
          preparationStepCategoryId: true,
          completed: true,
        },
      });

      const totalTracks = tracks.length;
      if (totalTracks === 0) {
        return {
          completedTracks: 0,
          totalTracks: 0,
          stationCompleted: false,
        };
      }

      const trackIds = tracks.map((track) => track.id);
      const categoryIds = Array.from(
        new Set(tracks.map((track) => track.preparationStepCategoryId)),
      );
      const now = new Date();

      await tx.preparationStepTrack.updateMany({
        where: {
          id: {
            in: trackIds,
          },
        },
        data: {
          completed: true,
          completedComments: true,
          completedAt: now,
        },
      });

      await tx.preparationStepModifierTrack.updateMany({
        where: {
          preparationStepTrackId: {
            in: trackIds,
          },
        },
        data: {
          completed: true,
        },
      });

      for (const categoryId of categoryIds) {
        const incompleteCount = await tx.preparationStepTrack.count({
          where: {
            preparationStepCategoryId: categoryId,
            completed: false,
          },
        });

        if (incompleteCount === 0) {
          await tx.preparationStepCategory.update({
            where: {
              id: categoryId,
            },
            data: {
              completed: true,
            },
          });
        }
      }

      return {
        completedTracks: totalTracks,
        totalTracks,
        stationCompleted: true,
      };
    });
  }
}
