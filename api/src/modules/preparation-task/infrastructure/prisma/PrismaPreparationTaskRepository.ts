import prisma from "../../../../prisma.js";
import type {
  CreatePreparationTaskStationInput,
  CreatePreparationTaskInput,
  PreparationTaskStationItem,
  PreparationTaskItem,
  PreparationTaskRepository,
  UpdatePreparationTaskStationInput,
  UpdatePreparationTaskInput,
} from "../../application/ports/PreparationTaskRepository.js";

function mapCategoryRow(row: {
  completed: boolean;
  createdAt: Date;
  id: string;
  orderId: string;
  station: {
    id: string;
    name: string;
  } | null;
}): PreparationTaskStationItem {
  return {
    id: row.id,
    orderId: row.orderId,
    completed: row.completed,
    createdAt: row.createdAt.toISOString(),
    station: {
      id: row.station?.id ?? "",
      name: row.station?.name ?? "Unknown station",
    },
  };
}

function mapTaskRow(row: {
  comments: string | null;
  completed: boolean;
  completedAt: Date | null;
  completedComments: boolean;
  createdAt: Date;
  expectedAt: Date | null;
  goalMinutes: number;
  id: string;
  preparationStep: {
    name: string;
    stationId: string;
  };
  preparationStepCategory: {
    orderId: string;
  };
  preparationStepCategoryId: string;
  preparationStepId: string;
  preparationStepModifierTracks: Array<{
    completed: boolean;
    id: string;
    modifierGroupItem: {
      description: string | null;
      id: string;
      name: string;
      photo: {
        id: string;
        url: string;
      } | null;
      price: number;
      translations: unknown;
    };
    modifierGroupItemId: string;
  }>;
  quantity: number | null;
}): PreparationTaskItem {
  return {
    id: row.id,
    name: row.preparationStep.name,
    quantity: row.quantity,
    completed: row.completed,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    comments: row.comments ?? undefined,
    completedComments: row.completedComments,
    goalMinutes: row.goalMinutes,
    expectedAt: row.expectedAt ? row.expectedAt.toISOString() : null,
    preparationStepId: row.preparationStepId,
    preparationTaskStationId: row.preparationStepCategoryId,
    orderId: row.preparationStepCategory.orderId,
    stationId: row.preparationStep.stationId,
    createdAt: row.createdAt.toISOString(),
    modifiers: row.preparationStepModifierTracks.map((modifierTrack) => ({
      id: modifierTrack.id,
      completed: modifierTrack.completed,
      modifierGroupItemId: modifierTrack.modifierGroupItemId,
      modifierGroupItem: {
        id: modifierTrack.modifierGroupItem.id,
        name: modifierTrack.modifierGroupItem.name,
        price: modifierTrack.modifierGroupItem.price,
        description: modifierTrack.modifierGroupItem.description ?? undefined,
        ...(modifierTrack.modifierGroupItem.photo
          ? {
              photo: {
                id: modifierTrack.modifierGroupItem.photo.id,
                url: modifierTrack.modifierGroupItem.photo.url,
              },
            }
          : {}),
        ...(modifierTrack.modifierGroupItem.translations &&
        typeof modifierTrack.modifierGroupItem.translations === "object"
          ? {
              translations: modifierTrack.modifierGroupItem.translations as Record<
                string,
                Record<string, string>
              >,
            }
          : {}),
      },
    })),
  };
}

async function recomputeCategoryCompleted(categoryId: string): Promise<void> {
  const pendingCount = await prisma.preparationStepTrack.count({
    where: {
      preparationStepCategoryId: categoryId,
      completed: false,
    },
  });

  await prisma.preparationStepCategory.update({
    where: { id: categoryId },
    data: { completed: pendingCount === 0 },
  });
}

export class PrismaPreparationTaskRepository implements PreparationTaskRepository {
  async listCategories(filter: {
    completed?: boolean;
    orderId?: string;
    stationId?: string;
  }): Promise<PreparationTaskStationItem[]> {
    const rows = await prisma.preparationStepCategory.findMany({
      where: {
        ...(filter.completed !== undefined ? { completed: filter.completed } : {}),
        ...(filter.orderId ? { orderId: filter.orderId } : {}),
        ...(filter.stationId ? { stationId: filter.stationId } : {}),
      },
      select: {
        id: true,
        createdAt: true,
        orderId: true,
        completed: true,
        station: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return rows.map(mapCategoryRow);
  }

  async findCategoryById(id: string): Promise<PreparationTaskStationItem | null> {
    const row = await prisma.preparationStepCategory.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        orderId: true,
        completed: true,
        station: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!row) return null;
    return mapCategoryRow(row);
  }

  async createCategory(
    input: CreatePreparationTaskStationInput,
  ): Promise<PreparationTaskStationItem> {
    const row = await prisma.preparationStepCategory.create({
      data: {
        id: input.id,
        orderId: input.orderId,
        stationId: input.stationId,
        completed: input.completed ?? false,
      },
      select: {
        id: true,
        createdAt: true,
        orderId: true,
        completed: true,
        station: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return mapCategoryRow(row);
  }

  async updateCategory(
    input: UpdatePreparationTaskStationInput,
  ): Promise<PreparationTaskStationItem | null> {
    try {
      const row = await prisma.$transaction(async (tx) => {
        const updated = await tx.preparationStepCategory.update({
          where: { id: input.id },
          data: {
            ...(input.stationId !== undefined ? { stationId: input.stationId } : {}),
            ...(input.completed !== undefined ? { completed: input.completed } : {}),
          },
          select: {
            id: true,
            createdAt: true,
            orderId: true,
            completed: true,
            station: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        if (input.completed === true) {
          const completedAt = new Date();
          await tx.preparationStepTrack.updateMany({
            where: { preparationStepCategoryId: input.id },
            data: {
              completed: true,
              completedComments: true,
              completedAt,
            },
          });
          await tx.preparationStepModifierTrack.updateMany({
            where: {
              preparationStepTrack: {
                preparationStepCategoryId: input.id,
              },
            },
            data: { completed: true },
          });
        }

        return updated;
      });

      return mapCategoryRow(row);
    } catch {
      return null;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    try {
      await prisma.preparationStepCategory.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async listTasks(filter: {
    completed?: boolean;
    orderId?: string;
    preparationTaskStationId?: string;
    stationId?: string;
  }): Promise<PreparationTaskItem[]> {
    const rows = await prisma.preparationStepTrack.findMany({
      where: {
        ...(filter.completed !== undefined ? { completed: filter.completed } : {}),
        ...(filter.preparationTaskStationId
          ? { preparationStepCategoryId: filter.preparationTaskStationId }
          : {}),
        ...(filter.orderId
          ? {
              preparationStepCategory: {
                orderId: filter.orderId,
              },
            }
          : {}),
        ...(filter.stationId
          ? {
              preparationStep: {
                stationId: filter.stationId,
              },
            }
          : {}),
      },
      include: {
        preparationStep: {
          select: {
            name: true,
            stationId: true,
          },
        },
        preparationStepCategory: {
          select: {
            orderId: true,
          },
        },
        preparationStepModifierTracks: {
          include: {
            modifierGroupItem: {
              include: {
                photo: {
                  select: {
                    id: true,
                    url: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return rows.map(mapTaskRow);
  }

  async findTaskById(id: string): Promise<PreparationTaskItem | null> {
    const row = await prisma.preparationStepTrack.findUnique({
      where: { id },
      include: {
        preparationStep: {
          select: {
            name: true,
            stationId: true,
          },
        },
        preparationStepCategory: {
          select: {
            orderId: true,
          },
        },
        preparationStepModifierTracks: {
          include: {
            modifierGroupItem: {
              include: {
                photo: {
                  select: {
                    id: true,
                    url: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!row) return null;
    return mapTaskRow(row);
  }

  async createTask(input: CreatePreparationTaskInput): Promise<PreparationTaskItem> {
    const row = await prisma.$transaction(async (tx) => {
      const step = await tx.preparationStep.findUnique({
        where: { id: input.preparationStepId },
        select: { stationId: true },
      });
      if (!step) {
        throw new Error("PREPARATION_STEP_NOT_FOUND");
      }

      const category = await tx.preparationStepCategory.findUnique({
        where: { id: input.preparationTaskStationId },
        select: { id: true, stationId: true },
      });
      if (!category) {
        throw new Error("PREPARATION_TASK_CATEGORY_NOT_FOUND");
      }

      if (!category.stationId) {
        await tx.preparationStepCategory.update({
          where: { id: category.id },
          data: { stationId: step.stationId },
        });
      }

      const created = await tx.preparationStepTrack.create({
        data: {
          id: input.id,
          preparationStepCategoryId: input.preparationTaskStationId,
          preparationStepId: input.preparationStepId,
          quantity: input.quantity ?? null,
          comments: input.comments ?? null,
          completed: input.completed ?? false,
          completedAt: input.completed ? new Date() : null,
          completedComments: input.completedComments ?? false,
          goalMinutes: input.goalMinutes ?? 0,
          expectedAt: input.expectedAt ? new Date(input.expectedAt) : null,
          preparationStepModifierTracks: input.modifiers?.length
            ? {
                createMany: {
                  data: input.modifiers.map((modifier) => ({
                    id: modifier.id,
                    modifierGroupItemId: modifier.modifierGroupItemId,
                    completed: modifier.completed ?? false,
                  })),
                },
              }
            : undefined,
        },
        include: {
          preparationStep: {
            select: {
              name: true,
              stationId: true,
            },
          },
          preparationStepCategory: {
            select: {
              orderId: true,
            },
          },
          preparationStepModifierTracks: {
            include: {
              modifierGroupItem: {
                include: {
                  photo: {
                    select: {
                      id: true,
                      url: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      return created;
    });

    await recomputeCategoryCompleted(input.preparationTaskStationId);
    return mapTaskRow(row);
  }

  async updateTask(input: UpdatePreparationTaskInput): Promise<PreparationTaskItem | null> {
    try {
      const row = await prisma.$transaction(async (tx) => {
        const current = await tx.preparationStepTrack.findUnique({
          where: { id: input.id },
          select: { preparationStepCategoryId: true },
        });
        if (!current) return null;

        const updated = await tx.preparationStepTrack.update({
          where: { id: input.id },
          data: {
            ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
            ...(input.comments !== undefined ? { comments: input.comments } : {}),
            ...(input.completed !== undefined
              ? {
                  completed: input.completed,
                  completedAt: input.completed ? new Date() : null,
                }
              : {}),
            ...(input.completedComments !== undefined
              ? { completedComments: input.completedComments }
              : {}),
            ...(input.goalMinutes !== undefined
              ? { goalMinutes: input.goalMinutes }
              : {}),
            ...(input.expectedAt !== undefined
              ? {
                  expectedAt: input.expectedAt ? new Date(input.expectedAt) : null,
                }
              : {}),
          },
          include: {
            preparationStep: {
              select: {
                name: true,
                stationId: true,
              },
            },
            preparationStepCategory: {
              select: {
                orderId: true,
              },
            },
            preparationStepModifierTracks: {
              include: {
                modifierGroupItem: {
                  include: {
                    photo: {
                      select: {
                        id: true,
                        url: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

        if (input.modifiers) {
          for (const modifier of input.modifiers) {
            await tx.preparationStepModifierTrack.upsert({
              where: { id: modifier.id },
              update: {
                ...(modifier.completed !== undefined
                  ? { completed: modifier.completed }
                  : {}),
                modifierGroupItemId: modifier.modifierGroupItemId,
              },
              create: {
                id: modifier.id,
                preparationStepTrackId: input.id,
                modifierGroupItemId: modifier.modifierGroupItemId,
                completed: modifier.completed ?? false,
              },
            });
          }
        }

        await recomputeCategoryCompleted(current.preparationStepCategoryId);

        return updated;
      });

      if (!row) return null;
      return mapTaskRow(row);
    } catch {
      return null;
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      const current = await prisma.preparationStepTrack.findUnique({
        where: { id },
        select: { preparationStepCategoryId: true },
      });
      if (!current) return false;

      await prisma.preparationStepTrack.delete({ where: { id } });
      await recomputeCategoryCompleted(current.preparationStepCategoryId);
      return true;
    } catch {
      return false;
    }
  }
}
