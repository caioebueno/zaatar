import prisma from "../../../../prisma.js";
import type { Prisma } from "../../../../../../web/src/generated/prisma/index.js";

type BuildSquareCatalogMenusInput = {
  activeOnly?: boolean;
  includeHiddenProducts?: boolean;
  menuIds?: string[];
};

type SquareMenuCountSummary = {
  categoriesCount: number;
  itemsCount: number;
  modifierGroupsCount: number;
  modifierItemsCount: number;
  objectCount: number;
};

export type BuiltSquareCatalogMenu = {
  counts: SquareMenuCountSummary;
  menuId: string;
  menuName: string;
};

export type SquareTrackedEntity =
  | {
      entityType: "MENU_ROOT";
      menuId: string;
      requestObjectId: string;
    }
  | {
      categoryId: string;
      entityType: "REGULAR_CATEGORY";
      menuId: string;
      requestObjectId: string;
    }
  | {
      categoryId: string;
      entityType: "MENU_CATEGORY";
      menuId: string;
      requestObjectId: string;
    }
  | {
      entityType: "PRODUCT_ITEM";
      productId: string;
      requestObjectId: string;
    }
  | {
      entityType: "PRODUCT_VARIATION";
      productId: string;
      requestObjectId: string;
    }
  | {
      entityType: "MODIFIER_GROUP";
      modifierGroupId: string;
      requestObjectId: string;
    }
  | {
      entityType: "MODIFIER_ITEM";
      modifierGroupItemId: string;
      requestObjectId: string;
    };

export type BuiltSquareCatalogMenus = {
  counts: SquareMenuCountSummary;
  menus: BuiltSquareCatalogMenu[];
  objects: unknown[];
  productImages: Array<{
    imageUrls: Array<{
      name: string;
      url: string;
    }>;
    productId: string;
    productName: string;
    requestObjectId: string;
    squareItemId: string | null;
  }>;
  trackedEntities: SquareTrackedEntity[];
};

type LoadedModifierGroup = {
  id: string;
  maxSelection: number | null;
  minSelection: number | null;
  required: boolean;
  squareModifierListId: string | null;
  squareModifierListVersion: string | null;
  title: string;
  type: "MULTI" | "SINGLE" | null;
  items: Array<{
    id: string;
    name: string;
    price: number;
    squareModifierId: string | null;
    squareModifierVersion: string | null;
  }>;
};

type MenuRootCollector = {
  menuId: string;
  menuName: string;
  requestObjectId: string;
  squareMenuId: string | null;
  squareMenuVersion: string | null;
};

type CategoryCollector = {
  categoryId: string;
  menuActive: boolean;
  menuId: string;
  menuIndex: number | null;
  menuRootRequestObjectId: string;
  regularCategoryRequestObjectId: string;
  requestObjectId: string;
  squareCategoryId: string | null;
  squareCategoryVersion: string | null;
  squareMenuCategoryId: string | null;
  squareMenuCategoryVersion: string | null;
  title: string;
};

type ProductCollector = {
  description: string | null;
  id: string;
  itemType: "PRODUCT" | "COMBO";
  modifierGroups: LoadedModifierGroup[];
  name: string;
  photos: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  price: number | null;
  requestObjectId: string;
  requestVariationObjectId: string;
  squareItemId: string | null;
  squareItemVersion: string | null;
  squareVariationId: string | null;
  squareVariationVersion: string | null;
  squareCategoryOrdinalsByKey: Map<string, number>;
  visible: boolean;
};

type ModifierGroupCollector = {
  group: LoadedModifierGroup;
  requestObjectId: string;
};

type ModifierItemCollector = {
  item: LoadedModifierGroup["items"][number];
  requestObjectId: string;
};

type SquareModifierListInfo = {
  allow_quantities: "NO" | "NOT_SET" | "YES";
  max_selected_modifiers: number;
  min_selected_modifiers: number;
  modifier_list_id: string;
};

export async function buildSquareCatalogMenus(
  input: BuildSquareCatalogMenusInput = {},
): Promise<BuiltSquareCatalogMenus> {
  const normalizedMenuIds = Array.isArray(input.menuIds)
    ? input.menuIds.map((menuId) => menuId.trim()).filter(Boolean)
    : [];

  const menuQuery = {
    where: {
      ...(input.activeOnly ? { active: true } : {}),
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      active: true,
      squareMenuId: true,
      squareMenuVersion: true,
      menuCategories: {
        orderBy: {
          menuIndex: "asc",
        },
        select: {
          menuId: true,
          categoryId: true,
          menuIndex: true,
          squareCategoryId: true,
          squareCategoryVersion: true,
          squareMenuCategoryId: true,
          squareMenuCategoryVersion: true,
          category: {
            select: {
              id: true,
              name: true,
              productCategories: {
                orderBy: [{ categoryIndex: "asc" }, { createdAt: "asc" }],
                select: {
                  categoryIndex: true,
                  createdAt: true,
                  product: {
                    select: {
                      id: true,
                      itemType: true,
                      name: true,
                      visible: true,
                      description: true,
                      price: true,
                      photos: {
                        orderBy: {
                          createdAt: "asc",
                        },
                        select: {
                          id: true,
                          name: true,
                          url: true,
                        },
                      },
                      squareItemId: true,
                      squareItemVersion: true,
                      squareVariationId: true,
                      squareVariationVersion: true,
                      modifierGroups: {
                        orderBy: {
                          createdAt: "asc",
                        },
                        select: {
                          id: true,
                          title: true,
                          required: true,
                          type: true,
                          minSelection: true,
                          maxSelection: true,
                          squareModifierListId: true,
                          squareModifierListVersion: true,
                          items: {
                            orderBy: {
                              createdAt: "asc",
                            },
                            select: {
                              id: true,
                              name: true,
                              price: true,
                              squareModifierId: true,
                              squareModifierVersion: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  } satisfies Prisma.MenuFindManyArgs;

  const menus = await prisma.menu.findMany(menuQuery);

  const targetMenuIds =
    normalizedMenuIds.length > 0
      ? new Set(normalizedMenuIds)
      : new Set(menus.map((menu) => menu.id));

  const targetProductIds = new Set<string>();
  const menuSummaries: BuiltSquareCatalogMenu[] = [];

  for (const menu of menus) {
    if (!targetMenuIds.has(menu.id)) {
      continue;
    }

    const uniqueProductIds = new Set<string>();
    const uniqueModifierGroupIds = new Set<string>();
    const uniqueModifierItemIds = new Set<string>();

    for (const menuCategory of menu.menuCategories) {
      for (const productCategory of menuCategory.category.productCategories) {
        const product = productCategory.product;
        if (!shouldSyncProduct(product.visible, product.squareItemId, input.includeHiddenProducts)) {
          continue;
        }

        uniqueProductIds.add(product.id);
        targetProductIds.add(product.id);

        for (const modifierGroup of product.modifierGroups) {
          uniqueModifierGroupIds.add(modifierGroup.id);

          for (const modifierItem of modifierGroup.items) {
            uniqueModifierItemIds.add(modifierItem.id);
          }
        }
      }
    }

    const counts = {
      categoriesCount: menu.menuCategories.length,
      itemsCount: uniqueProductIds.size,
      modifierGroupsCount: uniqueModifierGroupIds.size,
      modifierItemsCount: uniqueModifierItemIds.size,
      objectCount:
        1 +
        menu.menuCategories.length * 2 +
        uniqueProductIds.size * 2 +
        uniqueModifierGroupIds.size +
        uniqueModifierItemIds.size,
    };

    menuSummaries.push({
      menuId: menu.id,
      menuName: menu.name,
      counts,
    });
  }

  const menuRootsById = new Map<string, MenuRootCollector>();
  const categoriesByKey = new Map<string, CategoryCollector>();
  const productsById = new Map<string, ProductCollector>();
  const modifierGroupsById = new Map<string, ModifierGroupCollector>();
  const modifierItemsById = new Map<string, ModifierItemCollector>();

  for (const menu of menus) {
    if (!targetMenuIds.has(menu.id)) {
      continue;
    }

    if (!menuRootsById.has(menu.id)) {
      menuRootsById.set(menu.id, {
        menuId: menu.id,
        menuName: menu.name,
        squareMenuId: menu.squareMenuId,
        squareMenuVersion: menu.squareMenuVersion,
        requestObjectId: menu.squareMenuId ?? toSquareTempId("menu-root", "global", menu.id),
      });
    }

    for (const menuCategory of menu.menuCategories) {
      const categoryProducts = menuCategory.category.productCategories.filter((productCategory) =>
        targetProductIds.has(productCategory.product.id) &&
        shouldSyncProduct(
          productCategory.product.visible,
          productCategory.product.squareItemId,
          input.includeHiddenProducts,
        ),
      );

      let nextResolvedCategoryOrdinal = 0;

      const categoryKey = `${menuCategory.menuId}:${menuCategory.categoryId}`;
      if (!categoriesByKey.has(categoryKey)) {
        const menuRoot = menuRootsById.get(menu.id);
        if (!menuRoot) {
          continue;
        }

        categoriesByKey.set(categoryKey, {
          menuId: menuCategory.menuId,
          categoryId: menuCategory.categoryId,
          menuIndex: menuCategory.menuIndex,
          menuRootRequestObjectId: menuRoot.requestObjectId,
          regularCategoryRequestObjectId:
            menuCategory.squareCategoryId ??
            toSquareTempId("regular-category", menuCategory.menuId, menuCategory.categoryId),
          title: menuCategory.category.name,
          menuActive: menu.active,
          squareCategoryId: menuCategory.squareCategoryId,
          squareCategoryVersion: menuCategory.squareCategoryVersion,
          squareMenuCategoryId: menuCategory.squareMenuCategoryId,
          squareMenuCategoryVersion: menuCategory.squareMenuCategoryVersion,
          requestObjectId:
            menuCategory.squareMenuCategoryId ??
            toSquareTempId("menu-category", menuCategory.menuId, menuCategory.categoryId),
        });
      }

      for (const productCategory of categoryProducts) {
        const { product } = productCategory;
        const requestedCategoryOrdinal =
          productCategory.categoryIndex ?? nextResolvedCategoryOrdinal;
        const resolvedCategoryOrdinal = Math.max(
          requestedCategoryOrdinal,
          nextResolvedCategoryOrdinal,
        );
        nextResolvedCategoryOrdinal = resolvedCategoryOrdinal + 1;

        let productCollector = productsById.get(product.id);

        if (!productCollector) {
          productCollector = {
            id: product.id,
            itemType: product.itemType,
            name: product.name,
            visible: product.visible,
            description: product.description,
            price: product.price,
            photos: product.photos.map((photo) => ({
              id: photo.id,
              name: photo.name,
              url: photo.url,
            })),
            modifierGroups: product.modifierGroups.map((group) => ({
              id: group.id,
              title: group.title,
              required: group.required,
              type: group.type,
              minSelection: group.minSelection,
              maxSelection: group.maxSelection,
              squareModifierListId: group.squareModifierListId,
              squareModifierListVersion: group.squareModifierListVersion,
              items: group.items.map((item) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                squareModifierId: item.squareModifierId,
                squareModifierVersion: item.squareModifierVersion,
              })),
            })),
            squareItemId: product.squareItemId,
            squareItemVersion: product.squareItemVersion,
            squareVariationId: product.squareVariationId,
            squareVariationVersion: product.squareVariationVersion,
            requestObjectId:
              product.squareItemId ?? toSquareTempId("item", "global", product.id),
            requestVariationObjectId:
              product.squareVariationId ??
              toSquareTempId("variation", "global", product.id),
            squareCategoryOrdinalsByKey: new Map<string, number>(),
          };
          productsById.set(product.id, productCollector);
        }

        if (!productCollector) {
          continue;
        }

        const currentCategoryOrdinal =
          productCollector.squareCategoryOrdinalsByKey.get(categoryKey);

        if (
          currentCategoryOrdinal === undefined ||
          resolvedCategoryOrdinal < currentCategoryOrdinal
        ) {
          productCollector.squareCategoryOrdinalsByKey.set(
            categoryKey,
            resolvedCategoryOrdinal,
          );
        }
      }
    }
  }

  for (const product of productsById.values()) {
    for (const group of product.modifierGroups) {
      if (!modifierGroupsById.has(group.id)) {
        modifierGroupsById.set(group.id, {
          group,
          requestObjectId:
            group.squareModifierListId ??
            toSquareTempId("modifier-group", "global", group.id),
        });
      }

      for (const item of group.items) {
        if (!modifierItemsById.has(item.id)) {
          modifierItemsById.set(item.id, {
            item,
            requestObjectId:
              item.squareModifierId ?? toSquareTempId("modifier-item", "global", item.id),
          });
        }
      }
    }
  }

  const trackedEntities: SquareTrackedEntity[] = [];
  const objects: unknown[] = [];

  const sortedMenuRoots = Array.from(menuRootsById.values()).sort((left, right) =>
    left.requestObjectId.localeCompare(right.requestObjectId),
  );

  for (const menuRoot of sortedMenuRoots) {
    objects.push({
      id: menuRoot.requestObjectId,
      type: "CATEGORY",
      present_at_all_locations: true,
      ...(parseSquareVersion(menuRoot.squareMenuVersion) !== undefined
        ? { version: parseSquareVersion(menuRoot.squareMenuVersion) }
        : {}),
      category_data: {
        name: menuRoot.menuName,
        category_type: "MENU_CATEGORY",
      },
    });

    trackedEntities.push({
      entityType: "MENU_ROOT",
      menuId: menuRoot.menuId,
      requestObjectId: menuRoot.requestObjectId,
    });
  }

  const sortedCategories = Array.from(categoriesByKey.values()).sort((left, right) => {
    if (left.menuId !== right.menuId) {
      return left.menuId.localeCompare(right.menuId);
    }

    if ((left.menuIndex ?? Number.MAX_SAFE_INTEGER) !== (right.menuIndex ?? Number.MAX_SAFE_INTEGER)) {
      return (left.menuIndex ?? Number.MAX_SAFE_INTEGER) - (right.menuIndex ?? Number.MAX_SAFE_INTEGER);
    }

    return left.requestObjectId.localeCompare(right.requestObjectId);
  });

  const categoryOrdinalByKey = new Map<string, number>();

  for (const category of sortedCategories) {
    const siblingKey = category.menuId;
    categoryOrdinalByKey.set(siblingKey, (categoryOrdinalByKey.get(siblingKey) ?? 0) + 1);
    const ordinal = (categoryOrdinalByKey.get(siblingKey) ?? 1) - 1;

    objects.push({
      id: category.requestObjectId,
      type: "CATEGORY",
      present_at_all_locations: true,
      ...(parseSquareVersion(category.squareMenuCategoryVersion) !== undefined
        ? { version: parseSquareVersion(category.squareMenuCategoryVersion) }
        : {}),
      category_data: {
        name: category.title,
        category_type: "MENU_CATEGORY",
        parent_category: {
          id: category.menuRootRequestObjectId,
          ordinal,
        },
      },
    });

    trackedEntities.push({
      entityType: "MENU_CATEGORY",
      menuId: category.menuId,
      categoryId: category.categoryId,
      requestObjectId: category.requestObjectId,
    });
  }

  const sortedRegularCategories = Array.from(categoriesByKey.values()).sort((left, right) => {
    if (left.menuId !== right.menuId) {
      return left.menuId.localeCompare(right.menuId);
    }

    if (
      (left.menuIndex ?? Number.MAX_SAFE_INTEGER) !==
      (right.menuIndex ?? Number.MAX_SAFE_INTEGER)
    ) {
      return (
        (left.menuIndex ?? Number.MAX_SAFE_INTEGER) -
        (right.menuIndex ?? Number.MAX_SAFE_INTEGER)
      );
    }

    return left.regularCategoryRequestObjectId.localeCompare(
      right.regularCategoryRequestObjectId,
    );
  });

  for (const category of sortedRegularCategories) {
    objects.push({
      id: category.regularCategoryRequestObjectId,
      type: "CATEGORY",
      present_at_all_locations: true,
      ...(parseSquareVersion(category.squareCategoryVersion) !== undefined
        ? { version: parseSquareVersion(category.squareCategoryVersion) }
        : {}),
      category_data: {
        name: category.title,
        category_type: "REGULAR_CATEGORY",
      },
    });

    trackedEntities.push({
      entityType: "REGULAR_CATEGORY",
      menuId: category.menuId,
      categoryId: category.categoryId,
      requestObjectId: category.regularCategoryRequestObjectId,
    });
  }

  const sortedModifierGroups = Array.from(modifierGroupsById.values()).sort((left, right) =>
    left.requestObjectId.localeCompare(right.requestObjectId),
  );

  for (const modifierGroup of sortedModifierGroups) {
    const modifierObjects = modifierGroup.group.items.map((item, index) => {
      const trackedModifierItem = modifierItemsById.get(item.id);
      const requestObjectId =
        trackedModifierItem?.requestObjectId ??
        toSquareTempId("modifier-item", "global", item.id);

      if (trackedModifierItem) {
        trackedEntities.push({
          entityType: "MODIFIER_ITEM",
          modifierGroupItemId: item.id,
          requestObjectId,
        });
      }

      return {
        id: requestObjectId,
        type: "MODIFIER",
        ...(parseSquareVersion(item.squareModifierVersion) !== undefined
          ? { version: parseSquareVersion(item.squareModifierVersion) }
          : {}),
        modifier_data: {
          modifier_list_id: modifierGroup.requestObjectId,
          name: item.name,
          ordinal: index,
          price_money: {
            amount: item.price,
            currency: "USD",
          },
        },
      };
    });

    objects.push({
      id: modifierGroup.requestObjectId,
      type: "MODIFIER_LIST",
      ...(parseSquareVersion(modifierGroup.group.squareModifierListVersion) !== undefined
        ? { version: parseSquareVersion(modifierGroup.group.squareModifierListVersion) }
        : {}),
      modifier_list_data: {
        allow_quantities: getSquareModifierAllowQuantities(modifierGroup.group),
        max_selected_modifiers: getSquareModifierMaxSelection(modifierGroup.group),
        min_selected_modifiers: getSquareModifierMinSelection(modifierGroup.group),
        name: modifierGroup.group.title,
        selection_type: getSquareModifierSelectionType(modifierGroup.group),
        modifiers: modifierObjects,
      },
    });

    trackedEntities.push({
      entityType: "MODIFIER_GROUP",
      modifierGroupId: modifierGroup.group.id,
      requestObjectId: modifierGroup.requestObjectId,
    });
  }

  const sortedProducts = Array.from(productsById.values()).sort((left, right) =>
    left.requestObjectId.localeCompare(right.requestObjectId),
  );

  for (const product of sortedProducts) {
    const categoryRefs = dedupeBy(
      Array.from(product.squareCategoryOrdinalsByKey.keys())
        .map((key) => categoriesByKey.get(key))
        .filter((value): value is CategoryCollector => Boolean(value)),
      (category) => category.requestObjectId,
    );
    const itemCategories = categoryRefs.map((category) => {
      const matchingOrdinals = Array.from(product.squareCategoryOrdinalsByKey.entries())
        .filter(([key]) => {
          const matchingCategory = categoriesByKey.get(key);
          return matchingCategory?.requestObjectId === category.requestObjectId;
        })
        .map(([, ordinal]) => ordinal);

      return {
        id: category.requestObjectId,
        ordinal: Math.min(...matchingOrdinals),
      };
    });
    const reportingCategory = categoryRefs[0]
      ? {
          id: categoryRefs[0].regularCategoryRequestObjectId,
          ordinal: itemCategories.find((entry) => entry.id === categoryRefs[0].requestObjectId)
            ?.ordinal ?? 0,
        }
      : null;

    const itemPresentAtAllLocations =
      product.visible && categoryRefs.some((category) => category.menuActive);

    const modifierListInfo = product.modifierGroups
      .map((group) => {
        const trackedGroup = modifierGroupsById.get(group.id);
        if (!trackedGroup) {
          return null;
        }

        return {
          allow_quantities: getSquareModifierAllowQuantitiesOverride(group),
          modifier_list_id: trackedGroup.requestObjectId,
          min_selected_modifiers: getSquareModifierMinSelection(group),
          max_selected_modifiers: getSquareModifierMaxSelection(group),
        } satisfies SquareModifierListInfo;
      })
      .filter((value): value is SquareModifierListInfo => value !== null);

    objects.push({
      id: product.requestObjectId,
      type: "ITEM",
      is_archived: false,
      present_at_all_locations: itemPresentAtAllLocations,
      ...(parseSquareVersion(product.squareItemVersion) !== undefined
        ? { version: parseSquareVersion(product.squareItemVersion) }
        : {}),
      item_data: {
        name: product.name,
        ...(product.description ? { description: product.description } : {}),
        product_type: "REGULAR",
        skip_modifier_screen: modifierListInfo.length === 0,
        ...(itemCategories.length > 0
          ? {
              categories: itemCategories,
            }
          : {}),
        ...(reportingCategory
          ? {
              reporting_category: reportingCategory,
            }
          : {}),
        ...(modifierListInfo.length > 0
          ? {
              modifier_list_info: modifierListInfo,
            }
          : {}),
        variations: [
          {
            id: product.requestVariationObjectId,
            type: "ITEM_VARIATION",
            present_at_all_locations: itemPresentAtAllLocations,
            ...(parseSquareVersion(product.squareVariationVersion) !== undefined
              ? { version: parseSquareVersion(product.squareVariationVersion) }
              : {}),
            item_variation_data: {
              name: product.itemType === "COMBO" ? "Combo" : "Regular",
              pricing_type:
                typeof product.price === "number"
                  ? "FIXED_PRICING"
                  : "VARIABLE_PRICING",
              ...(typeof product.price === "number"
                ? {
                    price_money: {
                      amount: product.price,
                      currency: "USD",
                    },
                  }
                : {}),
            },
          },
        ],
      },
    });

    trackedEntities.push({
      entityType: "PRODUCT_ITEM",
      productId: product.id,
      requestObjectId: product.requestObjectId,
    });
    trackedEntities.push({
      entityType: "PRODUCT_VARIATION",
      productId: product.id,
      requestObjectId: product.requestVariationObjectId,
    });
  }

  const counts = {
    categoriesCount: categoriesByKey.size,
    itemsCount: productsById.size,
    modifierGroupsCount: modifierGroupsById.size,
    modifierItemsCount: modifierItemsById.size,
    objectCount:
      menuRootsById.size +
      categoriesByKey.size * 2 +
      productsById.size * 2 +
      modifierGroupsById.size +
      modifierItemsById.size,
  };

  return {
    counts,
    menus: menuSummaries,
    objects,
    productImages: sortedProducts
      .filter((product) => product.photos.length > 0)
      .map((product) => ({
        productId: product.id,
        productName: product.name,
        requestObjectId: product.requestObjectId,
        squareItemId: product.squareItemId,
        imageUrls: product.photos.map((photo) => ({
          name: photo.name,
          url: photo.url,
        })),
      })),
    trackedEntities: dedupeTrackedEntities(trackedEntities),
  };
}

function dedupeTrackedEntities(
  entities: SquareTrackedEntity[],
): SquareTrackedEntity[] {
  const seen = new Set<string>();
  const output: SquareTrackedEntity[] = [];

  for (const entity of entities) {
    const key = `${entity.entityType}:${entity.requestObjectId}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(entity);
  }

  return output;
}

function getSquareModifierMinSelection(group: LoadedModifierGroup): number {
  const minSelection = group.required
    ? Math.max(group.minSelection ?? 1, 1)
    : Math.max(group.minSelection ?? 0, 0);

  if (group.type === "SINGLE") {
    return Math.min(minSelection, 1);
  }

  return minSelection;
}

function getSquareModifierMaxSelection(group: LoadedModifierGroup): number {
  if (group.type === "SINGLE") {
    return 1;
  }

  const minSelection = getSquareModifierMinSelection(group);
  const defaultMaxSelection = 0;
  const maxSelection = group.maxSelection ?? defaultMaxSelection;

  if (maxSelection === 0) {
    return 0;
  }

  return Math.max(maxSelection, minSelection);
}

function getSquareModifierAllowQuantities(_group: LoadedModifierGroup): boolean {
  // Foody stores selected modifier item IDs only once, so repeated quantities of
  // the same modifier can't be represented safely in orders.
  return false;
}

function getSquareModifierAllowQuantitiesOverride(
  _group: LoadedModifierGroup,
): "NO" | "NOT_SET" | "YES" {
  // Foody doesn't support item-specific quantity overrides, so inherit from the
  // modifier list setting instead of forcing a per-item override in Square.
  return "NOT_SET";
}

function getSquareModifierSelectionType(
  group: LoadedModifierGroup,
): "MULTIPLE" | "SINGLE" {
  if (group.type === "SINGLE") {
    return "SINGLE";
  }

  if (group.type === "MULTI") {
    return "MULTIPLE";
  }

  return getSquareModifierMaxSelection(group) === 1 ? "SINGLE" : "MULTIPLE";
}

function parseSquareVersion(value: string | null | undefined): number | undefined {
  // Square menu/category ordinals can be rewritten by Square after upserts,
  // which makes optimistic concurrency versions go stale between sync passes.
  // We still persist the latest returned versions in our DB, but omit them from
  // outgoing upserts so relationship reconciliation can proceed reliably.
  void value;
  return undefined;
}

function shouldSyncProduct(
  visible: boolean,
  squareItemId: string | null | undefined,
  includeHiddenProducts: boolean | undefined,
): boolean {
  if (includeHiddenProducts) {
    return true;
  }

  return visible || Boolean(squareItemId);
}

function dedupeBy<T>(values: T[], getKey: (value: T) => string): T[] {
  const seen = new Set<string>();
  const output: T[] = [];

  for (const value of values) {
    const key = getKey(value);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(value);
  }

  return output;
}

function toSquareTempId(
  kind:
    | "menu-root"
    | "menu-category"
    | "regular-category"
    | "category"
    | "item"
    | "variation"
    | "modifier-group"
    | "modifier-item",
  scope: string,
  entityId: string,
): string {
  return `#foody-${kind}-${scope}-${entityId}`;
}
