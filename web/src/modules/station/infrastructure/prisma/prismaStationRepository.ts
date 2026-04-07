import prisma from "@/prisma";
import { Prisma } from "@/src/generated/prisma";
import type { TOrder, TOrderStatus } from "@/src/types/order";
import type { StationRepository, DayWindow } from "../../domain/station.repository";
import type {
  PreparationStep,
  PreparationStepCategory,
  PreparationStepTrack,
} from "../../domain/station.types";

class PrismaStationRepository implements StationRepository {
  async findPreparationSteps(): Promise<PreparationStep[]> {
    const preparationSteps = await prisma.preparationStep.findMany({
      include: { products: { select: { id: true } } },
    });

    return preparationSteps.map((item) => ({
      id: item.id,
      name: item.name,
      productIds: item.products.map((product) => product.id),
      stationId: item.stationId,
      includeComments: item.includeComments,
      includeModifiers: item.includeModifiers,
    }));
  }

  async findOrdersByStation(
    stationId: string,
    window: DayWindow,
  ): Promise<TOrder[]> {
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          {
            preparationStepCategories: {
              some: {
                preparationStepTracks: {
                  some: {
                    completed: false,
                    preparationStep: {
                      stationId,
                    },
                  },
                },
              },
            },
          },
          {
            createdAt: {
              gte: window.start,
              lt: window.end,
            },
          },
        ],
      },
      include: {
        customer: true,
        address: true,
        deliveryAddress: true,
        orderProducts: {
          include: {
            product: true,
          },
        },
        preparationStepCategories: {
          include: {
            category: true,
            preparationStepTracks: {
              include: {
                preparationStep: true,
                preparationStepModifierTracks: {
                  include: {
                    modifierGroupItem: true,
                  },
                },
              },
              where: {
                preparationStep: {
                  stationId,
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    const orderStatusById = new Map<string, TOrderStatus>();

    if (orders.length > 0) {
      const orderStatuses = await prisma.$queryRaw<
        { id: string; status: TOrderStatus }[]
      >`
        SELECT
          orders."id",
          CASE
            WHEN orders."deliveredAt" IS NOT NULL THEN 'DELIVERED'
            WHEN EXISTS (
              SELECT 1
              FROM "Dispatch" dispatch
              WHERE dispatch."id" = orders."dispatchId"
                AND dispatch."dispatched" = true
            ) THEN 'DELIVERING'
            WHEN EXISTS (
              SELECT 1
              FROM "PreparationStepCategory" preparationStepCategory
              INNER JOIN "PreparationStepTrack" preparationStepTrack
                ON preparationStepTrack."preparationStepCategoryId" = preparationStepCategory."id"
              WHERE preparationStepCategory."orderId" = orders."id"
                AND preparationStepTrack."completed" = true
            ) THEN 'PREPARING'
            ELSE 'ACCEPTED'
          END AS "status"
        FROM "Order" orders
        WHERE orders."id" IN (${Prisma.join(orders.map((order) => order.id))})
      `;

      for (const orderStatus of orderStatuses) {
        orderStatusById.set(orderStatus.id, orderStatus.status);
      }
    }

    return orders
      .map((order): TOrder | null => {
        const isToday =
          order.createdAt >= window.start && order.createdAt < window.end;

        const categories: PreparationStepCategory[] =
          order.preparationStepCategories
            .map((category): PreparationStepCategory | null => {
              const relevantTracks = category.preparationStepTracks.filter(
                (track) => isToday || !track.completed,
              );

              const steps: PreparationStepTrack[] = relevantTracks.map(
                (track) => ({
                  id: track.id,
                  name: track.preparationStep.name,
                  quantity: track.quantity || 1,
                  completed: track.completed,
                  preparationStepId: track.preparationStepId,
                  preparationStepCategoryId: track.preparationStepCategoryId,
                  comments: track.comments || undefined,
                  completedComments: track.completedComments,
                  preparationStepModifiers:
                    track.preparationStepModifierTracks.map((item) => ({
                      id: item.id,
                      completed: item.completed,
                      modifierGroupItem: item.modifierGroupItemId,
                      modifierGtroupItem: {
                        id: item.modifierGroupItem.id,
                        name: item.modifierGroupItem.name,
                        price: item.modifierGroupItem.price,
                        description:
                          item.modifierGroupItem.description || undefined,
                      },
                    })),
                }),
              );

              if (steps.length === 0) return null;
              if (!category.categoryId || !category.category) return null;

              return {
                id: category.id,
                categoryId: category.categoryId,
                completed: category.completed,
                orderId: category.orderId,
                snoozes: [],
                category: {
                  id: category.category.id,
                  products: [],
                  title: category.category.name,
                },
                steps,
              };
            })
            .filter(Boolean) as PreparationStepCategory[];

        if (categories.length === 0) return null;

        return {
          id: order.id,
          createdAt: order.createdAt.toISOString(),
          number: order.number ?? undefined,
          status: orderStatusById.get(order.id) ?? "ACCEPTED",
          type: order.type,
          paymentMethod: order.paymentMethod,
          addressId: order.addressId ?? undefined,
          customer: {
            id: order.customer.id,
            name: order.customer.name,
          },
          orderProducts: order.orderProducts.map((item) => ({
            id: item.id,
            productId: item.productId,
            product: item.product
              ? {
                  id: item.product.id,
                  name: item.product.name,
                  categoryId: item.product.categoryId ?? undefined,
                  description: item.product.description ?? undefined,
                  price: item.product.price,
                  comparedAtPrice: item.product.comparedAtPrice,
                  translations:
                    item.product.translations &&
                    typeof item.product.translations === "object"
                      ? (item.product.translations as {
                          [key: string]: {
                            [key: string]: unknown;
                          };
                        })
                      : undefined,
                }
              : undefined,
            amount: item.amount,
            fullAmount: item.fullAmount,
            quantity: item.quantity,
          })),
          preparationStepCategory: categories,
        };
      })
      .filter(Boolean) as TOrder[];
  }

  async createPreparationStepCategories(
    categories: PreparationStepCategory[],
  ): Promise<void> {
    for (const category of categories) {
      await prisma.preparationStepCategory.create({
        data: {
          id: category.id,
          categoryId: category.categoryId,
          orderId: category.orderId,
          preparationStepTracks: {
            create: category.steps.map((track) => ({
              id: track.id,
              preparationStepId: track.preparationStepId,
              quantity: track.quantity,
              comments: track.comments,
              completedComments: track.completedComments,
              preparationStepModifierTracks: track.preparationStepModifiers
                ? {
                    createMany: {
                      data: track.preparationStepModifiers.map((item) => ({
                        id: item.id,
                        completed: item.completed,
                        modifierGroupItemId: item.modifierGroupItem,
                      })),
                    },
                  }
                : undefined,
            })),
          },
        },
      });
    }
  }

  async updatePreparationStepCategory(
    category: PreparationStepCategory,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const step of category.steps) {
        await tx.preparationStepTrack.update({
          where: {
            id: step.id,
          },
          data: {
            quantity: step.quantity,
            comments: step.comments,
            ...(typeof step.completed === "boolean"
              ? { completed: step.completed }
              : {}),
            ...(typeof step.completedComments === "boolean"
              ? { completedComments: step.completedComments }
              : {}),
          },
        });

        if (!step.preparationStepModifiers?.length) continue;

        for (const modifier of step.preparationStepModifiers) {
          await tx.preparationStepModifierTrack.update({
            where: {
              id: modifier.id,
            },
            data: {
              ...(typeof modifier.completed === "boolean"
                ? { completed: modifier.completed }
                : {}),
            },
          });
        }
      }

      await tx.preparationStepCategory.update({
        where: {
          id: category.id,
        },
        data: {
          ...(typeof category.completed === "boolean"
            ? { completed: category.completed }
            : {}),
        },
      });
    });
  }

  async markPreparationCategoryAsCompleted(categoryId: string): Promise<void> {
    await prisma.$transaction([
      prisma.preparationStepModifierTrack.updateMany({
        where: {
          preparationStepTrack: {
            preparationStepCategoryId: categoryId,
          },
        },
        data: {
          completed: true,
        },
      }),
      prisma.preparationStepTrack.updateMany({
        where: {
          preparationStepCategoryId: categoryId,
        },
        data: {
          completed: true,
        },
      }),
      prisma.preparationStepCategory.update({
        where: {
          id: categoryId,
        },
        data: {
          completed: true,
        },
      }),
    ]);
  }
}

export const prismaStationRepository = new PrismaStationRepository();
