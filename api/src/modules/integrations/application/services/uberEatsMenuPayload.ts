import { createHash } from "node:crypto";
import prisma from "../../../../prisma.js";

export type UberMenuSyncPayload = {
  menus: Array<{
    categories: Array<{
      id: string;
      items: Array<{
        id: string;
        modifierGroups: Array<{
          id: string;
          maxPermitted: number;
          minPermitted: number;
          options: Array<{
            id: string;
            priceInfo: { amount: number; currencyCode: "USD" };
            title: { translations: { en_us: string } };
          }>;
          title: { translations: { en_us: string } };
        }>;
        priceInfo: { amount: number; currencyCode: "USD" } | null;
        suspensionInfo: { suspended: boolean };
        title: { translations: { en_us: string } };
      }>;
      title: { translations: { en_us: string } };
    }>;
    id: string;
    title: { translations: { en_us: string } };
  }>;
};

export type UberMenuItemSnapshot = {
  categoryId: string;
  hash: string;
  id: string;
  name: string;
  visible: boolean;
};

export type BuiltUberMenuPayload = {
  counts: {
    categoriesCount: number;
    itemsCount: number;
    modifierGroupsCount: number;
    modifierItemsCount: number;
  };
  hash: string;
  itemSnapshots: UberMenuItemSnapshot[];
  payload: UberMenuSyncPayload;
};

export async function buildUberMenuPayload(
  menuId: string,
): Promise<BuiltUberMenuPayload> {
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
    select: {
      id: true,
      name: true,
      menuCategories: {
        select: {
          menuIndex: true,
          category: {
            select: {
              id: true,
              name: true,
              productCategories: {
                select: {
                  categoryIndex: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      visible: true,
                      price: true,
                      modifierGroups: {
                        select: {
                          id: true,
                          title: true,
                          required: true,
                          minSelection: true,
                          maxSelection: true,
                          items: {
                            select: {
                              id: true,
                              name: true,
                              price: true,
                            },
                            orderBy: {
                              createdAt: "asc",
                            },
                          },
                        },
                        orderBy: {
                          createdAt: "asc",
                        },
                      },
                    },
                  },
                },
                orderBy: {
                  categoryIndex: "asc",
                },
              },
            },
          },
        },
        orderBy: {
          menuIndex: "asc",
        },
      },
    },
  });

  if (!menu) {
    throw new Error("MENU_NOT_FOUND");
  }

  const itemSnapshots: UberMenuItemSnapshot[] = [];

  const payload: UberMenuSyncPayload = {
    menus: [
      {
        id: menu.id,
        title: { translations: { en_us: menu.name } },
        categories: menu.menuCategories.map((entry) => ({
          id: entry.category.id,
          title: { translations: { en_us: entry.category.name } },
          items: entry.category.productCategories.map((pc) => {
            const itemPayload = {
              id: pc.product.id,
              title: { translations: { en_us: pc.product.name } },
              priceInfo:
                typeof pc.product.price === "number"
                  ? { amount: pc.product.price, currencyCode: "USD" as const }
                  : null,
              suspensionInfo: { suspended: !pc.product.visible },
              modifierGroups: pc.product.modifierGroups.map((group) => ({
                id: group.id,
                title: { translations: { en_us: group.title } },
                minPermitted: group.required
                  ? Math.max(group.minSelection ?? 1, 1)
                  : (group.minSelection ?? 0),
                maxPermitted:
                  typeof group.maxSelection === "number"
                    ? group.maxSelection
                    : Math.max(group.minSelection ?? 1, 1),
                options: group.items.map((item) => ({
                  id: item.id,
                  title: { translations: { en_us: item.name } },
                  priceInfo: {
                    amount: item.price,
                    currencyCode: "USD" as const,
                  },
                })),
              })),
            };

            itemSnapshots.push({
              id: pc.product.id,
              name: pc.product.name,
              visible: pc.product.visible,
              categoryId: entry.category.id,
              hash: createHash("sha256")
                .update(JSON.stringify(itemPayload))
                .digest("hex"),
            });

            return itemPayload;
          }),
        })),
      },
    ],
  };

  const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");

  return {
    payload,
    hash,
    counts: extractCounts(payload),
    itemSnapshots,
  };
}

function extractCounts(payload: UberMenuSyncPayload) {
  const categoriesCount = payload.menus.reduce(
    (acc, menu) => acc + menu.categories.length,
    0,
  );
  const items = payload.menus.flatMap((menu) =>
    menu.categories.flatMap((category) => category.items),
  );
  const itemsCount = items.length;
  const modifierGroupsCount = items.reduce(
    (acc, item) => acc + item.modifierGroups.length,
    0,
  );
  const modifierItemsCount = items.reduce(
    (acc, item) =>
      acc +
      item.modifierGroups.reduce(
        (groupAcc, group) => groupAcc + group.options.length,
        0,
      ),
    0,
  );

  return {
    categoriesCount,
    itemsCount,
    modifierGroupsCount,
    modifierItemsCount,
  };
}
