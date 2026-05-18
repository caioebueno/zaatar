"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  ProductManagerCategory,
  ProductManagerFixedComboProduct,
  ProductManagerComboSlot,
  ProductManagerModifierGroup,
  ProductManagerModifierGroupItem,
  ProductManagerPreparationTask,
  ProductManagerProduct,
  ProductManagerProductItemType,
  ProductManagerTranslations,
} from "@/src/types/productManager";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_STORAGE_KEY,
  BUSINESS_ID_STORAGE_KEY,
} from "@/src/lib/auth";

type Props = {
  initialCategories: ProductManagerCategory[];
  initialUncategorized: ProductManagerProduct[];
  initialLookupModifierGroups: ProductManagerModifierGroup[];
  initialUberSyncInsights: {
    latestRun?: {
      createdAt?: string;
      status?: string;
    } | null;
    summary?: {
      excluded?: number;
      needsSync?: number;
      notSynced?: number;
      synced?: number;
      totalItems?: number;
    };
    items?: Array<{
      categoryId?: string;
      productId?: string;
      reason?: string;
      status?: string;
    }>;
    groups?: {
      noChange?: unknown[];
      toCreate?: unknown[];
      toDisable?: unknown[];
      toUpdate?: unknown[];
    };
  } | null;
  menus: {
    id: string;
    name: string;
    active: boolean;
    isDefault: boolean;
  }[];
  selectedMenuId: string;
  allSections: {
    id: string;
    title: string;
  }[];
};

type MenuExportModifierGroupItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  translations: ProductManagerTranslations | null;
  photoUrl: string | null;
};

type MenuExportModifierGroup = {
  id: string;
  title: string;
  required: boolean;
  type: "MULTI" | "SINGLE" | null;
  minSelection: number | null;
  maxSelection: number | null;
  translations: ProductManagerTranslations | null;
  items: MenuExportModifierGroupItem[];
};

type MenuExportComboSlotOption = {
  productId: string;
  extraPrice: number;
  sortIndex: number | null;
};

type MenuExportComboSlot = {
  id: string;
  name: string;
  translations: ProductManagerTranslations | null;
  minSelect: number;
  maxSelect: number;
  allowDuplicates: boolean;
  sortIndex: number | null;
  options: MenuExportComboSlotOption[];
};

type MenuExportFixedComboProduct = {
  productId: string;
  quantity: number;
};

type MenuExportPreparationTask = {
  id: string;
  name: string;
  stationId: string | null;
  stationName: string | null;
  includeComments: boolean;
  includeModifiers: boolean;
};

type MenuExportProduct = {
  id: string;
  itemType: ProductManagerProductItemType;
  name: string;
  description: string | null;
  price: number | null;
  comparedAtPrice: number | null;
  visible: boolean;
  categoryIndex: number | null;
  translations: ProductManagerTranslations | null;
  photos: string[];
  preparationStepIds: string[];
  preparationTasks: MenuExportPreparationTask[];
  modifierGroups: MenuExportModifierGroup[];
  comboSlots: MenuExportComboSlot[];
  products: MenuExportFixedComboProduct[];
};

type MenuExportCategory = {
  id: string;
  name: string;
  menuIndex: number | null;
  products: MenuExportProduct[];
};

type MenuExportPayload = {
  menu?: {
    id?: string;
    name?: string;
  };
  categories: MenuExportCategory[];
  uncategorized: MenuExportProduct[];
  lookupModifierGroups: MenuExportModifierGroup[];
};

type CategoryView = {
  id: string;
  title: string;
  products: ProductManagerProduct[];
};

type ProductSyncStatus = "SYNCED" | "NEEDS_SYNC" | "NOT_SYNCED" | "EXCLUDED";
type SyncFilter = "ALL" | ProductSyncStatus;

type ProductSyncInsight = {
  productId: string;
  status: ProductSyncStatus;
  reason: string;
  categoryId: string | null;
};

type SyncPreviewItem = {
  categoryId: string | null;
  categoryName: string | null;
  productId: string;
  productName: string;
  reason: string;
};

type DragProductState = {
  productId: string;
  sourceCategoryId: string | null;
};

type DrawerLanguage = "es" | "pt";
type ProductEditorMode = "create" | "edit";
type ProductEditorFocusSection = "translations";

type EditorPrepTask = {
  stepId: string;
  stepName: string;
  stationId: string;
  stationName: string;
  includeComments: boolean;
  includeModifiers: boolean;
  goalMinutes: number;
};

type AvailableStation = {
  id: string;
  name: string;
  preparationSteps: {
    id: string;
    name: string;
    goalMinutes: number;
    includeComments: boolean;
    includeModifiers: boolean;
  }[];
};

type ProductEditorComboSlotOption = {
  id: string;
  productId: string;
  extraPriceInput: string;
};

type ProductEditorComboSlot = {
  id: string;
  name: string;
  translations: ProductManagerTranslations | null;
  minSelect: number;
  maxSelect: number;
  allowDuplicates: boolean;
  options: ProductEditorComboSlotOption[];
  optionLookupProductId: string;
  optionLookupExtraPriceInput: string;
};

type ProductEditorDirectComboProduct = {
  id: string;
  productId: string;
  quantity: number;
};

type ProductEditorState = {
  mode: ProductEditorMode;
  productId: string | null;
  createdAt: string;
  categoryIndex: number | null;
  name: string;
  description: string;
  categoryId: string;
  visible: boolean;
  priceInput: string;
  comparedAtPriceInput: string;
  itemType: ProductManagerProductItemType;
  comboProducts: ProductEditorDirectComboProduct[];
  comboProductLookupId: string;
  comboProductLookupQuantityInput: string;
  comboSlots: ProductEditorComboSlot[];
  esName: string;
  esDescription: string;
  ptName: string;
  ptDescription: string;
  otherTranslations: ProductManagerTranslations;
  photoUrls: string[];
  modifierGroups: ProductManagerModifierGroup[];
  newPhotoUrl: string;
  modifierLookupIdToAttach: string;
  newModifierGroupTitle: string;
  creatingModifierGroup: boolean;
  savingModifierGroupId: string | null;
  deletingModifierGroupId: string | null;
  creatingModifierItemGroupId: string | null;
  savingModifierItemId: string | null;
  deletingModifierItemId: string | null;
  uploadingPhoto: boolean;
  activeLanguage: DrawerLanguage;
  focusSection: ProductEditorFocusSection | null;
  saving: boolean;
  error: string | null;
  prepTasks: EditorPrepTask[];
  prepTaskLookupStepId: string;
  newPrepStepFormOpen: boolean;
  newPrepStepStationId: string;
  newPrepStepName: string;
  newPrepStepGoalMinutes: string;
  newPrepStepIncludeComments: boolean;
  newPrepStepIncludeModifiers: boolean;
  creatingPrepStep: boolean;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatPrice(value: number | null): string {
  if (typeof value !== "number") return "-";
  return currencyFormatter.format(value / 100);
}

function formatCurrencyInput(value: number | null): string {
  if (typeof value !== "number") return "";
  return (value / 100).toFixed(2);
}

function parseCurrencyInput(value: string, field: string): number | null {
  const normalized = value.trim();

  if (!normalized) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`${field} must be a valid amount`);
  }

  return Math.round(Number(normalized) * 100);
}

function normalizeTranslations(
  value: unknown,
): ProductManagerTranslations | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const output: ProductManagerTranslations = {};

  for (const [locale, localeValue] of Object.entries(value)) {
    if (
      !localeValue ||
      typeof localeValue !== "object" ||
      Array.isArray(localeValue)
    ) {
      continue;
    }

    const normalizedLocaleValue: Record<string, string> = {};

    for (const [key, fieldValue] of Object.entries(localeValue)) {
      if (typeof fieldValue !== "string") continue;

      const trimmed = fieldValue.trim();
      if (!trimmed) continue;

      normalizedLocaleValue[key] = trimmed;
    }

    if (Object.keys(normalizedLocaleValue).length > 0) {
      output[locale] = normalizedLocaleValue;
    }
  }

  return Object.keys(output).length > 0 ? output : null;
}

function cloneTranslations(
  value: ProductManagerTranslations | null,
): ProductManagerTranslations {
  if (!value) return {};

  return Object.fromEntries(
    Object.entries(value).map(([locale, fields]) => [locale, { ...fields }]),
  );
}

function readTranslationField(
  translations: ProductManagerTranslations | null,
  locale: "es" | "pt",
  field: string,
): string {
  if (!translations) return "";

  const localeData = translations[locale];
  if (!localeData) return "";

  const value = localeData[field];
  return typeof value === "string" ? value : "";
}

function upsertTranslationField(
  translations: ProductManagerTranslations | null,
  locale: "es" | "pt",
  field: string,
  value: string,
): ProductManagerTranslations | null {
  const nextTranslations = cloneTranslations(translations);
  const nextLocale = {
    ...(nextTranslations[locale] ?? {}),
  };

  if (value.length > 0) {
    nextLocale[field] = value;
  } else {
    delete nextLocale[field];
  }

  if (Object.keys(nextLocale).length > 0) {
    nextTranslations[locale] = nextLocale;
  } else {
    delete nextTranslations[locale];
  }

  return Object.keys(nextTranslations).length > 0 ? nextTranslations : null;
}

function cloneModifierGroupItem(
  item: ProductManagerModifierGroupItem,
): ProductManagerModifierGroupItem {
  return {
    ...item,
    translations: cloneTranslations(item.translations),
  };
}

function cloneModifierGroup(
  modifierGroup: ProductManagerModifierGroup,
): ProductManagerModifierGroup {
  return {
    ...modifierGroup,
    translations: cloneTranslations(modifierGroup.translations),
    items: modifierGroup.items.map(cloneModifierGroupItem),
  };
}

function createLocalId(): string {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneComboSlots(slots: ProductManagerComboSlot[]): ProductEditorComboSlot[] {
  return slots.map((slot) => ({
    id: slot.id,
    name: slot.name,
    translations: cloneTranslations(slot.translations),
    minSelect: slot.minSelect,
    maxSelect: slot.maxSelect,
    allowDuplicates: slot.allowDuplicates,
    options: slot.options.map((option) => ({
      id: createLocalId(),
      productId: option.productId,
      extraPriceInput: (option.extraPrice / 100).toFixed(2),
    })),
    optionLookupProductId: "",
    optionLookupExtraPriceInput: "0.00",
  }));
}

function comboItemsFromSlots(slots: ProductManagerComboSlot[]) {
  return slots
    .map((slot) => {
      const firstOption = slot.options[0];
      if (!firstOption) return null;

      return {
        productId: firstOption.productId,
        productName: firstOption.productName,
        quantity: Math.max(1, slot.maxSelect),
      };
    })
    .filter((item): item is { productId: string; productName: string; quantity: number } => item !== null);
}

function cloneDirectComboProducts(
  products: ProductManagerFixedComboProduct[],
): ProductEditorDirectComboProduct[] {
  return products.map((product) => ({
    id: createLocalId(),
    productId: product.productId,
    quantity: product.quantity,
  }));
}

function parseModifierGroupType(value: unknown): "MULTI" | "SINGLE" | null {
  if (value === "MULTI" || value === "SINGLE") return value;
  return null;
}

function mapModifierGroupFromUnknown(
  value: unknown,
): ProductManagerModifierGroup | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as {
    id?: unknown;
    title?: unknown;
    required?: unknown;
    type?: unknown;
    minSelection?: unknown;
    maxSelection?: unknown;
    translations?: unknown;
    items?: unknown;
  };

  if (typeof record.id !== "string" || typeof record.title !== "string") {
    return null;
  }

  const items = Array.isArray(record.items) ? record.items : [];

  return {
    id: record.id,
    title: record.title,
    required: typeof record.required === "boolean" ? record.required : false,
    type: parseModifierGroupType(record.type),
    minSelection:
      typeof record.minSelection === "number" ? record.minSelection : null,
    maxSelection:
      typeof record.maxSelection === "number" ? record.maxSelection : null,
    translations: normalizeTranslations(record.translations),
    items: items
      .map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return null;
        }

        const itemRecord = item as {
          id?: unknown;
          name?: unknown;
          description?: unknown;
          price?: unknown;
          translations?: unknown;
          photo?: unknown;
        };

        if (
          typeof itemRecord.id !== "string" ||
          typeof itemRecord.name !== "string" ||
          typeof itemRecord.price !== "number"
        ) {
          return null;
        }

        const photoUrl =
          itemRecord.photo &&
          typeof itemRecord.photo === "object" &&
          !Array.isArray(itemRecord.photo) &&
          "url" in itemRecord.photo &&
          typeof itemRecord.photo.url === "string"
            ? itemRecord.photo.url
            : null;

        return {
          id: itemRecord.id,
          name: itemRecord.name,
          description:
            typeof itemRecord.description === "string" ||
            itemRecord.description === null
              ? itemRecord.description
              : null,
          price: itemRecord.price,
          translations: normalizeTranslations(itemRecord.translations),
          photoUrl,
        } satisfies ProductManagerModifierGroupItem;
      })
      .filter((item): item is ProductManagerModifierGroupItem => item !== null),
  };
}

function mapComboSlotFromUnknown(value: unknown): ProductManagerComboSlot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as {
    id?: unknown;
    name?: unknown;
    translations?: unknown;
    minSelect?: unknown;
    maxSelect?: unknown;
    allowDuplicates?: unknown;
    sortIndex?: unknown;
    options?: unknown;
  };

  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.minSelect !== "number" ||
    typeof record.maxSelect !== "number" ||
    typeof record.allowDuplicates !== "boolean"
  ) {
    return null;
  }

  const options = Array.isArray(record.options) ? record.options : [];

  return {
    id: record.id,
    name: record.name,
    translations: normalizeTranslations(record.translations),
    minSelect: record.minSelect,
    maxSelect: record.maxSelect,
    allowDuplicates: record.allowDuplicates,
    sortIndex: typeof record.sortIndex === "number" ? record.sortIndex : null,
    options: options
      .map((option) => {
        if (!option || typeof option !== "object" || Array.isArray(option)) {
          return null;
        }

        const optionRecord = option as {
          productId?: unknown;
          productName?: unknown;
          extraPrice?: unknown;
          sortIndex?: unknown;
        };

        if (
          typeof optionRecord.productId !== "string" ||
          typeof optionRecord.productName !== "string" ||
          typeof optionRecord.extraPrice !== "number"
        ) {
          return null;
        }

        return {
          productId: optionRecord.productId,
          productName: optionRecord.productName,
          extraPrice: optionRecord.extraPrice,
          sortIndex:
            typeof optionRecord.sortIndex === "number"
              ? optionRecord.sortIndex
              : null,
        };
      })
      .filter((option): option is ProductManagerComboSlot["options"][number] => option !== null),
  };
}

function mapFixedComboProductFromUnknown(
  value: unknown,
): ProductManagerFixedComboProduct | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as {
    productId?: unknown;
    productName?: unknown;
    quantity?: unknown;
  };

  if (
    typeof record.productId !== "string" ||
    typeof record.productName !== "string" ||
    typeof record.quantity !== "number" ||
    !Number.isInteger(record.quantity) ||
    record.quantity <= 0
  ) {
    return null;
  }

  return {
    productId: record.productId,
    productName: record.productName,
    quantity: record.quantity,
  };
}

function mapPreparationTaskFromUnknown(
  value: unknown,
): MenuExportPreparationTask | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as {
    id?: unknown;
    name?: unknown;
    stationId?: unknown;
    stationName?: unknown;
    includeComments?: unknown;
    includeModifiers?: unknown;
  };

  if (typeof record.id !== "string" || typeof record.name !== "string") {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    stationId: typeof record.stationId === "string" ? record.stationId : null,
    stationName:
      typeof record.stationName === "string" ? record.stationName : null,
    includeComments: record.includeComments === true,
    includeModifiers: record.includeModifiers === true,
  };
}

function parseMenuExportPayload(value: unknown): MenuExportPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid import file");
  }

  const record = value as {
    categories?: unknown;
    uncategorized?: unknown;
    lookupModifierGroups?: unknown;
    menu?: unknown;
  };

  if (!Array.isArray(record.categories)) {
    throw new Error("Invalid import file: categories");
  }

  const categories = record.categories
    .map((entry): MenuExportCategory | null => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const item = entry as {
        id?: unknown;
        name?: unknown;
        menuIndex?: unknown;
        products?: unknown;
      };
      if (
        typeof item.id !== "string" ||
        typeof item.name !== "string" ||
        !Array.isArray(item.products)
      ) {
        return null;
      }

      const menuIndex =
        typeof item.menuIndex === "number" && Number.isInteger(item.menuIndex)
          ? item.menuIndex
          : null;

      return {
        id: item.id,
        name: item.name,
        menuIndex,
        products: item.products
          .map((product) => mapExportProductFromUnknown(product))
          .filter((product): product is MenuExportProduct => product !== null),
      };
    })
    .filter((entry): entry is MenuExportCategory => entry !== null);

  const uncategorized = Array.isArray(record.uncategorized)
    ? record.uncategorized
        .map((product) => mapExportProductFromUnknown(product))
        .filter((product): product is MenuExportProduct => product !== null)
    : [];

  const lookupModifierGroups = Array.isArray(record.lookupModifierGroups)
    ? record.lookupModifierGroups
        .map((group) => mapExportModifierGroupFromUnknown(group))
        .filter((group): group is MenuExportModifierGroup => group !== null)
    : [];

  const menu =
    record.menu && typeof record.menu === "object" && !Array.isArray(record.menu)
      ? {
          id:
            "id" in record.menu && typeof record.menu.id === "string"
              ? record.menu.id
              : undefined,
          name:
            "name" in record.menu && typeof record.menu.name === "string"
              ? record.menu.name
              : undefined,
        }
      : undefined;

  return {
    menu,
    categories,
    uncategorized,
    lookupModifierGroups,
  };
}

function mapExportProductFromUnknown(value: unknown): MenuExportProduct | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as {
    id?: unknown;
    itemType?: unknown;
    name?: unknown;
    description?: unknown;
    price?: unknown;
    comparedAtPrice?: unknown;
    visible?: unknown;
    categoryIndex?: unknown;
    translations?: unknown;
    photos?: unknown;
    preparationStepIds?: unknown;
    preparationTasks?: unknown;
    modifierGroups?: unknown;
    comboSlots?: unknown;
    products?: unknown;
  };

  if (
    typeof record.id !== "string" ||
    (record.itemType !== "PRODUCT" && record.itemType !== "COMBO") ||
    typeof record.name !== "string"
  ) {
    return null;
  }

  const description =
    typeof record.description === "string" || record.description === null
      ? record.description
      : null;
  const price = typeof record.price === "number" ? record.price : null;
  const comparedAtPrice =
    typeof record.comparedAtPrice === "number" ? record.comparedAtPrice : null;
  const visible = typeof record.visible === "boolean" ? record.visible : true;
  const categoryIndex =
    typeof record.categoryIndex === "number" && Number.isInteger(record.categoryIndex)
      ? record.categoryIndex
      : null;
  const photos = Array.isArray(record.photos)
    ? record.photos.filter((entry): entry is string => typeof entry === "string")
    : [];
  const preparationStepIds = Array.isArray(record.preparationStepIds)
    ? record.preparationStepIds.filter(
        (entry): entry is string => typeof entry === "string",
      )
    : [];
  const preparationTasks = Array.isArray(record.preparationTasks)
    ? record.preparationTasks
        .map((task) => mapPreparationTaskFromUnknown(task))
        .filter((task): task is MenuExportPreparationTask => task !== null)
    : [];

  const modifierGroups = Array.isArray(record.modifierGroups)
    ? record.modifierGroups
        .map((group) => mapExportModifierGroupFromUnknown(group))
        .filter((group): group is MenuExportModifierGroup => group !== null)
    : [];

  const comboSlots = Array.isArray(record.comboSlots)
    ? record.comboSlots
        .map((slot) => mapExportComboSlotFromUnknown(slot))
        .filter((slot): slot is MenuExportComboSlot => slot !== null)
    : [];

  const products = Array.isArray(record.products)
    ? record.products
        .map((item): MenuExportFixedComboProduct | null => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return null;
          const comboItem = item as { productId?: unknown; quantity?: unknown };
          if (
            typeof comboItem.productId !== "string" ||
            typeof comboItem.quantity !== "number" ||
            !Number.isInteger(comboItem.quantity) ||
            comboItem.quantity <= 0
          ) {
            return null;
          }
          return {
            productId: comboItem.productId,
            quantity: comboItem.quantity,
          };
        })
        .filter((item): item is MenuExportFixedComboProduct => item !== null)
    : [];

  return {
    id: record.id,
    itemType: record.itemType,
    name: record.name,
    description,
    price,
    comparedAtPrice,
    visible,
    categoryIndex,
    translations: normalizeTranslations(record.translations),
    photos,
    preparationStepIds,
    preparationTasks,
    modifierGroups,
    comboSlots,
    products,
  };
}

function mapExportModifierGroupFromUnknown(
  value: unknown,
): MenuExportModifierGroup | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as {
    id?: unknown;
    title?: unknown;
    required?: unknown;
    type?: unknown;
    minSelection?: unknown;
    maxSelection?: unknown;
    translations?: unknown;
    items?: unknown;
  };

  if (typeof record.id !== "string" || typeof record.title !== "string") {
    return null;
  }

  return {
    id: record.id,
    title: record.title,
    required: typeof record.required === "boolean" ? record.required : false,
    type: record.type === "MULTI" || record.type === "SINGLE" ? record.type : null,
    minSelection:
      typeof record.minSelection === "number" && Number.isInteger(record.minSelection)
        ? record.minSelection
        : null,
    maxSelection:
      typeof record.maxSelection === "number" && Number.isInteger(record.maxSelection)
        ? record.maxSelection
        : null,
    translations: normalizeTranslations(record.translations),
    items: Array.isArray(record.items)
      ? record.items
          .map((item): MenuExportModifierGroupItem | null => {
            if (!item || typeof item !== "object" || Array.isArray(item)) return null;
            const entry = item as {
              id?: unknown;
              name?: unknown;
              description?: unknown;
              price?: unknown;
              translations?: unknown;
              photoUrl?: unknown;
            };
            if (
              typeof entry.id !== "string" ||
              typeof entry.name !== "string" ||
              typeof entry.price !== "number"
            ) {
              return null;
            }

            return {
              id: entry.id,
              name: entry.name,
              description:
                typeof entry.description === "string" || entry.description === null
                  ? entry.description
                  : null,
              price: entry.price,
              translations: normalizeTranslations(entry.translations),
              photoUrl: typeof entry.photoUrl === "string" ? entry.photoUrl : null,
            };
          })
          .filter((entry): entry is MenuExportModifierGroupItem => entry !== null)
      : [],
  };
}

function mapExportComboSlotFromUnknown(value: unknown): MenuExportComboSlot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as {
    id?: unknown;
    name?: unknown;
    translations?: unknown;
    minSelect?: unknown;
    maxSelect?: unknown;
    allowDuplicates?: unknown;
    sortIndex?: unknown;
    options?: unknown;
  };

  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.minSelect !== "number" ||
    typeof record.maxSelect !== "number" ||
    typeof record.allowDuplicates !== "boolean"
  ) {
    return null;
  }

  const options = Array.isArray(record.options)
    ? record.options
        .map((option): MenuExportComboSlotOption | null => {
          if (!option || typeof option !== "object" || Array.isArray(option)) return null;
          const entry = option as {
            productId?: unknown;
            extraPrice?: unknown;
            sortIndex?: unknown;
          };
          if (typeof entry.productId !== "string" || typeof entry.extraPrice !== "number") {
            return null;
          }
          return {
            productId: entry.productId,
            extraPrice: entry.extraPrice,
            sortIndex:
              typeof entry.sortIndex === "number" && Number.isInteger(entry.sortIndex)
                ? entry.sortIndex
                : null,
          };
        })
        .filter((option): option is MenuExportComboSlotOption => option !== null)
    : [];

  return {
    id: record.id,
    name: record.name,
    translations: normalizeTranslations(record.translations),
    minSelect: record.minSelect,
    maxSelect: record.maxSelect,
    allowDuplicates: record.allowDuplicates,
    sortIndex:
      typeof record.sortIndex === "number" && Number.isInteger(record.sortIndex)
        ? record.sortIndex
        : null,
    options,
  };
}

function sortProducts(
  left: Pick<ProductManagerProduct, "categoryIndex" | "createdAt">,
  right: Pick<ProductManagerProduct, "categoryIndex" | "createdAt">,
): number {
  const leftIndex = left.categoryIndex ?? Number.MAX_SAFE_INTEGER;
  const rightIndex = right.categoryIndex ?? Number.MAX_SAFE_INTEGER;

  if (leftIndex !== rightIndex) return leftIndex - rightIndex;

  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
}

function reorderIds(ids: string[], draggedId: string, targetId: string): string[] {
  if (draggedId === targetId) return ids.slice();

  const fromIndex = ids.indexOf(draggedId);
  const toIndex = ids.indexOf(targetId);

  if (fromIndex === -1 || toIndex === -1) {
    return ids.slice();
  }

  const reordered = ids.slice();
  const [dragged] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, dragged);

  return reordered;
}

function DotsHandle() {
  return (
    <span className="inline-grid grid-cols-2 gap-0.5 text-zinc-400">
      <span className="h-1 w-1 rounded-full bg-current" />
      <span className="h-1 w-1 rounded-full bg-current" />
      <span className="h-1 w-1 rounded-full bg-current" />
      <span className="h-1 w-1 rounded-full bg-current" />
      <span className="h-1 w-1 rounded-full bg-current" />
      <span className="h-1 w-1 rounded-full bg-current" />
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-zinc-200 text-zinc-600"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-zinc-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={checked ? "Set inactive" : "Set active"}
      aria-pressed={checked}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onChange();
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        checked ? "bg-violet-500" : "bg-zinc-300"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function InputLabel({ children }: { children: string }) {
  return <label className="mb-1 block text-sm font-medium text-zinc-700">{children}</label>;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
      {children}
    </p>
  );
}

function syncStatusLabel(status: ProductSyncStatus): string {
  switch (status) {
    case "SYNCED":
      return "Synced";
    case "NEEDS_SYNC":
      return "Needs sync";
    case "NOT_SYNCED":
      return "Not synced";
    case "EXCLUDED":
      return "Excluded";
    default:
      return status;
  }
}

function syncStatusBadgeClasses(status: ProductSyncStatus): string {
  switch (status) {
    case "SYNCED":
      return "bg-emerald-100 text-emerald-700";
    case "NEEDS_SYNC":
      return "bg-amber-100 text-amber-700";
    case "NOT_SYNCED":
      return "bg-zinc-200 text-zinc-700";
    case "EXCLUDED":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-zinc-200 text-zinc-700";
  }
}

function formatSyncRunAt(value: string | undefined): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function SectionInsertControl({
  disabled,
  compact = false,
  availableSections,
  onCreate,
  onLink,
}: {
  disabled: boolean;
  compact?: boolean;
  availableSections: {
    id: string;
    title: string;
  }[];
  onCreate: (name: string) => void;
  onLink: (sectionId: string) => void;
}) {
  const [newSectionName, setNewSectionName] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");

  return (
    <details
      className={`rounded-lg border border-zinc-200 bg-white ${
        compact ? "px-2 py-2" : "px-4 py-4"
      }`}
    >
      <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-700">
        + Add section here
      </summary>

      <div className={`mt-3 grid gap-3 ${compact ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Create new
          </p>
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              value={newSectionName}
              disabled={disabled}
              onChange={(event) => setNewSectionName(event.target.value)}
              placeholder="Section name"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            />
            <button
              type="button"
              disabled={disabled || newSectionName.trim().length === 0}
              onClick={() => {
                const trimmed = newSectionName.trim();
                if (!trimmed) return;
                onCreate(trimmed);
                setNewSectionName("");
              }}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Link existing
          </p>
          <div className="flex flex-col gap-2 md:flex-row">
            <select
              value={selectedSectionId}
              disabled={disabled || availableSections.length === 0}
              onChange={(event) => setSelectedSectionId(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            >
              <option value="">Select section...</option>
              {availableSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={
                disabled ||
                availableSections.length === 0 ||
                selectedSectionId.trim().length === 0
              }
              onClick={() => {
                const normalized = selectedSectionId.trim();
                if (!normalized) return;
                onLink(normalized);
                setSelectedSectionId("");
              }}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Link
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}

// ── Menu Builder UI ───────────────────────────────────────────────────────────

function MBMenuSelector({
  menus, activeId, onSelect, onCreateMenu, onImportMenu, onSetDefault, settingDefaultId, disabled,
}: {
  menus: { id: string; name: string; active: boolean; isDefault: boolean }[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreateMenu: () => void;
  onImportMenu: () => void;
  onSetDefault: (id: string) => void;
  settingDefaultId: string | null;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const active = menus.find(m => m.id === activeId);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => !disabled && setOpen(v => !v)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px 7px 10px", borderRadius: 9, border: "1px solid rgba(22,18,15,0.16)", background: "var(--paper)", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", transition: "border-color 0.15s" }}
        onMouseEnter={e => !open && ((e.currentTarget as HTMLButtonElement).style.borderColor = "var(--zippy)")}
        onMouseLeave={e => !open && ((e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(22,18,15,0.16)")}
      >
        <div style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: active?.active ? "#00a866" : "var(--slate)" }} />
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          {active?.name || "Select menu"}{active?.isDefault ? " · Default" : ""}
        </span>
        <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="var(--slate)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="M4 6l4 4 4-4" /></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 240, zIndex: 100, background: "var(--paper)", borderRadius: 12, border: "1px solid rgba(22,18,15,0.16)", boxShadow: "0 8px 32px rgba(22,18,15,0.12), 0 0 0 1px rgba(22,18,15,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "6px 6px 0" }}>
            {menus.map(m => (
              <div key={m.id}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 7, background: m.id === activeId ? "rgba(255,61,20,0.07)" : "transparent", transition: "background 0.1s" }}
                onMouseEnter={e => m.id !== activeId && ((e.currentTarget as HTMLElement).style.background = "#efe7da")}
                onMouseLeave={e => m.id !== activeId && ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <div onMouseDown={() => { onSelect(m.id); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, cursor: "pointer" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: m.active ? "#00a866" : "var(--slate)", flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-sans)", fontWeight: m.id === activeId ? 600 : 400, fontSize: 13, color: "var(--ink)", flex: 1 }}>{m.name}{m.isDefault ? " · Default" : ""}</span>
                  {m.id === activeId && <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="var(--zippy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M2.5 8.5l3.5 3.5 7.5-7.5" /></svg>}
                </div>
                {!m.isDefault && (
                  <button
                    type="button"
                    title="Set as default menu"
                    disabled={settingDefaultId !== null}
                    onMouseDown={e => { e.stopPropagation(); onSetDefault(m.id); setOpen(false); }}
                    style={{ flexShrink: 0, padding: "3px 7px", borderRadius: 5, border: "1px solid rgba(22,18,15,0.16)", background: "transparent", cursor: settingDefaultId !== null ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 500, color: "var(--slate)", opacity: settingDefaultId !== null ? 0.5 : 1, whiteSpace: "nowrap" }}
                  >
                    {settingDefaultId === m.id ? "Saving…" : "Set default"}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div style={{ height: 1, background: "rgba(22,18,15,0.1)", margin: "6px 0" }} />
          <div onMouseDown={e => { e.preventDefault(); onCreateMenu(); setOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 16px 12px", cursor: "pointer" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#efe7da")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <div style={{ width: 24, height: 24, borderRadius: 6, border: "1px dashed rgba(22,18,15,0.16)", display: "grid", placeItems: "center" }}>
              <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="var(--slate)" strokeWidth="2.2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
            </div>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 12.5, color: "var(--slate)" }}>Create new menu</span>
          </div>
          <div onMouseDown={e => { e.preventDefault(); onImportMenu(); setOpen(false); }}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 16px 12px", cursor: "pointer" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#efe7da")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <div style={{ width: 24, height: 24, borderRadius: 6, border: "1px dashed rgba(22,18,15,0.16)", display: "grid", placeItems: "center" }}>
              <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="var(--slate)" strokeWidth="1.8" strokeLinecap="round"><path d="M8 2.5v7"/><path d="M5.5 7.5L8 10l2.5-2.5"/><path d="M3.5 12.5h9"/></svg>
            </div>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 12.5, color: "var(--slate)" }}>Import menu</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MBAddSectionBtn({ onAdd, disabled }: { onAdd: () => void; disabled: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1 }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={disabled ? undefined : onAdd}
    >
      <div style={{ flex: 1, height: 1, background: hover ? "var(--zippy)" : "rgba(22,18,15,0.1)", transition: "background 0.15s" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, border: `1px solid ${hover ? "var(--zippy)" : "rgba(22,18,15,0.1)"}`, background: hover ? "rgba(255,61,20,0.06)" : "var(--cream)", transition: "all 0.15s" }}>
        <svg width={11} height={11} viewBox="0 0 16 16" fill="none" stroke={hover ? "var(--zippy)" : "var(--slate)"} strokeWidth="2.2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11, color: hover ? "var(--zippy)" : "var(--slate)", letterSpacing: "0.02em" }}>Add section</span>
      </div>
      <div style={{ flex: 1, height: 1, background: hover ? "var(--zippy)" : "rgba(22,18,15,0.1)", transition: "background 0.15s" }} />
    </div>
  );
}

function MBIconBtn({ onClick, title, danger = false, disabled = false, children }: {
  onClick: () => void; title: string; danger?: boolean; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled}
      style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "transparent", display: "grid", placeItems: "center", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1, flexShrink: 0, transition: "background 0.12s" }}
      onMouseEnter={e => !disabled && ((e.currentTarget as HTMLButtonElement).style.background = danger ? "#fef3f1" : "#efe7da")}
      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
    >{children}</button>
  );
}

function MBAttachPanel({ allProducts, linkedIds, onAttach, onClose }: {
  allProducts: { id: string; name: string; price: number | null; visible: boolean; mainPhotoUrl: string | null }[];
  linkedIds: string[];
  onAttach: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  const fmt = (n: number | null) => n == null ? "" : "$" + (n / 100).toFixed(2);
  const available = allProducts.filter(p => !linkedIds.includes(p.id));
  const filtered = query.trim() ? available.filter(p => p.name.toLowerCase().includes(query.toLowerCase())) : available;
  return (
    <div ref={ref} style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50, background: "var(--paper)", borderRadius: 12, border: "1px solid rgba(22,18,15,0.16)", boxShadow: "0 8px 32px rgba(22,18,15,0.14)", overflow: "hidden" }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(22,18,15,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
        <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="var(--slate)" strokeWidth="1.75" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10 10l3.5 3.5"/></svg>
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products…"
          style={{ flex: 1, border: "none", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink)", background: "transparent", outline: "none" }} />
        {query && <button type="button" onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "grid", placeItems: "center" }}><svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="var(--slate)" strokeWidth="2.2" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>}
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto" }}>
        {filtered.length === 0 && (
          <div style={{ padding: "14px", fontSize: 12.5, color: "var(--slate)" }}>{query ? `No results for "${query}"` : "No available products."}</div>
        )}
        {filtered.map(p => (
          <div key={p.id} onMouseDown={e => { e.preventDefault(); onAttach(p.id); }}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", cursor: "pointer", borderTop: "1px solid rgba(22,18,15,0.06)", transition: "background 0.1s" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#efe7da")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
          >
            <div style={{ width: 32, height: 32, borderRadius: 7, flexShrink: 0, background: p.mainPhotoUrl ? undefined : "#8c6e5c", backgroundImage: p.mainPhotoUrl ? `url("${p.mainPhotoUrl}")` : undefined, backgroundSize: "cover", backgroundPosition: "center", border: "1px solid rgba(22,18,15,0.08)" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 12.5, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
              {p.price != null && <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--slate)" }}>{fmt(p.price)}</div>}
            </div>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.visible ? "#00a866" : "rgba(22,18,15,0.2)", flexShrink: 0 }} />
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(22,18,15,0.08)", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, color: "var(--slate)" }}>{filtered.length} available</span>
      </div>
    </div>
  );
}

function MBProductCard({ product, isFirst, isLast, saving, onToggleActive, onMoveUp, onMoveDown, onEdit, onUnlink }: {
  product: ProductManagerProduct;
  isFirst: boolean;
  isLast: boolean;
  saving: boolean;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onUnlink: () => void;
}) {
  const fmt = (n: number | null) => n == null ? null : "$" + (n / 100).toFixed(2);
  const priceStr = fmt(product.price);
  const compareStr = fmt(product.comparedAtPrice);
  const discountPct = product.price && product.comparedAtPrice ? Math.round((1 - product.price / product.comparedAtPrice) * 100) : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--paper)", borderRadius: 10, border: "1px solid rgba(22,18,15,0.1)", transition: "box-shadow 0.15s" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(22,18,15,0.08)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
    >
      {/* drag handle */}
      <div style={{ cursor: "grab", opacity: 0.35, flexShrink: 0 }}>
        <svg width={14} height={14} viewBox="0 0 16 16" fill="var(--slate)" style={{ display: "block" }}>
          <circle cx="5.5" cy="4.5" r="1.2"/><circle cx="10.5" cy="4.5" r="1.2"/><circle cx="5.5" cy="8" r="1.2"/><circle cx="10.5" cy="8" r="1.2"/><circle cx="5.5" cy="11.5" r="1.2"/><circle cx="10.5" cy="11.5" r="1.2"/>
        </svg>
      </div>
      {/* image */}
      <div style={{ width: 52, height: 52, borderRadius: 8, flexShrink: 0, background: product.mainPhotoUrl ? undefined : "#8c6e5c", backgroundImage: product.mainPhotoUrl ? `url("${product.mainPhotoUrl}")` : undefined, backgroundSize: "cover", backgroundPosition: "center", border: "1px solid rgba(22,18,15,0.08)", display: "grid", placeItems: "center", overflow: "hidden" }}>
        {!product.mainPhotoUrl && <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-8 8"/></svg>}
      </div>
      {/* info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 13.5, color: "var(--ink)", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
          {priceStr && <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{priceStr}</span>}
          {compareStr && <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--slate)", textDecoration: "line-through" }}>{compareStr}</span>}
          {discountPct != null && discountPct > 0 && <span style={{ fontSize: 10.5, fontWeight: 600, color: "#00633e", fontFamily: "var(--font-sans)", background: "#e6f7ee", padding: "1px 6px", borderRadius: 4 }}>-{discountPct}%</span>}
        </div>
      </div>
      {/* active badge */}
      <div style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, fontFamily: "var(--font-sans)", background: product.visible ? "#e6f7ee" : "#efe7da", color: product.visible ? "#00633e" : "var(--slate)", flexShrink: 0 }}>
        {product.visible ? "Active" : "Inactive"}
      </div>
      {/* toggle */}
      <button type="button" onClick={e => { e.stopPropagation(); onToggleActive(); }} disabled={saving}
        style={{ width: 36, height: 20, borderRadius: 10, border: "none", cursor: saving ? "not-allowed" : "pointer", background: product.visible ? "#00a866" : "rgba(22,18,15,0.12)", position: "relative", flexShrink: 0, transition: "background 0.2s", padding: 0 }}>
        <div style={{ position: "absolute", top: 2, left: product.visible ? 18 : 2, width: 16, height: 16, borderRadius: 8, background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.18)" }} />
      </button>
      {/* reorder */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <MBIconBtn title="Move up" onClick={onMoveUp} disabled={isFirst}>
          <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="var(--slate)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M8 12V4M4 8l4-4 4 4"/></svg>
        </MBIconBtn>
        <MBIconBtn title="Move down" onClick={onMoveDown} disabled={isLast}>
          <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="var(--slate)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M8 4v8M4 8l4 4 4-4"/></svg>
        </MBIconBtn>
      </div>
      {/* edit */}
      <MBIconBtn title="Edit product" onClick={onEdit}>
        <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="var(--slate)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M11 2l3 3-8 8H3v-3z"/></svg>
      </MBIconBtn>
      {/* unlink */}
      <MBIconBtn title="Remove from section" onClick={onUnlink} danger>
        <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="#d43a2c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M6 9a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5"/><path d="M10 7a3.5 3.5 0 0 0-5 0L3 9a3.5 3.5 0 0 0 5 5"/><path d="M3 3l10 10"/></svg>
      </MBIconBtn>
    </div>
  );
}

function MBSectionBlock({ category, isFirst, isLast, collapsed, savingProductId, persistingReorder, detaching, allUnlinkedProducts, onToggleCollapse, onMoveUp, onMoveDown, onDetach, onToggleProductActive, onMoveProductUp, onMoveProductDown, onEditProduct, onCreateProduct, onUnlinkProduct, onAttachProduct }: {
  category: CategoryView;
  isFirst: boolean;
  isLast: boolean;
  collapsed: boolean;
  savingProductId: string | null;
  persistingReorder: boolean;
  detaching: boolean;
  allUnlinkedProducts: ProductManagerProduct[];
  onToggleCollapse: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDetach: () => void;
  onToggleProductActive: (productId: string, visible: boolean) => void;
  onMoveProductUp: (idx: number) => void;
  onMoveProductDown: (idx: number) => void;
  onEditProduct: (product: ProductManagerProduct) => void;
  onCreateProduct: () => void;
  onUnlinkProduct: (productId: string) => void;
  onAttachProduct: (productId: string) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(category.title);
  const [showAttach, setShowAttach] = useState(false);
  const attachAreaRef = useRef<HTMLDivElement>(null);

  const linkedIds = category.products.map(p => p.id);

  return (
    <div style={{ border: "1px solid rgba(22,18,15,0.16)", borderRadius: 12, background: "var(--cream)", overflow: "visible" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: collapsed ? "none" : "1px solid rgba(22,18,15,0.08)" }}>
        <button type="button" onClick={onToggleCollapse} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", borderRadius: 4, flexShrink: 0 }}>
          <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="var(--slate)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", transition: "transform 0.2s", transform: collapsed ? "rotate(-90deg)" : "none" }}><path d="M4 6l4 4 4-4"/></svg>
        </button>

        {editingName ? (
          <input autoFocus value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={() => { setEditingName(false); /* name rename not wired to API yet */ }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false); }}
            style={{ flex: 1, fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--ink)", border: "none", borderBottom: "2px solid var(--zippy)", background: "transparent", letterSpacing: "-0.015em", padding: "0 0 2px", outline: "none" }}
          />
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, color: "var(--ink)", letterSpacing: "-0.015em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{category.title}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--slate)", flexShrink: 0 }}>{linkedIds.length} items</span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <MBIconBtn title="Rename section" onClick={() => setEditingName(true)}>
            <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="var(--slate)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M11 2l3 3-8 8H3v-3z"/></svg>
          </MBIconBtn>
          <MBIconBtn title="Move section up" onClick={onMoveUp} disabled={isFirst}>
            <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="var(--slate)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M8 12V4M4 8l4-4 4 4"/></svg>
          </MBIconBtn>
          <MBIconBtn title="Move section down" onClick={onMoveDown} disabled={isLast}>
            <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke="var(--slate)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M8 4v8M4 8l4 4 4-4"/></svg>
          </MBIconBtn>
          <MBIconBtn title="Remove section from menu" onClick={onDetach} disabled={detaching} danger>
            <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="#d43a2c" strokeWidth="2.2" strokeLinecap="round" style={{ display: "block" }}><path d="M4 4l8 8M12 4l-8 8"/></svg>
          </MBIconBtn>
        </div>
      </div>

      {/* body */}
      {!collapsed && (
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {category.products.length === 0 && (
            <div style={{ padding: 18, textAlign: "center", fontSize: 12.5, color: "var(--slate)", border: "1px dashed rgba(22,18,15,0.14)", borderRadius: 8 }}>
              No products yet — attach or create one below.
            </div>
          )}
          {category.products.map((p, idx) => (
            <MBProductCard
              key={p.id}
              product={p}
              isFirst={idx === 0}
              isLast={idx === category.products.length - 1}
              saving={savingProductId === p.id || persistingReorder}
              onToggleActive={() => onToggleProductActive(p.id, p.visible)}
              onMoveUp={() => onMoveProductUp(idx)}
              onMoveDown={() => onMoveProductDown(idx)}
              onEdit={() => onEditProduct(p)}
              onUnlink={() => onUnlinkProduct(p.id)}
            />
          ))}

          {/* footer actions */}
          <div style={{ display: "flex", gap: 8, paddingTop: 4, position: "relative" }} ref={attachAreaRef}>
            <div style={{ position: "relative", flex: 1 }}>
              <button type="button" onClick={() => setShowAttach(v => !v)}
                style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px dashed rgba(255,61,20,0.35)", background: "transparent", color: "var(--zippy)", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="var(--zippy)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}><path d="M6 9a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5L6.5 3.5"/><path d="M10 7a3.5 3.5 0 0 0-5 0L3 9a3.5 3.5 0 0 0 5 5l1.5-1.5"/></svg>
                Attach product
              </button>
              {showAttach && (
                <MBAttachPanel
                  allProducts={allUnlinkedProducts}
                  linkedIds={linkedIds}
                  onAttach={id => { onAttachProduct(id); setShowAttach(false); }}
                  onClose={() => setShowAttach(false)}
                />
              )}
            </div>
            <button type="button" onClick={onCreateProduct}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(22,18,15,0.16)", background: "transparent", color: "var(--ink)", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" style={{ display: "block" }}><path d="M8 3v10M3 8h10"/></svg>
              New product
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Editor design-system helpers ──────────────────────────────────────────

const edInput: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  color: "#f5f0e8",
  outline: "none",
  fontFamily: "var(--font-sans)",
  boxSizing: "border-box",
};

const edSelect: React.CSSProperties = {
  ...edInput,
  cursor: "pointer",
  appearance: "none",
  width: "100%",
};

const edSecondaryBtn: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 8,
  border: "none",
  background: "#ff3d14",
  color: "#fff",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  whiteSpace: "nowrap",
};

const edOutlineBtn: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "transparent",
  color: "rgba(245,240,232,0.7)",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  whiteSpace: "nowrap",
};

function EdSection({
  num,
  title,
  subtitle,
  right,
  children,
}: {
  num: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(245,240,232,0.3)", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{num}</span>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f5f0e8", margin: 0 }}>{title}</h3>
        {subtitle && <span style={{ fontSize: 12, color: "rgba(245,240,232,0.35)", marginLeft: 4 }}>{subtitle}</span>}
        {right && <span style={{ marginLeft: "auto" }}>{right}</span>}
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 22px" }}>
        {children}
      </div>
    </div>
  );
}

function EdFieldLabel({ required, children }: { required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "rgba(245,240,232,0.45)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
      {children}{required && <span style={{ color: "#ff3d14", marginLeft: 2 }}>*</span>}
    </label>
  );
}

function EdTranslationPill({ count, open, onToggle }: { count: number; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        marginTop: 7,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px 3px 8px",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.12)",
        background: open ? "rgba(255,61,20,0.1)" : "transparent",
        fontSize: 11,
        fontWeight: 500,
        color: count > 0 ? "#ff7a5c" : "rgba(245,240,232,0.4)",
        cursor: "pointer",
      }}
    >
      <span style={{ display: "inline-block", fontSize: 9, transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
      {count > 0 ? `Translations (${count})` : "Translations"}
    </button>
  );
}

type ModifierGroupCardProps = {
  modifierGroup: ProductManagerModifierGroup;
  savingId: string | null;
  deletingId: string | null;
  creatingItemGroupId: string | null;
  savingItemId: string | null;
  deletingItemId: string | null;
  onUpdateTitle: (v: string) => void;
  onUpdateType: (v: string) => void;
  onUpdateRequired: (v: boolean) => void;
  onUpdateMin: (v: number | null) => void;
  onUpdateMax: (v: number | null) => void;
  onUpdateTitleES: (v: string) => void;
  onUpdateTitlePT: (v: string) => void;
  onSave: () => void;
  onRemove: () => void;
  onDelete: () => void;
  onAddItem: () => void;
  onUpdateItem: (itemId: string, patch: Partial<ProductManagerModifierGroupItem>) => void;
  onUpdateItemTranslation: (itemId: string, lg: "es" | "pt", field: "name" | "description", v: string) => void;
  onSaveItem: (item: ProductManagerModifierGroupItem) => void;
  onDeleteItem: (itemId: string) => void;
  readTranslationField: (t: ProductManagerTranslations | null, locale: "es" | "pt", field: string) => string;
};

function ModifierGroupCard({
  modifierGroup: mg,
  savingId,
  deletingId,
  creatingItemGroupId,
  savingItemId,
  deletingItemId,
  onUpdateTitle,
  onUpdateType,
  onUpdateRequired,
  onUpdateMin,
  onUpdateMax,
  onUpdateTitleES,
  onUpdateTitlePT,
  onSave,
  onRemove,
  onDelete,
  onAddItem,
  onUpdateItem,
  onUpdateItemTranslation,
  onSaveItem,
  onDeleteItem,
  readTranslationField,
}: ModifierGroupCardProps) {
  const [open, setOpen] = React.useState(true);
  const isSaving = savingId === mg.id;
  const isDeleting = deletingId === mg.id;
  const isCreatingItem = creatingItemGroupId === mg.id;

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, overflow: "hidden" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.04)", cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span style={{ fontSize: 11, color: "rgba(245,240,232,0.35)", display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: "#f5f0e8" }}>{mg.title || "(untitled group)"}</span>
        <span style={{ fontSize: 11, color: "rgba(245,240,232,0.35)", marginRight: 4 }}>
          {mg.items.length} item{mg.items.length !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          style={{ padding: "3px 8px", fontSize: 11, borderRadius: 5, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(245,240,232,0.5)", cursor: "pointer" }}
        >
          Detach
        </button>
      </div>

      {open && (
        <div style={{ padding: "16px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <EdFieldLabel>Group title</EdFieldLabel>
              <input value={mg.title} onChange={(e) => onUpdateTitle(e.target.value)} placeholder="e.g. Extras" style={edInput} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                <input value={readTranslationField(mg.translations, "es", "title")} onChange={(e) => onUpdateTitleES(e.target.value)} placeholder="Title (ES)" style={{ ...edInput, fontSize: 12 }} />
                <input value={readTranslationField(mg.translations, "pt", "title")} onChange={(e) => onUpdateTitlePT(e.target.value)} placeholder="Title (PT)" style={{ ...edInput, fontSize: 12 }} />
              </div>
            </div>
            <div>
              <EdFieldLabel>Type</EdFieldLabel>
              <select value={mg.type ?? ""} onChange={(e) => onUpdateType(e.target.value)} style={edSelect}>
                <option value="">—</option>
                <option value="SINGLE">Single</option>
                <option value="MULTI">Multi</option>
              </select>
            </div>
            <div>
              <EdFieldLabel>Required</EdFieldLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.09)" }}>
                <input type="checkbox" id={`req-${mg.id}`} checked={mg.required} onChange={(e) => onUpdateRequired(e.target.checked)} />
                <label htmlFor={`req-${mg.id}`} style={{ fontSize: 13, color: "#f5f0e8", cursor: "pointer" }}>Required</label>
              </div>
            </div>
            <div>
              <EdFieldLabel>Min selection</EdFieldLabel>
              <input type="number" min={0} value={mg.minSelection ?? ""} onChange={(e) => onUpdateMin(e.target.value === "" ? null : Number(e.target.value))} placeholder="0" style={edInput} />
            </div>
            <div>
              <EdFieldLabel>Max selection</EdFieldLabel>
              <input type="number" min={0} value={mg.maxSelection ?? ""} onChange={(e) => onUpdateMax(e.target.value === "" ? null : Number(e.target.value))} placeholder="∞" style={edInput} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button type="button" onClick={onSave} disabled={isSaving || isDeleting} style={{ ...edSecondaryBtn, fontSize: 12 }}>
              {isSaving ? "Saving…" : "Save group"}
            </button>
            <button type="button" onClick={onDelete} disabled={isSaving || isDeleting} style={{ ...edOutlineBtn, fontSize: 12, borderColor: "rgba(255,61,20,0.35)", color: "#ff8066" }}>
              {isDeleting ? "Deleting…" : "Delete group"}
            </button>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(245,240,232,0.5)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Items</span>
              <button type="button" onClick={onAddItem} disabled={isCreatingItem} style={{ ...edSecondaryBtn, fontSize: 11, padding: "4px 10px" }}>
                {isCreatingItem ? "Adding…" : "+ Add item"}
              </button>
            </div>
            {mg.items.length === 0 ? (
              <p style={{ fontSize: 12, color: "rgba(245,240,232,0.3)", padding: "6px 0" }}>No items yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {mg.items.map((item) => {
                  const isSavingItem = savingItemId === item.id;
                  const isDeletingItem = deletingItemId === item.id;
                  return (
                    <div key={item.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "12px 12px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center", marginBottom: 8 }}>
                        <input value={item.name} onChange={(e) => onUpdateItem(item.id, { name: e.target.value })} placeholder="Item name" style={{ ...edInput, fontSize: 13 }} />
                        <input
                          type="number" min={0} step={0.01}
                          value={(item.price / 100).toFixed(2)}
                          onChange={(e) => { const n = Math.round(Number(e.target.value) * 100); onUpdateItem(item.id, { price: Number.isNaN(n) ? 0 : n }); }}
                          placeholder="0.00"
                          style={{ ...edInput, width: 80, fontSize: 13 }}
                        />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button type="button" onClick={() => onSaveItem(item)} disabled={isSavingItem || isDeletingItem} style={{ ...edSecondaryBtn, fontSize: 11, padding: "4px 9px" }}>
                            {isSavingItem ? "…" : "Save"}
                          </button>
                          <button type="button" onClick={() => onDeleteItem(item.id)} disabled={isSavingItem || isDeletingItem} style={{ ...edOutlineBtn, fontSize: 11, padding: "4px 9px", borderColor: "rgba(255,61,20,0.35)", color: "#ff8066" }}>
                            {isDeletingItem ? "…" : "✕"}
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <input value={readTranslationField(item.translations, "es", "name")} onChange={(e) => onUpdateItemTranslation(item.id, "es", "name", e.target.value)} placeholder="Name (ES)" style={{ ...edInput, fontSize: 12 }} />
                        <input value={readTranslationField(item.translations, "pt", "name")} onChange={(e) => onUpdateItemTranslation(item.id, "pt", "name", e.target.value)} placeholder="Name (PT)" style={{ ...edInput, fontSize: 12 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── End editor helpers ─────────────────────────────────────────────────────

export default function ProductManagerList({
  initialCategories,
  initialUncategorized,
  initialLookupModifierGroups,
  initialUberSyncInsights,
  menus,
  selectedMenuId,
  allSections,
}: Props) {
  function normalizeApiBaseUrl(value: string): string {
    return value.replace(/\/+$/, "").replace(/\/api$/, "");
  }

  const photoFileInputId = "product-photo-upload-input";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState(initialCategories);
  const [uncategorized, setUncategorized] = useState(initialUncategorized);
  const [lookupModifierGroups, setLookupModifierGroups] = useState(
    initialLookupModifierGroups,
  );
  const [localMenus, setLocalMenus] = useState(menus);
  const [settingDefaultMenuId, setSettingDefaultMenuId] = useState<string | null>(null);
  const [availableStations, setAvailableStations] = useState<AvailableStation[]>([]);
  const [editorNameTranslationsOpen, setEditorNameTranslationsOpen] = useState(false);
  const [editorDescTranslationsOpen, setEditorDescTranslationsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [dragProduct, setDragProduct] = useState<DragProductState | null>(null);
  const [persistingReorder, setPersistingReorder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<ProductEditorState | null>(null);
  const [switchingMenu, setSwitchingMenu] = useState(false);
  const [creatingMenu, setCreatingMenu] = useState(false);
  const [importingMenu, setImportingMenu] = useState(false);
  const [linkingSection, setLinkingSection] = useState(false);
  const [creatingSection, setCreatingSection] = useState(false);
  const [detachingSectionId, setDetachingSectionId] = useState<string | null>(null);
  const [syncFilter, setSyncFilter] = useState<SyncFilter>("ALL");
  const [syncPreviewOpen, setSyncPreviewOpen] = useState(false);
  const [menuSelectorOpen, setMenuSelectorOpen] = useState(false);
  const translationsSectionRef = useRef<HTMLElement | null>(null);
  const importMenuInputRef = useRef<HTMLInputElement | null>(null);

  function exportMenu() {
    const activeMenu = localMenus.find((m) => m.id === selectedMenuId);
    const payload = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      menu: activeMenu
        ? { id: activeMenu.id, name: activeMenu.name }
        : { id: selectedMenuId, name: "Unknown" },
      /*
       * FORMAT REFERENCE
       * ─────────────────────────────────────────────────────────────────────
       * categories[].menuIndex          — display order within the menu (0-based)
       * categories[].products[].categoryIndex — display order within the section
       * price / comparedAtPrice / modifierGroups[].items[].price — integers in CENTS
       *   (e.g. $12.99 → 1299).  Divide by 100 to get dollars.
       * itemType                        — "PRODUCT" | "COMBO"
       *   PRODUCT: normal item.  COMBO: bundle with dynamic slots or fixed products.
       * comboSlots                      — dynamic combo: customer picks from options
       *   comboSlots[].options[].extraPrice — extra cost on top of the combo price
       * products                        — fixed-quantity combo items (legacy)
       * modifierGroups[].type           — "SINGLE" (radio) | "MULTI" (checkbox) | null
       * modifierGroups[].required       — whether at least minSelection must be chosen
       * translations                    — { "<locale>": { name?, description?, title? } }
       *   e.g. { "es": { "name": "Hamburguesa" }, "pt": { "name": "Hambúrguer" } }
       * photos                          — hosted image URLs; re-upload before importing
       *   to a different store (URLs are bound to the original storage bucket)
       * ─────────────────────────────────────────────────────────────────────
       */
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.title,
        menuIndex: cat.menuIndex,
        products: cat.products.map((p) => ({
          id: p.id,
          itemType: p.itemType,
          name: p.name,
          description: p.description,
          price: p.price,
          comparedAtPrice: p.comparedAtPrice,
          visible: p.visible,
          categoryIndex: p.categoryIndex,
          translations: p.translations,
          photos: p.photoUrls,
          preparationStepIds: p.preparationStepIds,
          preparationTasks: p.preparationTasks.map((task) => ({
            id: task.id,
            name: task.name,
            stationId: task.stationId,
            stationName: task.stationName,
            includeComments: task.includeComments,
            includeModifiers: task.includeModifiers,
          })),
          modifierGroups: p.modifierGroups.map((g) => ({
            id: g.id,
            title: g.title,
            required: g.required,
            type: g.type,
            minSelection: g.minSelection,
            maxSelection: g.maxSelection,
            translations: g.translations,
            items: g.items.map((item) => ({
              id: item.id,
              name: item.name,
              description: item.description,
              price: item.price,
              translations: item.translations,
              photoUrl: item.photoUrl,
            })),
          })),
          comboSlots: p.comboSlots.map((slot) => ({
            id: slot.id,
            name: slot.name,
            translations: slot.translations,
            minSelect: slot.minSelect,
            maxSelect: slot.maxSelect,
            allowDuplicates: slot.allowDuplicates,
            sortIndex: slot.sortIndex,
            options: slot.options.map((opt) => ({
              productId: opt.productId,
              productName: opt.productName,
              extraPrice: opt.extraPrice,
              sortIndex: opt.sortIndex,
            })),
          })),
          products: p.products.map((fp) => ({
            productId: fp.productId,
            productName: fp.productName,
            quantity: fp.quantity,
          })),
        })),
      })),
      uncategorized: uncategorized.map((p) => ({
        id: p.id,
        itemType: p.itemType,
        name: p.name,
        description: p.description,
        price: p.price,
        comparedAtPrice: p.comparedAtPrice,
        visible: p.visible,
        translations: p.translations,
        photos: p.photoUrls,
        preparationStepIds: p.preparationStepIds,
        preparationTasks: p.preparationTasks.map((task) => ({
          id: task.id,
          name: task.name,
          stationId: task.stationId,
          stationName: task.stationName,
          includeComments: task.includeComments,
          includeModifiers: task.includeModifiers,
        })),
        modifierGroups: p.modifierGroups.map((g) => ({
          id: g.id,
          title: g.title,
          required: g.required,
          type: g.type,
          minSelection: g.minSelection,
          maxSelection: g.maxSelection,
          translations: g.translations,
          items: g.items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            translations: item.translations,
            photoUrl: item.photoUrl,
          })),
        })),
        comboSlots: p.comboSlots.map((slot) => ({
          id: slot.id,
          name: slot.name,
          translations: slot.translations,
          minSelect: slot.minSelect,
          maxSelect: slot.maxSelect,
          allowDuplicates: slot.allowDuplicates,
          sortIndex: slot.sortIndex,
          options: slot.options.map((opt) => ({
            productId: opt.productId,
            productName: opt.productName,
            extraPrice: opt.extraPrice,
            sortIndex: opt.sortIndex,
          })),
        })),
        products: p.products.map((fp) => ({
          productId: fp.productId,
          productName: fp.productName,
          quantity: fp.quantity,
        })),
      })),
      lookupModifierGroups: lookupModifierGroups.map((g) => ({
        id: g.id,
        title: g.title,
        required: g.required,
        type: g.type,
        minSelection: g.minSelection,
        maxSelection: g.maxSelection,
        translations: g.translations,
        items: g.items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          translations: item.translations,
          photoUrl: item.photoUrl,
        })),
      })),
    };

    const menuName = activeMenu?.name ?? "menu";
    const filename = `${menuName.toLowerCase().replace(/\s+/g, "-")}-export-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  const esTranslationNameInputRef = useRef<HTMLInputElement | null>(null);
  const ptTranslationNameInputRef = useRef<HTMLInputElement | null>(null);
  const apiBaseUrl = useMemo(
    () =>
      normalizeApiBaseUrl(
        process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:4000",
      ),
    [],
  );
  const menuPreviewBaseUrl = useMemo(
    () =>
      process.env.NEXT_PUBLIC_MENU_PREVIEW_BASE_URL?.trim() ||
      "http://localhost:3000",
    [],
  );

  async function apiFetch(inputPath: string, init?: RequestInit) {
    const normalizedPath =
      inputPath === "/api"
        ? "/"
        : inputPath.startsWith("/api/")
          ? inputPath.slice(4)
          : inputPath;
    const requestUrl = `${apiBaseUrl}${normalizedPath}`;
    const headers = new Headers(init?.headers);
    const tokenFromCookie =
      typeof window !== "undefined"
        ? document.cookie
            .split(";")
            .map((chunk) => chunk.trim())
            .find((chunk) => chunk.startsWith(`${ACCESS_TOKEN_COOKIE_NAME}=`))
            ?.split("=")
            .slice(1)
            .join("=")
            .trim() || ""
        : "";
    const accessToken =
      typeof window !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)?.trim() ||
          (tokenFromCookie ? decodeURIComponent(tokenFromCookie) : "") ||
          ""
        : "";
    const businessIdFromCookie =
      typeof window !== "undefined"
        ? document.cookie
            .split(";")
            .map((chunk) => chunk.trim())
            .find((chunk) => chunk.startsWith("manager_business_id="))
            ?.split("=")
            .slice(1)
            .join("=")
            .trim() || ""
        : "";
    const businessId =
      typeof window !== "undefined"
        ? localStorage.getItem(BUSINESS_ID_STORAGE_KEY)?.trim() ||
          (businessIdFromCookie ? decodeURIComponent(businessIdFromCookie) : "") ||
          ""
        : "";

    if (accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    if (businessId && !headers.has("x-business-id")) {
      headers.set("x-business-id", businessId);
    }

    return globalThis.fetch(requestUrl, {
      ...init,
      headers,
    });
  }

  const categoryViews = useMemo<CategoryView[]>(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const source: CategoryView[] = categories.map((category) => ({
      id: category.id,
      title: category.title,
      products: category.products,
    }));

    if (!normalizedSearch) return source;

    return source
      .map((category) => ({
        ...category,
        products: category.products.filter((product) =>
          product.name.toLowerCase().includes(normalizedSearch),
        ),
      }))
      .filter(
        (category) =>
          category.products.length > 0 ||
          category.title.toLowerCase().includes(normalizedSearch),
      );
  }, [categories, search]);

  const availableSectionsToLink = useMemo(
    () =>
      allSections.filter(
        (section) => !categories.some((category) => category.id === section.id),
      ),
    [allSections, categories],
  );

  const productLookupList = useMemo(() => {
    const byId = new Map<string, { id: string; name: string }>();

    for (const category of categories) {
      for (const product of category.products) {
        byId.set(product.id, { id: product.id, name: product.name });
      }
    }

    for (const product of uncategorized) {
      byId.set(product.id, { id: product.id, name: product.name });
    }

    return Array.from(byId.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [categories, uncategorized]);

  const productNameById = useMemo(
    () => new Map(productLookupList.map((product) => [product.id, product.name])),
    [productLookupList],
  );

  const syncInsightsByProductId = useMemo(() => {
    const entries = Array.isArray(initialUberSyncInsights?.items)
      ? initialUberSyncInsights.items
      : [];
    const mapped = entries
      .map((item): ProductSyncInsight | null => {
        if (!item || typeof item.productId !== "string") return null;
        const normalizedStatus =
          item.status === "SYNCED" ||
          item.status === "NEEDS_SYNC" ||
          item.status === "NOT_SYNCED" ||
          item.status === "EXCLUDED"
            ? item.status
            : "NOT_SYNCED";
        return {
          productId: item.productId,
          status: normalizedStatus,
          reason:
            typeof item.reason === "string" && item.reason.trim().length > 0
              ? item.reason
              : "No details available",
          categoryId: typeof item.categoryId === "string" ? item.categoryId : null,
        };
      })
      .filter((item): item is ProductSyncInsight => item !== null);
    return new Map(mapped.map((item) => [item.productId, item]));
  }, [initialUberSyncInsights]);

  const syncSummary = useMemo(() => {
    const summary = initialUberSyncInsights?.summary;
    const synced =
      typeof summary?.synced === "number"
        ? summary.synced
        : Array.from(syncInsightsByProductId.values()).filter(
            (item) => item.status === "SYNCED",
          ).length;
    const needsSync =
      typeof summary?.needsSync === "number"
        ? summary.needsSync
        : Array.from(syncInsightsByProductId.values()).filter(
            (item) => item.status === "NEEDS_SYNC",
          ).length;
    const notSynced =
      typeof summary?.notSynced === "number"
        ? summary.notSynced
        : Array.from(syncInsightsByProductId.values()).filter(
            (item) => item.status === "NOT_SYNCED",
          ).length;
    const excluded =
      typeof summary?.excluded === "number"
        ? summary.excluded
        : Array.from(syncInsightsByProductId.values()).filter(
            (item) => item.status === "EXCLUDED",
          ).length;
    const totalItems =
      typeof summary?.totalItems === "number"
        ? summary.totalItems
        : synced + needsSync + notSynced + excluded;

    return { synced, needsSync, notSynced, excluded, totalItems };
  }, [initialUberSyncInsights, syncInsightsByProductId]);

  const latestSyncRun = initialUberSyncInsights?.latestRun ?? null;

  const syncPreviewGroups = useMemo(() => {
    function normalizeGroup(value: unknown): SyncPreviewItem[] {
      if (!Array.isArray(value)) return [];
      return value
        .map((entry): SyncPreviewItem | null => {
          if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
          const record = entry as {
            categoryId?: unknown;
            categoryName?: unknown;
            productId?: unknown;
            productName?: unknown;
            reason?: unknown;
          };
          if (
            typeof record.productId !== "string" ||
            typeof record.productName !== "string"
          ) {
            return null;
          }
          return {
            categoryId:
              typeof record.categoryId === "string" ? record.categoryId : null,
            categoryName:
              typeof record.categoryName === "string" ? record.categoryName : null,
            productId: record.productId,
            productName: record.productName,
            reason:
              typeof record.reason === "string" && record.reason.trim().length > 0
                ? record.reason
                : "No details available",
          };
        })
        .filter((item): item is SyncPreviewItem => item !== null);
    }

    return {
      toCreate: normalizeGroup(initialUberSyncInsights?.groups?.toCreate),
      toUpdate: normalizeGroup(initialUberSyncInsights?.groups?.toUpdate),
      toDisable: normalizeGroup(initialUberSyncInsights?.groups?.toDisable),
      noChange: normalizeGroup(initialUberSyncInsights?.groups?.noChange),
    };
  }, [initialUberSyncInsights]);

  function getProductSyncInsight(productId: string): ProductSyncInsight {
    return (
      syncInsightsByProductId.get(productId) ?? {
        productId,
        status: "NOT_SYNCED",
        reason: "Not mapped yet on Uber Eats",
        categoryId: null,
      }
    );
  }

  const filteredCategoryViews = useMemo(() => {
    if (syncFilter === "ALL") return categoryViews;
    return categoryViews
      .map((category) => ({
        ...category,
        products: category.products.filter(
          (product) => getProductSyncInsight(product.id).status === syncFilter,
        ),
      }))
      .filter((category) => category.products.length > 0);
  }, [categoryViews, syncFilter, syncInsightsByProductId]);

  useEffect(() => {
    setCategories(initialCategories);
    setUncategorized(initialUncategorized);
    setLookupModifierGroups(initialLookupModifierGroups);
    setCollapsed({});
    setDragProduct(null);
    setPersistingReorder(false);
    setSavingProductId(null);
    setEditor(null);
    setError(null);
    setSearch("");
    setSyncFilter("ALL");
    setSyncPreviewOpen(false);
  }, [
    initialCategories,
    initialUncategorized,
    initialLookupModifierGroups,
    selectedMenuId,
  ]);

  useEffect(() => {
    if (!editor) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !editor.saving) {
        setEditor(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editor]);

  const editorOpenRef = useRef(false);
  useEffect(() => {
    if (editor && !editorOpenRef.current) {
      editorOpenRef.current = true;
      apiFetch("/api/stations")
        .then((r) => r.json())
        .then((data: unknown) => {
          const raw = (data as { items?: unknown[] })?.items ?? [];
          const items: AvailableStation[] = raw.map((s: unknown) => {
            const st = s as { id?: string; name?: string; preparationSteps?: unknown[] };
            return {
              id: typeof st.id === "string" ? st.id : "",
              name: typeof st.name === "string" ? st.name : "",
              preparationSteps: Array.isArray(st.preparationSteps)
                ? st.preparationSteps.map((p: unknown) => {
                    const step = p as { id?: string; name?: string; goalMinutes?: number; includeComments?: boolean; includeModifiers?: boolean };
                    return {
                      id: typeof step.id === "string" ? step.id : "",
                      name: typeof step.name === "string" ? step.name : "",
                      goalMinutes: typeof step.goalMinutes === "number" ? step.goalMinutes : 0,
                      includeComments: step.includeComments === true,
                      includeModifiers: step.includeModifiers === true,
                    };
                  }).filter((p) => p.id)
                : [],
            };
          }).filter((s) => s.id);
          setAvailableStations(items);
        })
        .catch(() => {});
    }
    if (!editor) {
      editorOpenRef.current = false;
      setEditorNameTranslationsOpen(false);
      setEditorDescTranslationsOpen(false);
    }
  }, [editor]);

  useEffect(() => {
    setSwitchingMenu(false);
  }, [selectedMenuId]);

  useEffect(() => {
    if (!editor || editor.focusSection !== "translations") return;

    const frameId = window.requestAnimationFrame(() => {
      translationsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      if (editor.activeLanguage === "pt") {
        ptTranslationNameInputRef.current?.focus();
      } else {
        esTranslationNameInputRef.current?.focus();
      }
    });

    setEditor((current) => {
      if (!current || current.focusSection !== "translations") return current;
      return {
        ...current,
        focusSection: null,
      };
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [editor]);

  function setProductVisibility(productId: string, visible: boolean) {
    setCategories((current) =>
      current.map((category) => ({
        ...category,
        products: category.products.map((product) =>
          product.id === productId ? { ...product, visible } : product,
        ),
      })),
    );

    setUncategorized((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, visible } : product,
      ),
    );

    setEditor((current) => {
      if (!current || current.productId !== productId) return current;
      return {
        ...current,
        visible,
      };
    });
  }

  function onMenuChange(nextMenuId: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextMenuId.trim().length > 0) {
      params.set("menuId", nextMenuId);
    } else {
      params.delete("menuId");
    }

    const query = params.toString();
    setSwitchingMenu(true);
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function onPreviewMenu() {
    const previewUrl = `${menuPreviewBaseUrl.replace(/\/$/, "")}/menu/en?menuId=${encodeURIComponent(selectedMenuId)}`;
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  }

  function getOrderedCategoryIds(): string[] {
    return categories
      .slice()
      .sort((left, right) => {
        const leftIndex =
          typeof left.menuIndex === "number" ? left.menuIndex : Number.MAX_SAFE_INTEGER;
        const rightIndex =
          typeof right.menuIndex === "number" ? right.menuIndex : Number.MAX_SAFE_INTEGER;

        if (leftIndex !== rightIndex) return leftIndex - rightIndex;
        return left.title.localeCompare(right.title);
      })
      .map((category) => category.id);
  }

  async function persistSectionOrder(sectionIdsOrdered: string[]) {
    for (let index = 0; index < sectionIdsOrdered.length; index += 1) {
      const sectionId = sectionIdsOrdered[index];
      const response = await apiFetch(
        `/api/categories/${encodeURIComponent(sectionId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            menuId: selectedMenuId,
            menuIndex: index + 1,
          }),
        },
      );

      if (response.ok) continue;

      const payload = (await response.json().catch(() => ({}))) as {
        error?: unknown;
      };
      throw new Error(
        typeof payload.error === "string"
          ? payload.error
          : "Failed to persist section order",
      );
    }
  }

  async function onLinkSectionAtIndex(sectionId: string, insertionIndex: number) {
    const normalizedSectionId = sectionId.trim();
    if (!normalizedSectionId) return;

    try {
      setLinkingSection(true);
      setError(null);

      const existingIds = getOrderedCategoryIds().filter(
        (id) => id !== normalizedSectionId,
      );
      const boundedInsertionIndex = Math.min(
        Math.max(insertionIndex, 0),
        existingIds.length,
      );
      const nextOrder = [
        ...existingIds.slice(0, boundedInsertionIndex),
        normalizedSectionId,
        ...existingIds.slice(boundedInsertionIndex),
      ];

      await persistSectionOrder(nextOrder);
      router.refresh();
    } catch (linkError) {
      setError(
        linkError instanceof Error ? linkError.message : "Failed to link section",
      );
    } finally {
      setLinkingSection(false);
    }
  }

  async function onCreateSectionAtIndex(
    sectionName: string,
    insertionIndex: number,
  ) {
    const normalizedSectionName = sectionName.trim();
    if (!normalizedSectionName) return;

    try {
      setCreatingSection(true);
      setError(null);

      const response = await apiFetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: normalizedSectionName,
          menuId: selectedMenuId,
          menuIndex: null,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: unknown;
        };
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Failed to create section",
        );
      }

      const payload = (await response.json().catch(() => ({}))) as {
        id?: unknown;
      };
      if (typeof payload.id !== "string" || !payload.id.trim()) {
        throw new Error("Section created but response is invalid");
      }

      const createdSectionId = payload.id.trim();
      const existingIds = getOrderedCategoryIds().filter(
        (id) => id !== createdSectionId,
      );
      const boundedInsertionIndex = Math.min(
        Math.max(insertionIndex, 0),
        existingIds.length,
      );
      const nextOrder = [
        ...existingIds.slice(0, boundedInsertionIndex),
        createdSectionId,
        ...existingIds.slice(boundedInsertionIndex),
      ];

      await persistSectionOrder(nextOrder);
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create section",
      );
    } finally {
      setCreatingSection(false);
    }
  }

  async function onDetachSection(sectionId: string) {
    const normalizedSectionId = sectionId.trim();
    if (!normalizedSectionId) return;

    const targetSection = categories.find((category) => category.id === normalizedSectionId);
    const sectionTitle = targetSection?.title || "this section";
    const confirmed = window.confirm(
      `Detach "${sectionTitle}" from this menu? This will not delete the section.`,
    );

    if (!confirmed) return;

    try {
      setDetachingSectionId(normalizedSectionId);
      setError(null);

      const response = await apiFetch(
        `/api/categories/${encodeURIComponent(
          normalizedSectionId,
        )}?menuId=${encodeURIComponent(selectedMenuId)}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: unknown;
        };
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Failed to detach section",
        );
      }

      router.refresh();
    } catch (detachError) {
      setError(
        detachError instanceof Error
          ? detachError.message
          : "Failed to detach section",
      );
    } finally {
      setDetachingSectionId(null);
    }
  }

  async function parseJsonResponseSafe(response: Response): Promise<unknown> {
    return response.json().catch(() => ({}));
  }

  function extractErrorMessage(payload: unknown, fallback: string): string {
    if (!payload || typeof payload !== "object") return fallback;

    if ("error" in payload && typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }

    if ("field" in payload && typeof payload.field === "string" && payload.field.trim()) {
      return `Invalid ${payload.field}`;
    }

    return fallback;
  }

  function normalizeLookupName(value: string): string {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
  }

  function pickPrimaryCategoryRef(
    refs: Array<{ oldCategoryId: string | null; categoryIndex: number | null }>,
  ): { oldCategoryId: string | null; categoryIndex: number | null } | null {
    if (refs.length === 0) return null;
    const withCategory = refs.find((ref) => ref.oldCategoryId);
    return withCategory ?? refs[0] ?? null;
  }

  async function onImportMenuFile(file: File) {
    setImportingMenu(true);
    setError(null);

    try {
      const rawText = await file.text();
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawText);
      } catch {
        throw new Error("Invalid JSON file");
      }

      const imported = parseMenuExportPayload(parsedJson);
      const suggestedMenuName =
        imported.menu?.name && imported.menu.name.trim().length > 0
          ? `${imported.menu.name.trim()} Copy`
          : "Imported menu";
      const nameInput = window.prompt("Name for imported menu", suggestedMenuName);
      const menuName = nameInput?.trim();
      if (!menuName) {
        setImportingMenu(false);
        return;
      }

      const createMenuResponse = await apiFetch("/api/menus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: menuName,
          active: true,
        }),
      });

      const createMenuPayload = await parseJsonResponseSafe(createMenuResponse);
      if (!createMenuResponse.ok) {
        throw new Error(extractErrorMessage(createMenuPayload, "Failed to create menu"));
      }

      const createMenuData =
        createMenuPayload && typeof createMenuPayload === "object"
          ? (createMenuPayload as { id?: unknown })
          : null;

      if (
        !createMenuData ||
        typeof createMenuData.id !== "string" ||
        !createMenuData.id.trim()
      ) {
        throw new Error("Menu created but response is invalid");
      }

      const importedMenuId = createMenuData.id.trim();
      const categoryIdMap = new Map<string, string>();
      const modifierGroupIdMap = new Map<string, string>();
      const productIdMap = new Map<string, string>();
      type ImportStation = {
        id: string;
        name: string;
        preparationSteps: Array<{
          id: string;
          name: string;
          includeComments: boolean;
          includeModifiers: boolean;
        }>;
      };
      const stationByNameKey = new Map<string, ImportStation>();
      const stepIdBySignature = new Map<string, string>();

      const stationsResponse = await apiFetch("/api/stations");
      const stationsPayload = await parseJsonResponseSafe(stationsResponse);
      if (!stationsResponse.ok) {
        throw new Error(
          extractErrorMessage(stationsPayload, "Failed to load stations"),
        );
      }

      const existingStations = Array.isArray(
        (stationsPayload as { items?: unknown }).items,
      )
        ? ((stationsPayload as { items: unknown[] }).items ?? [])
        : [];

      for (const stationValue of existingStations) {
        if (!stationValue || typeof stationValue !== "object") continue;
        const stationRecord = stationValue as {
          id?: unknown;
          name?: unknown;
          preparationSteps?: unknown;
        };
        if (
          typeof stationRecord.id !== "string" ||
          typeof stationRecord.name !== "string"
        ) {
          continue;
        }

        const station: ImportStation = {
          id: stationRecord.id,
          name: stationRecord.name,
          preparationSteps: Array.isArray(stationRecord.preparationSteps)
            ? stationRecord.preparationSteps
                .map((stepValue) => {
                  if (!stepValue || typeof stepValue !== "object") return null;
                  const stepRecord = stepValue as {
                    id?: unknown;
                    name?: unknown;
                    includeComments?: unknown;
                    includeModifiers?: unknown;
                  };
                  if (
                    typeof stepRecord.id !== "string" ||
                    typeof stepRecord.name !== "string"
                  ) {
                    return null;
                  }
                  return {
                    id: stepRecord.id,
                    name: stepRecord.name,
                    includeComments: stepRecord.includeComments === true,
                    includeModifiers: stepRecord.includeModifiers === true,
                  };
                })
                .filter(
                  (
                    step,
                  ): step is {
                    id: string;
                    name: string;
                    includeComments: boolean;
                    includeModifiers: boolean;
                  } => step !== null,
                )
            : [],
        };

        stationByNameKey.set(normalizeLookupName(station.name), station);
        for (const step of station.preparationSteps) {
          const stepSignature = `${station.id}::${normalizeLookupName(
            step.name,
          )}::${step.includeComments ? "1" : "0"}::${
            step.includeModifiers ? "1" : "0"
          }`;
          stepIdBySignature.set(stepSignature, step.id);
        }
      }

      const ensureStationByName = async (stationName: string): Promise<ImportStation> => {
        const normalizedStationName = stationName.trim();
        const stationKey = normalizeLookupName(normalizedStationName);
        const existing = stationByNameKey.get(stationKey);
        if (existing) return existing;

        const createStationResponse = await apiFetch("/api/stations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: normalizedStationName,
          }),
        });
        const createStationPayload = await parseJsonResponseSafe(
          createStationResponse,
        );
        if (!createStationResponse.ok) {
          throw new Error(
            extractErrorMessage(createStationPayload, "Failed to create station"),
          );
        }

        const createdStationRecord =
          createStationPayload && typeof createStationPayload === "object"
            ? (createStationPayload as { id?: unknown; name?: unknown })
            : null;
        if (
          !createdStationRecord ||
          typeof createdStationRecord.id !== "string" ||
          typeof createdStationRecord.name !== "string"
        ) {
          throw new Error("Station created but response is invalid");
        }

        const createdStation: ImportStation = {
          id: createdStationRecord.id,
          name: createdStationRecord.name,
          preparationSteps: [],
        };
        stationByNameKey.set(stationKey, createdStation);
        return createdStation;
      };

      const ensurePreparationStepId = async (
        task: MenuExportPreparationTask,
      ): Promise<string | null> => {
        const stepName = task.name.trim();
        if (!stepName) return null;

        const fallbackStationName = "General";
        const stationName =
          (task.stationName && task.stationName.trim()) || fallbackStationName;
        const station = await ensureStationByName(stationName);

        const signature = `${station.id}::${normalizeLookupName(stepName)}::${
          task.includeComments ? "1" : "0"
        }::${task.includeModifiers ? "1" : "0"}`;
        const existingStepId = stepIdBySignature.get(signature);
        if (existingStepId) return existingStepId;

        const matchedStationStep = station.preparationSteps.find(
          (step) =>
            normalizeLookupName(step.name) === normalizeLookupName(stepName) &&
            step.includeComments === task.includeComments &&
            step.includeModifiers === task.includeModifiers,
        );
        if (matchedStationStep) {
          stepIdBySignature.set(signature, matchedStationStep.id);
          return matchedStationStep.id;
        }

        const createStepResponse = await apiFetch(
          `/api/stations/${encodeURIComponent(station.id)}/steps`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: stepName,
              includeComments: task.includeComments,
              includeModifiers: task.includeModifiers,
            }),
          },
        );
        const createStepPayload = await parseJsonResponseSafe(createStepResponse);
        if (!createStepResponse.ok) {
          throw new Error(
            extractErrorMessage(
              createStepPayload,
              "Failed to create preparation task",
            ),
          );
        }

        const createdStepRecord =
          createStepPayload && typeof createStepPayload === "object"
            ? (createStepPayload as {
                id?: unknown;
                name?: unknown;
                includeComments?: unknown;
                includeModifiers?: unknown;
              })
            : null;
        if (
          !createdStepRecord ||
          typeof createdStepRecord.id !== "string" ||
          typeof createdStepRecord.name !== "string"
        ) {
          throw new Error("Preparation task created but response is invalid");
        }

        station.preparationSteps.push({
          id: createdStepRecord.id,
          name: createdStepRecord.name,
          includeComments:
            createdStepRecord.includeComments === true || task.includeComments,
          includeModifiers:
            createdStepRecord.includeModifiers === true || task.includeModifiers,
        });
        stepIdBySignature.set(signature, createdStepRecord.id);
        return createdStepRecord.id;
      };

      const sortedCategories = imported.categories.slice().sort((left, right) => {
        const leftIndex =
          typeof left.menuIndex === "number" ? left.menuIndex : Number.MAX_SAFE_INTEGER;
        const rightIndex =
          typeof right.menuIndex === "number" ? right.menuIndex : Number.MAX_SAFE_INTEGER;
        return leftIndex - rightIndex;
      });

      for (let index = 0; index < sortedCategories.length; index += 1) {
        const sourceCategory = sortedCategories[index];
        const newCategoryId = createLocalId();
        const menuIndex =
          typeof sourceCategory.menuIndex === "number"
            ? sourceCategory.menuIndex
            : index;

        const createCategoryResponse = await apiFetch("/api/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: newCategoryId,
            name: sourceCategory.name,
            menuId: importedMenuId,
            menuIndex,
          }),
        });

        const createCategoryPayload = await parseJsonResponseSafe(createCategoryResponse);
        if (!createCategoryResponse.ok) {
          throw new Error(
            extractErrorMessage(createCategoryPayload, "Failed to create section"),
          );
        }

        categoryIdMap.set(sourceCategory.id, newCategoryId);
      }

      const modifierGroupsByOldId = new Map<string, MenuExportModifierGroup>();
      const collectModifierGroup = (group: MenuExportModifierGroup) => {
        const existing = modifierGroupsByOldId.get(group.id);
        if (existing) return;
        modifierGroupsByOldId.set(group.id, group);
      };

      for (const group of imported.lookupModifierGroups) {
        collectModifierGroup(group);
      }
      for (const category of imported.categories) {
        for (const product of category.products) {
          for (const group of product.modifierGroups) {
            collectModifierGroup(group);
          }
        }
      }
      for (const product of imported.uncategorized) {
        for (const group of product.modifierGroups) {
          collectModifierGroup(group);
        }
      }

      for (const sourceGroup of modifierGroupsByOldId.values()) {
        const newModifierGroupId = createLocalId();
        const createModifierGroupResponse = await apiFetch("/api/modifier-groups", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: newModifierGroupId,
            title: sourceGroup.title,
            required: sourceGroup.required,
            type: sourceGroup.type,
            minSelection: sourceGroup.minSelection,
            maxSelection: sourceGroup.maxSelection,
            translations: sourceGroup.translations,
          }),
        });

        const createModifierGroupPayload = await parseJsonResponseSafe(
          createModifierGroupResponse,
        );
        if (!createModifierGroupResponse.ok) {
          throw new Error(
            extractErrorMessage(
              createModifierGroupPayload,
              "Failed to create modifier group",
            ),
          );
        }

        modifierGroupIdMap.set(sourceGroup.id, newModifierGroupId);

        for (const sourceItem of sourceGroup.items) {
          const createItemResponse = await apiFetch("/api/modifier-group-items", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: createLocalId(),
              modifierGroupId: newModifierGroupId,
              name: sourceItem.name,
              description: sourceItem.description,
              price: sourceItem.price,
              translations: sourceItem.translations,
            }),
          });

          const createItemPayload = await parseJsonResponseSafe(createItemResponse);
          if (!createItemResponse.ok) {
            throw new Error(
              extractErrorMessage(createItemPayload, "Failed to create modifier item"),
            );
          }
        }
      }

      type ProductImportDraft = {
        source: MenuExportProduct;
        categoryRefs: Array<{
          oldCategoryId: string | null;
          categoryIndex: number | null;
        }>;
      };
      const productsByOldId = new Map<string, ProductImportDraft>();
      const upsertProductDraft = (
        product: MenuExportProduct,
        categoryRef: { oldCategoryId: string | null; categoryIndex: number | null },
      ) => {
        const existing = productsByOldId.get(product.id);
        if (!existing) {
          productsByOldId.set(product.id, {
            source: product,
            categoryRefs: [categoryRef],
          });
          return;
        }

        existing.categoryRefs.push(categoryRef);
      };

      for (const category of sortedCategories) {
        const orderedProducts = category.products
          .slice()
          .sort((left, right) => {
            const leftIndex =
              typeof left.categoryIndex === "number"
                ? left.categoryIndex
                : Number.MAX_SAFE_INTEGER;
            const rightIndex =
              typeof right.categoryIndex === "number"
                ? right.categoryIndex
                : Number.MAX_SAFE_INTEGER;
            return leftIndex - rightIndex;
          });

        for (const product of orderedProducts) {
          upsertProductDraft(product, {
            oldCategoryId: category.id,
            categoryIndex: product.categoryIndex,
          });
        }
      }

      for (const product of imported.uncategorized) {
        upsertProductDraft(product, {
          oldCategoryId: null,
          categoryIndex: product.categoryIndex,
        });
      }

      const productDrafts = Array.from(productsByOldId.values());
      for (const draft of productDrafts) {
        productIdMap.set(draft.source.id, createLocalId());
      }

      for (const draft of productDrafts) {
        const newProductId = productIdMap.get(draft.source.id);
        if (!newProductId) {
          throw new Error("Failed to prepare product mapping");
        }

        const primaryCategoryRef = pickPrimaryCategoryRef(draft.categoryRefs);
        const primaryCategoryId =
          primaryCategoryRef?.oldCategoryId
            ? categoryIdMap.get(primaryCategoryRef.oldCategoryId) ?? null
            : null;
        const linkedCategoryIds = Array.from(
          new Set(
            draft.categoryRefs
              .map((ref) =>
                ref.oldCategoryId ? categoryIdMap.get(ref.oldCategoryId) ?? null : null,
              )
              .filter((id): id is string => Boolean(id)),
          ),
        );

        const mappedModifierGroupIds = Array.from(
          new Set(
            draft.source.modifierGroups
              .map((group) => modifierGroupIdMap.get(group.id) ?? null)
              .filter((id): id is string => Boolean(id)),
          ),
        );
        const mappedPreparationStepIds =
          draft.source.preparationTasks.length > 0
            ? Array.from(
                new Set(
                  (
                    await Promise.all(
                      draft.source.preparationTasks.map((task) =>
                        ensurePreparationStepId(task),
                      ),
                    )
                  ).filter((stepId): stepId is string => Boolean(stepId)),
                ),
              )
            : draft.source.preparationStepIds;

        const createProductResponse = await apiFetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: newProductId,
            itemType: draft.source.itemType,
            name: draft.source.name,
            visible: draft.source.visible,
            description: draft.source.description,
            price: draft.source.price,
            comparedAtPrice: draft.source.comparedAtPrice,
            categoryId: primaryCategoryId,
            categoryIds: linkedCategoryIds,
            categoryIndex: primaryCategoryRef?.categoryIndex ?? null,
            translations: draft.source.translations,
            photoUrls: draft.source.photos,
            modifierGroupIds: mappedModifierGroupIds,
            preparationStepIds: mappedPreparationStepIds,
            comboSlots: [],
            products: [],
          }),
        });

        const createProductPayload = await parseJsonResponseSafe(createProductResponse);
        if (!createProductResponse.ok) {
          throw new Error(extractErrorMessage(createProductPayload, "Failed to create product"));
        }
      }

      for (const draft of productDrafts) {
        if (draft.source.itemType !== "COMBO") continue;

        const newProductId = productIdMap.get(draft.source.id);
        if (!newProductId) continue;

        const mappedComboSlots = draft.source.comboSlots.map((slot, slotIndex) => ({
          name: slot.name,
          translations: slot.translations,
          minSelect: slot.minSelect,
          maxSelect: slot.maxSelect,
          allowDuplicates: slot.allowDuplicates,
          sortIndex: slot.sortIndex ?? slotIndex + 1,
          options: slot.options
            .map((option, optionIndex) => {
              const mappedProductId = productIdMap.get(option.productId);
              if (!mappedProductId) return null;
              return {
                productId: mappedProductId,
                extraPrice: option.extraPrice,
                sortIndex: option.sortIndex ?? optionIndex + 1,
              };
            })
            .filter(
              (
                option,
              ): option is { productId: string; extraPrice: number; sortIndex: number } =>
                option !== null,
            ),
        }));

        const mappedDirectProducts = draft.source.products
          .map((item) => {
            const mappedProductId = productIdMap.get(item.productId);
            if (!mappedProductId) return null;
            return {
              productId: mappedProductId,
              quantity: item.quantity,
            };
          })
          .filter(
            (item): item is { productId: string; quantity: number } => item !== null,
          );

        const updateComboResponse = await apiFetch(
          `/api/products/${encodeURIComponent(newProductId)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              itemType: "COMBO",
              comboSlots: mappedComboSlots,
              products: mappedDirectProducts,
            }),
          },
        );

        const updateComboPayload = await parseJsonResponseSafe(updateComboResponse);
        if (!updateComboResponse.ok) {
          throw new Error(
            extractErrorMessage(updateComboPayload, "Failed to configure combo product"),
          );
        }
      }

      setImportingMenu(false);
      onMenuChange(importedMenuId);
    } catch (importError) {
      setError(
        importError instanceof Error ? importError.message : "Failed to import menu",
      );
      setImportingMenu(false);
    }
  }

  function onImportMenuClick() {
    importMenuInputRef.current?.click();
  }

  async function onImportMenuInputChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile = event.target.files?.[0] ?? null;
    event.currentTarget.value = "";
    if (!selectedFile) return;

    await onImportMenuFile(selectedFile);
  }

  async function onCreateMenu() {
    const menuNameInput = window.prompt("New menu name");
    const menuName = menuNameInput?.trim();

    if (!menuName) return;

    try {
      setCreatingMenu(true);
      setError(null);

      const response = await apiFetch("/api/menus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: menuName,
          active: true,
        }),
      });

      if (!response.ok) {
        let detail = "Failed to create menu";

        try {
          const payload = (await response.json()) as {
            error?: unknown;
            field?: unknown;
          };
          if (typeof payload.error === "string" && payload.error.trim()) {
            detail = payload.error;
          } else if (typeof payload.field === "string" && payload.field.trim()) {
            detail = `Invalid ${payload.field}`;
          }
        } catch {
          // no-op
        }

        throw new Error(detail);
      }

      const payload = (await response.json()) as { id?: unknown; name?: unknown; active?: unknown; isDefault?: unknown };
      if (typeof payload.id !== "string" || !payload.id.trim()) {
        throw new Error("Menu created but response is invalid");
      }

      const newId = payload.id.trim();
      setLocalMenus((prev) => [
        ...prev,
        {
          id: newId,
          name: typeof payload.name === "string" ? payload.name : menuName,
          active: payload.active !== false,
          isDefault: payload.isDefault === true,
        },
      ]);
      onMenuChange(newId);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create menu",
      );
      setCreatingMenu(false);
    }
  }

  async function onSetDefaultMenu(menuId: string) {
    if (settingDefaultMenuId) return;
    try {
      setSettingDefaultMenuId(menuId);
      setError(null);
      const response = await apiFetch(`/api/menus/${encodeURIComponent(menuId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      if (!response.ok) {
        let detail = "Failed to set default menu";
        try {
          const payload = (await response.json()) as { error?: unknown };
          if (typeof payload.error === "string" && payload.error.trim()) {
            detail = payload.error;
          }
        } catch { /* no-op */ }
        throw new Error(detail);
      }
      setLocalMenus((prev) =>
        prev.map((m) => ({ ...m, isDefault: m.id === menuId })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default menu");
    } finally {
      setSettingDefaultMenuId(null);
    }
  }

  function upsertProductLocally(nextProduct: ProductManagerProduct) {
    setCategories((current) => {
      const removed = current.map((category) => ({
        ...category,
        products: category.products.filter(
          (product) => product.id !== nextProduct.id,
        ),
      }));

      if (!nextProduct.categoryId) return removed;

      return removed.map((category) => {
        if (category.id !== nextProduct.categoryId) {
          return category;
        }

        return {
          ...category,
          products: [...category.products, nextProduct].sort(sortProducts),
        };
      });
    });

    setUncategorized((current) => {
      const removed = current.filter((product) => product.id !== nextProduct.id);

      if (nextProduct.categoryId) {
        return removed;
      }

      return [...removed, nextProduct].sort(sortProducts);
    });
  }

  function getProductsForCategory(
    categoryId: string | null,
    categoriesSource: ProductManagerCategory[],
    uncategorizedSource: ProductManagerProduct[],
  ): ProductManagerProduct[] {
    if (!categoryId) {
      return uncategorizedSource;
    }

    const category = categoriesSource.find((item) => item.id === categoryId);
    return category ? category.products : [];
  }

  function replaceProductsForCategory(
    categoryId: string | null,
    products: ProductManagerProduct[],
    categoriesSource: ProductManagerCategory[],
    uncategorizedSource: ProductManagerProduct[],
  ): {
    categories: ProductManagerCategory[];
    uncategorized: ProductManagerProduct[];
  } {
    if (!categoryId) {
      return {
        categories: categoriesSource,
        uncategorized: products,
      };
    }

    return {
      categories: categoriesSource.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              products,
            }
          : category,
      ),
      uncategorized: uncategorizedSource,
    };
  }

  async function persistReorderedProducts(
    productsToPersist: ProductManagerProduct[],
    previousCategories: ProductManagerCategory[],
    previousUncategorized: ProductManagerProduct[],
  ) {
    const uniqueProducts = Array.from(
      new Map(productsToPersist.map((product) => [product.id, product])).values(),
    );

    if (uniqueProducts.length === 0) return;

    setPersistingReorder(true);
    setError(null);

    try {
      await Promise.all(
        uniqueProducts.map(async (product) => {
          const response = await apiFetch(
            `/api/products/${encodeURIComponent(product.id)}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                categoryId: product.categoryId,
                categoryIndex: product.categoryIndex,
              }),
            },
          );

          if (response.ok) return;

          const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error || "Failed to persist product reorder");
        }),
      );
    } catch (requestError) {
      setCategories(previousCategories);
      setUncategorized(previousUncategorized);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to reorder products",
      );
    } finally {
      setPersistingReorder(false);
    }
  }

  function onProductDrop(
    targetCategoryId: string | null,
    targetProductId: string | null,
  ) {
    if (!dragProduct || persistingReorder) return;
    if (search.trim()) return;

    const previousCategories = categories;
    const previousUncategorized = uncategorized;
    const sourceCategoryId = dragProduct.sourceCategoryId;
    const draggedProductId = dragProduct.productId;

    const sourceProducts = getProductsForCategory(
      sourceCategoryId,
      previousCategories,
      previousUncategorized,
    );
    const draggedProduct = sourceProducts.find(
      (product) => product.id === draggedProductId,
    );

    if (!draggedProduct) {
      setDragProduct(null);
      return;
    }

    if (sourceCategoryId === targetCategoryId) {
      const sourceIds = sourceProducts.map((product) => product.id);
      const reorderedIds = targetProductId
        ? reorderIds(sourceIds, draggedProductId, targetProductId)
        : [...sourceIds.filter((id) => id !== draggedProductId), draggedProductId];

      if (sourceIds.join("|") === reorderedIds.join("|")) {
        setDragProduct(null);
        return;
      }

      const sourceProductById = new Map(
        sourceProducts.map((product) => [product.id, product]),
      );
      const reorderedProducts = reorderedIds
        .map((id, index): ProductManagerProduct | null => {
          const product = sourceProductById.get(id);
          if (!product) return null;

          return {
            ...product,
            categoryId: sourceCategoryId,
            categoryIndex: index + 1,
          };
        })
        .filter((product): product is ProductManagerProduct => product !== null);

      const nextState = replaceProductsForCategory(
        sourceCategoryId,
        reorderedProducts,
        previousCategories,
        previousUncategorized,
      );

      setCategories(nextState.categories);
      setUncategorized(nextState.uncategorized);
      setDragProduct(null);
      void persistReorderedProducts(
        reorderedProducts,
        previousCategories,
        previousUncategorized,
      );
      return;
    }

    const sourceWithoutDragged = sourceProducts.filter(
      (product) => product.id !== draggedProductId,
    );
    const sourceReindexed = sourceWithoutDragged.map((product, index) => ({
      ...product,
      categoryId: sourceCategoryId,
      categoryIndex: index + 1,
    }));

    const targetProducts = getProductsForCategory(
      targetCategoryId,
      previousCategories,
      previousUncategorized,
    ).filter((product) => product.id !== draggedProductId);
    const targetIds = targetProducts.map((product) => product.id);
    const targetIndex =
      targetProductId === null ? targetProducts.length : targetIds.indexOf(targetProductId);

    if (targetProductId !== null && targetIndex === -1) {
      setDragProduct(null);
      return;
    }

    const targetWithDragged = [
      ...targetProducts.slice(0, targetIndex),
      {
        ...draggedProduct,
        categoryId: targetCategoryId,
      },
      ...targetProducts.slice(targetIndex),
    ];
    const targetReindexed = targetWithDragged.map((product, index) => ({
      ...product,
      categoryId: targetCategoryId,
      categoryIndex: index + 1,
    }));

    const sourceUpdated = replaceProductsForCategory(
      sourceCategoryId,
      sourceReindexed,
      previousCategories,
      previousUncategorized,
    );
    const targetUpdated = replaceProductsForCategory(
      targetCategoryId,
      targetReindexed,
      sourceUpdated.categories,
      sourceUpdated.uncategorized,
    );

    setCategories(targetUpdated.categories);
    setUncategorized(targetUpdated.uncategorized);
    setDragProduct(null);
    void persistReorderedProducts(
      [...sourceReindexed, ...targetReindexed],
      previousCategories,
      previousUncategorized,
    );
  }

  function openEditor(
    product: ProductManagerProduct,
    options?: {
      focusSection?: ProductEditorFocusSection;
      activeLanguage?: DrawerLanguage;
    },
  ) {
    const translations = cloneTranslations(product.translations);
    const es = translations.es ?? {};
    const pt = translations.pt ?? {};

    delete translations.es;
    delete translations.pt;

    setEditor({
      mode: "edit",
      productId: product.id,
      createdAt: product.createdAt,
      categoryIndex: product.categoryIndex,
      name: product.name,
      description: product.description ?? "",
      categoryId: product.categoryId ?? "",
      visible: product.visible,
      priceInput: formatCurrencyInput(product.price),
      comparedAtPriceInput: formatCurrencyInput(product.comparedAtPrice),
      itemType: product.itemType,
      comboProducts: cloneDirectComboProducts(product.products ?? []),
      comboProductLookupId: "",
      comboProductLookupQuantityInput: "1",
      comboSlots: cloneComboSlots(product.comboSlots),
      esName: es.title ?? es.name ?? "",
      esDescription: es.description ?? "",
      ptName: pt.title ?? pt.name ?? "",
      ptDescription: pt.description ?? "",
      otherTranslations: translations,
      photoUrls: [...product.photoUrls],
      modifierGroups: product.modifierGroups.map(cloneModifierGroup),
      newPhotoUrl: "",
      modifierLookupIdToAttach: "",
      newModifierGroupTitle: "",
      creatingModifierGroup: false,
      savingModifierGroupId: null,
      deletingModifierGroupId: null,
      creatingModifierItemGroupId: null,
      savingModifierItemId: null,
      deletingModifierItemId: null,
      uploadingPhoto: false,
      activeLanguage: options?.activeLanguage ?? "es",
      focusSection: options?.focusSection ?? null,
      saving: false,
      error: null,
      prepTasks: product.preparationTasks.map((task) => ({
        stepId: task.id,
        stepName: task.name,
        stationId: task.stationId ?? "",
        stationName: task.stationName ?? "",
        includeComments: task.includeComments,
        includeModifiers: task.includeModifiers,
        goalMinutes: 0,
      })),
      prepTaskLookupStepId: "",
      newPrepStepFormOpen: false,
      newPrepStepStationId: "",
      newPrepStepName: "",
      newPrepStepGoalMinutes: "",
      newPrepStepIncludeComments: false,
      newPrepStepIncludeModifiers: false,
      creatingPrepStep: false,
    });
  }

  function openCreateEditor() {
    if (categories.length === 0) {
      setError("Add sections to this menu before creating products.");
      return;
    }

    const defaultCategoryId = categories[0]?.id ?? "";

    setEditor({
      mode: "create",
      productId: null,
      createdAt: new Date().toISOString(),
      categoryIndex: null,
      name: "",
      description: "",
      categoryId: defaultCategoryId,
      visible: true,
      priceInput: "",
      comparedAtPriceInput: "",
      itemType: "PRODUCT",
      comboProducts: [],
      comboProductLookupId: "",
      comboProductLookupQuantityInput: "1",
      comboSlots: [],
      esName: "",
      esDescription: "",
      ptName: "",
      ptDescription: "",
      otherTranslations: {},
      photoUrls: [],
      modifierGroups: [],
      newPhotoUrl: "",
      modifierLookupIdToAttach: "",
      newModifierGroupTitle: "",
      creatingModifierGroup: false,
      savingModifierGroupId: null,
      deletingModifierGroupId: null,
      creatingModifierItemGroupId: null,
      savingModifierItemId: null,
      deletingModifierItemId: null,
      uploadingPhoto: false,
      activeLanguage: "es",
      focusSection: null,
      saving: false,
      error: null,
      prepTasks: [],
      prepTaskLookupStepId: "",
      newPrepStepFormOpen: false,
      newPrepStepStationId: "",
      newPrepStepName: "",
      newPrepStepGoalMinutes: "",
      newPrepStepIncludeComments: false,
      newPrepStepIncludeModifiers: false,
      creatingPrepStep: false,
    });
  }

  function closeEditor() {
    setEditor((current) => {
      if (current?.saving) return current;
      return null;
    });
  }

  function attachPrepStep(stepId: string) {
    const station = availableStations.find((s) =>
      s.preparationSteps.some((p) => p.id === stepId),
    );
    const step = station?.preparationSteps.find((p) => p.id === stepId);
    if (!station || !step) return;
    setEditor((current) => {
      if (!current) return current;
      if (current.prepTasks.some((t) => t.stepId === stepId)) return current;
      return {
        ...current,
        prepTaskLookupStepId: "",
        prepTasks: [
          ...current.prepTasks,
          {
            stepId: step.id,
            stepName: step.name,
            stationId: station.id,
            stationName: station.name,
            includeComments: step.includeComments,
            includeModifiers: step.includeModifiers,
            goalMinutes: step.goalMinutes,
          },
        ],
      };
    });
  }

  function removePrepTask(stepId: string) {
    setEditor((current) => {
      if (!current) return current;
      return {
        ...current,
        prepTasks: current.prepTasks.filter((t) => t.stepId !== stepId),
      };
    });
  }

  async function createAndAttachPrepStep() {
    if (!editor) return;
    const stationId = editor.newPrepStepStationId || availableStations[0]?.id;
    const name = editor.newPrepStepName.trim();
    if (!stationId || !name) return;
    const station = availableStations.find((s) => s.id === stationId);
    if (!station) return;

    const goalMinutes = Math.max(0, Number.parseInt(editor.newPrepStepGoalMinutes || "0", 10) || 0);

    setEditor((c) => c ? { ...c, creatingPrepStep: true } : c);
    try {
      const res = await apiFetch(`/api/stations/${stationId}/steps`, {
        method: "POST",
        body: JSON.stringify({
          name,
          goalMinutes,
          includeComments: editor.newPrepStepIncludeComments,
          includeModifiers: editor.newPrepStepIncludeModifiers,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        id?: string; name?: string; goalMinutes?: number;
        includeComments?: boolean; includeModifiers?: boolean; error?: string;
      };
      if (!res.ok) {
        setEditor((c) => c ? { ...c, creatingPrepStep: false, error: payload.error ?? "Failed to create step" } : c);
        return;
      }
      const newStep = {
        id: payload.id ?? "",
        name: payload.name ?? name,
        goalMinutes: payload.goalMinutes ?? goalMinutes,
        includeComments: payload.includeComments ?? editor.newPrepStepIncludeComments,
        includeModifiers: payload.includeModifiers ?? editor.newPrepStepIncludeModifiers,
      };
      setAvailableStations((prev) =>
        prev.map((s) =>
          s.id === stationId
            ? { ...s, preparationSteps: [...s.preparationSteps, newStep] }
            : s,
        ),
      );
      setEditor((c) => {
        if (!c) return c;
        return {
          ...c,
          creatingPrepStep: false,
          newPrepStepFormOpen: false,
          newPrepStepName: "",
          newPrepStepGoalMinutes: "",
          newPrepStepIncludeComments: false,
          newPrepStepIncludeModifiers: false,
          prepTasks: [
            ...c.prepTasks,
            {
              stepId: newStep.id,
              stepName: newStep.name,
              stationId: station.id,
              stationName: station.name,
              includeComments: newStep.includeComments,
              includeModifiers: newStep.includeModifiers,
              goalMinutes: newStep.goalMinutes,
            },
          ],
        };
      });
    } catch {
      setEditor((c) => c ? { ...c, creatingPrepStep: false, error: "Could not reach server" } : c);
    }
  }

  async function toggleVisibility(productId: string, currentVisible: boolean) {
    const nextVisible = !currentVisible;
    setError(null);
    setSavingProductId(productId);
    setProductVisibility(productId, nextVisible);

    try {
      const response = await apiFetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visible: nextVisible,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error || "Failed to update product");
      }
    } catch (requestError) {
      setProductVisibility(productId, currentVisible);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update product",
      );
    } finally {
      setSavingProductId(null);
    }
  }

  function updateEditorField<K extends keyof ProductEditorState>(
    key: K,
    value: ProductEditorState[K],
  ) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        [key]: value,
      };
    });
  }

  function addPhotoUrl() {
    setEditor((current) => {
      if (!current) return current;

      const normalized = current.newPhotoUrl.trim();

      if (!normalized) {
        return {
          ...current,
          error: "Photo URL cannot be empty",
        };
      }

      let parsedUrl: URL;

      try {
        parsedUrl = new URL(normalized);
      } catch {
        return {
          ...current,
          error: "Photo URL must be valid",
        };
      }

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return {
          ...current,
          error: "Photo URL must start with http:// or https://",
        };
      }

      const urlValue = parsedUrl.toString();

      if (current.photoUrls.includes(urlValue)) {
        return {
          ...current,
          newPhotoUrl: "",
          error: null,
        };
      }

      return {
        ...current,
        photoUrls: [...current.photoUrls, urlValue],
        newPhotoUrl: "",
        error: null,
      };
    });
  }

  async function uploadPhotoFile(file: File) {
    if (!file) return;

    setEditor((current) =>
      current
        ? {
            ...current,
            uploadingPhoto: true,
            error: null,
          }
        : current,
    );

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiFetch("/api/bucket/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => ({}))) as {
        url?: unknown;
        error?: unknown;
        reason?: unknown;
      };

      if (!response.ok) {
        const reason =
          typeof payload.reason === "string"
            ? payload.reason
            : typeof payload.error === "string"
              ? payload.error
              : "Failed to upload image";
        throw new Error(reason);
      }

      const uploadedUrl = typeof payload.url === "string" ? payload.url.trim() : "";
      if (!uploadedUrl) {
        throw new Error("Invalid upload response");
      }

      setEditor((current) => {
        if (!current) return current;

        if (current.photoUrls.includes(uploadedUrl)) {
          return {
            ...current,
            uploadingPhoto: false,
            error: null,
          };
        }

        return {
          ...current,
          photoUrls: [...current.photoUrls, uploadedUrl],
          uploadingPhoto: false,
          error: null,
        };
      });
    } catch (uploadError) {
      setEditor((current) =>
        current
          ? {
              ...current,
              uploadingPhoto: false,
              error:
                uploadError instanceof Error
                  ? uploadError.message
                  : "Failed to upload image",
            }
          : current,
      );
    }
  }

  function removePhotoUrl(urlToRemove: string) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        photoUrls: current.photoUrls.filter((urlValue) => urlValue !== urlToRemove),
      };
    });
  }

  function addComboSlot() {
    setEditor((current) => {
      if (!current) return current;
      if (current.comboProducts.length > 0) {
        return {
          ...current,
          error:
            "Remove fixed combo products first, or use direct products only. Fixed products and slots cannot be mixed.",
        };
      }

      return {
        ...current,
        comboSlots: [
          ...current.comboSlots,
          {
            id: createLocalId(),
            name: `Slot ${current.comboSlots.length + 1}`,
            translations: null,
            minSelect: 1,
            maxSelect: 1,
            allowDuplicates: true,
            options: [],
            optionLookupProductId: "",
            optionLookupExtraPriceInput: "0.00",
          },
        ],
      };
    });
  }

  function updateComboSlot(
    slotId: string,
    patch: Partial<ProductEditorComboSlot>,
  ) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        comboSlots: current.comboSlots.map((slot) =>
          slot.id === slotId ? { ...slot, ...patch } : slot,
        ),
      };
    });
  }

  function removeComboSlot(slotId: string) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        comboSlots: current.comboSlots.filter((slot) => slot.id !== slotId),
      };
    });
  }

  function updateComboSlotTranslation(
    slotId: string,
    locale: "es" | "pt",
    field: string,
    value: string,
  ) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        comboSlots: current.comboSlots.map((slot) => {
          if (slot.id !== slotId) return slot;

          return {
            ...slot,
            translations: upsertTranslationField(
              slot.translations,
              locale,
              field,
              value,
            ),
          };
        }),
      };
    });
  }

  function addComboSlotOption(slotId: string) {
    setEditor((current) => {
      if (!current) return current;

      const slot = current.comboSlots.find((value) => value.id === slotId);
      if (!slot) return current;

      const productId = slot.optionLookupProductId.trim();
      if (!productId) {
        return {
          ...current,
          error: "Select a product to attach to the slot",
        };
      }

      if (current.productId && productId === current.productId) {
        return {
          ...current,
          error: "Combo cannot include itself",
        };
      }

      if (slot.options.some((option) => option.productId === productId)) {
        return {
          ...current,
          error: "Product already attached to this slot",
        };
      }

      return {
        ...current,
        comboSlots: current.comboSlots.map((value) =>
          value.id === slotId
            ? {
                ...value,
                options: [
                  ...value.options,
                  {
                    id: createLocalId(),
                    productId,
                    extraPriceInput: value.optionLookupExtraPriceInput || "0.00",
                  },
                ],
                optionLookupProductId: "",
                optionLookupExtraPriceInput: "0.00",
              }
            : value,
        ),
        error: null,
      };
    });
  }

  function updateComboSlotOption(
    slotId: string,
    optionId: string,
    patch: Partial<ProductEditorComboSlotOption>,
  ) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        comboSlots: current.comboSlots.map((slot) =>
          slot.id === slotId
            ? {
                ...slot,
                options: slot.options.map((option) =>
                  option.id === optionId ? { ...option, ...patch } : option,
                ),
              }
            : slot,
        ),
      };
    });
  }

  function removeComboSlotOption(slotId: string, optionId: string) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        comboSlots: current.comboSlots.map((slot) =>
          slot.id === slotId
            ? {
                ...slot,
                options: slot.options.filter((option) => option.id !== optionId),
              }
            : slot,
        ),
      };
    });
  }

  function addDirectComboProduct() {
    setEditor((current) => {
      if (!current) return current;
      if (current.comboSlots.length > 0) {
        return {
          ...current,
          error:
            "Remove combo slots first, or use slots only. Fixed products and slots cannot be mixed.",
        };
      }

      const productId = current.comboProductLookupId.trim();
      if (!productId) {
        return {
          ...current,
          error: "Select a product to attach",
        };
      }
      if (current.productId && productId === current.productId) {
        return {
          ...current,
          error: "Combo cannot include itself",
        };
      }

      const parsedQuantity = Number.parseInt(
        current.comboProductLookupQuantityInput,
        10,
      );
      if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
        return {
          ...current,
          error: "Quantity must be a whole number greater than 0",
        };
      }

      if (current.comboProducts.some((item) => item.productId === productId)) {
        return {
          ...current,
          comboProducts: current.comboProducts.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + parsedQuantity }
              : item,
          ),
          comboProductLookupId: "",
          comboProductLookupQuantityInput: "1",
          error: null,
        };
      }

      return {
        ...current,
        comboProducts: [
          ...current.comboProducts,
          {
            id: createLocalId(),
            productId,
            quantity: parsedQuantity,
          },
        ],
        comboProductLookupId: "",
        comboProductLookupQuantityInput: "1",
        error: null,
      };
    });
  }

  function updateDirectComboProductQuantity(productId: string, quantity: number) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        comboProducts: current.comboProducts.map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity,
              }
            : item,
        ),
      };
    });
  }

  function removeDirectComboProduct(productId: string) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        comboProducts: current.comboProducts.filter((item) => item.id !== productId),
      };
    });
  }

  function attachExistingModifierGroup() {
    setEditor((current) => {
      if (!current) return current;

      const modifierGroupId = current.modifierLookupIdToAttach.trim();
      if (!modifierGroupId) return current;

      if (current.modifierGroups.some((group) => group.id === modifierGroupId)) {
        return {
          ...current,
          modifierLookupIdToAttach: "",
          error: null,
        };
      }

      const lookupGroup = lookupModifierGroups.find(
        (group) => group.id === modifierGroupId,
      );

      if (!lookupGroup) {
        return {
          ...current,
          error: "Modifier group not found",
        };
      }

      return {
        ...current,
        modifierGroups: [...current.modifierGroups, cloneModifierGroup(lookupGroup)],
        modifierLookupIdToAttach: "",
        error: null,
      };
    });
  }

  function removeModifierGroupFromProduct(modifierGroupId: string) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        modifierGroups: current.modifierGroups.filter(
          (group) => group.id !== modifierGroupId,
        ),
      };
    });
  }

  function updateModifierGroupDraft(
    modifierGroupId: string,
    patch: Partial<ProductManagerModifierGroup>,
  ) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        modifierGroups: current.modifierGroups.map((group) =>
          group.id === modifierGroupId
            ? {
                ...group,
                ...patch,
              }
            : group,
        ),
      };
    });
  }

  function updateModifierGroupTranslationDraft(
    modifierGroupId: string,
    locale: "es" | "pt",
    value: string,
  ) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        modifierGroups: current.modifierGroups.map((group) =>
          group.id === modifierGroupId
            ? {
                ...group,
                translations: upsertTranslationField(
                  group.translations,
                  locale,
                  "title",
                  value,
                ),
              }
            : group,
        ),
      };
    });
  }

  function updateModifierItemDraft(
    modifierGroupId: string,
    itemId: string,
    patch: Partial<ProductManagerModifierGroupItem>,
  ) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        modifierGroups: current.modifierGroups.map((group) =>
          group.id === modifierGroupId
            ? {
                ...group,
                items: group.items.map((item) =>
                  item.id === itemId
                    ? {
                        ...item,
                        ...patch,
                      }
                    : item,
                ),
              }
            : group,
        ),
      };
    });
  }

  function updateModifierItemTranslationDraft(
    modifierGroupId: string,
    itemId: string,
    locale: "es" | "pt",
    field: "name" | "description",
    value: string,
  ) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        modifierGroups: current.modifierGroups.map((group) =>
          group.id === modifierGroupId
            ? {
                ...group,
                items: group.items.map((item) =>
                  item.id === itemId
                    ? {
                        ...item,
                        translations: upsertTranslationField(
                          item.translations,
                          locale,
                          field,
                          value,
                        ),
                      }
                    : item,
                ),
              }
            : group,
        ),
      };
    });
  }

  async function createModifierGroup() {
    if (!editor) return;

    const title = editor.newModifierGroupTitle.trim();
    if (!title) {
      setEditor((current) =>
        current
          ? {
              ...current,
              error: "Modifier group title is required",
            }
          : current,
      );
      return;
    }

    setEditor((current) =>
      current
        ? {
            ...current,
            creatingModifierGroup: true,
            error: null,
          }
        : current,
    );

    try {
      const response = await apiFetch("/api/modifier-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          required: false,
          type: "MULTI",
          minSelection: null,
          maxSelection: null,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Failed to create modifier group";
        throw new Error(message);
      }

      const created = mapModifierGroupFromUnknown(payload);
      if (!created) {
        throw new Error("Invalid modifier group response");
      }

      setLookupModifierGroups((current) => [...current, created]);
      setEditor((current) =>
        current
          ? {
              ...current,
              modifierGroups: [...current.modifierGroups, cloneModifierGroup(created)],
              newModifierGroupTitle: "",
              creatingModifierGroup: false,
              error: null,
            }
          : current,
      );
    } catch (requestError) {
      setEditor((current) =>
        current
          ? {
              ...current,
              creatingModifierGroup: false,
              error:
                requestError instanceof Error
                  ? requestError.message
                  : "Failed to create modifier group",
            }
          : current,
      );
    }
  }

  async function saveModifierGroup(modifierGroupId: string) {
    if (!editor) return;

    const modifierGroup = editor.modifierGroups.find(
      (group) => group.id === modifierGroupId,
    );
    if (!modifierGroup) return;

    const normalizedTitle = modifierGroup.title.trim();
    if (!normalizedTitle) {
      setEditor((current) =>
        current
          ? {
              ...current,
              error: "Modifier group title is required",
            }
          : current,
      );
      return;
    }

    const translationsPayload = normalizeTranslations(modifierGroup.translations);

    setEditor((current) =>
      current
        ? {
            ...current,
            savingModifierGroupId: modifierGroupId,
            error: null,
          }
        : current,
    );

    try {
      const response = await apiFetch(
        `/api/modifier-groups/${encodeURIComponent(modifierGroupId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: normalizedTitle,
            required: modifierGroup.required,
            type: modifierGroup.type,
            minSelection: modifierGroup.minSelection,
            maxSelection: modifierGroup.maxSelection,
            translations: translationsPayload,
          }),
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Failed to save modifier group";
        throw new Error(message);
      }

      setEditor((current) =>
        current
          ? {
              ...current,
              modifierGroups: current.modifierGroups.map((group) =>
                group.id === modifierGroupId
                  ? {
                      ...group,
                      title:
                        payload &&
                        typeof payload === "object" &&
                        "title" in payload &&
                        typeof payload.title === "string"
                          ? payload.title
                          : normalizedTitle,
                      required:
                        payload &&
                        typeof payload === "object" &&
                        "required" in payload &&
                        typeof payload.required === "boolean"
                          ? payload.required
                          : group.required,
                      type:
                        payload &&
                        typeof payload === "object" &&
                        "type" in payload
                          ? parseModifierGroupType(payload.type)
                          : group.type,
                      minSelection:
                        payload &&
                        typeof payload === "object" &&
                        "minSelection" in payload &&
                        (typeof payload.minSelection === "number" ||
                          payload.minSelection === null)
                          ? payload.minSelection
                          : group.minSelection,
                      maxSelection:
                        payload &&
                        typeof payload === "object" &&
                        "maxSelection" in payload &&
                        (typeof payload.maxSelection === "number" ||
                          payload.maxSelection === null)
                          ? payload.maxSelection
                          : group.maxSelection,
                      translations:
                        payload &&
                        typeof payload === "object" &&
                        "translations" in payload
                          ? normalizeTranslations(payload.translations)
                          : translationsPayload,
                    }
                  : group,
              ),
              savingModifierGroupId: null,
            }
          : current,
      );
      setLookupModifierGroups((current) =>
        current.map((group) =>
          group.id === modifierGroupId
            ? {
                ...group,
                title:
                  payload &&
                  typeof payload === "object" &&
                  "title" in payload &&
                  typeof payload.title === "string"
                    ? payload.title
                    : group.title,
                required:
                  payload &&
                  typeof payload === "object" &&
                  "required" in payload &&
                  typeof payload.required === "boolean"
                    ? payload.required
                    : group.required,
                type:
                  payload &&
                  typeof payload === "object" &&
                  "type" in payload
                    ? parseModifierGroupType(payload.type)
                    : group.type,
                minSelection:
                  payload &&
                  typeof payload === "object" &&
                  "minSelection" in payload &&
                  (typeof payload.minSelection === "number" ||
                    payload.minSelection === null)
                    ? payload.minSelection
                    : group.minSelection,
                maxSelection:
                  payload &&
                  typeof payload === "object" &&
                  "maxSelection" in payload &&
                  (typeof payload.maxSelection === "number" ||
                    payload.maxSelection === null)
                    ? payload.maxSelection
                    : group.maxSelection,
                translations:
                  payload &&
                  typeof payload === "object" &&
                  "translations" in payload
                    ? normalizeTranslations(payload.translations)
                    : group.translations,
              }
            : group,
        ),
      );
    } catch (requestError) {
      setEditor((current) =>
        current
          ? {
              ...current,
              savingModifierGroupId: null,
              error:
                requestError instanceof Error
                  ? requestError.message
                  : "Failed to save modifier group",
            }
          : current,
      );
    }
  }

  async function deleteModifierGroup(modifierGroupId: string) {
    setEditor((current) =>
      current
        ? {
            ...current,
            deletingModifierGroupId: modifierGroupId,
            error: null,
          }
        : current,
    );

    try {
      const response = await apiFetch(
        `/api/modifier-groups/${encodeURIComponent(modifierGroupId)}`,
        {
          method: "DELETE",
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Failed to delete modifier group";
        throw new Error(message);
      }

      setLookupModifierGroups((current) =>
        current.filter((group) => group.id !== modifierGroupId),
      );
      setEditor((current) =>
        current
          ? {
              ...current,
              modifierGroups: current.modifierGroups.filter(
                (group) => group.id !== modifierGroupId,
              ),
              deletingModifierGroupId: null,
            }
          : current,
      );
    } catch (requestError) {
      setEditor((current) =>
        current
          ? {
              ...current,
              deletingModifierGroupId: null,
              error:
                requestError instanceof Error
                  ? requestError.message
                  : "Failed to delete modifier group",
            }
          : current,
      );
    }
  }

  async function createModifierItem(modifierGroupId: string) {
    setEditor((current) =>
      current
        ? {
            ...current,
            creatingModifierItemGroupId: modifierGroupId,
            error: null,
          }
        : current,
    );

    try {
      const response = await apiFetch("/api/modifier-group-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modifierGroupId,
          name: "New modifier",
          description: null,
          price: 0,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Failed to create modifier item";
        throw new Error(message);
      }

      const item = mapModifierGroupFromUnknown({
        id: "temp",
        title: "temp",
        items: [payload],
      })?.items[0];

      if (!item) {
        throw new Error("Invalid modifier item response");
      }

      setEditor((current) =>
        current
          ? {
              ...current,
              creatingModifierItemGroupId: null,
              modifierGroups: current.modifierGroups.map((group) =>
                group.id === modifierGroupId
                  ? {
                      ...group,
                      items: [...group.items, item],
                    }
                  : group,
              ),
            }
          : current,
      );
      setLookupModifierGroups((current) =>
        current.map((group) =>
          group.id === modifierGroupId
            ? {
                ...group,
                items: [...group.items, item],
              }
            : group,
        ),
      );
    } catch (requestError) {
      setEditor((current) =>
        current
          ? {
              ...current,
              creatingModifierItemGroupId: null,
              error:
                requestError instanceof Error
                  ? requestError.message
                  : "Failed to create modifier item",
            }
          : current,
      );
    }
  }

  async function saveModifierItem(
    modifierGroupId: string,
    item: ProductManagerModifierGroupItem,
  ) {
    const normalizedName = item.name.trim();

    if (!normalizedName) {
      setEditor((current) =>
        current
          ? {
              ...current,
              error: "Modifier item name is required",
            }
          : current,
      );
      return;
    }

    if (!Number.isInteger(item.price) || item.price < 0) {
      setEditor((current) =>
        current
          ? {
              ...current,
              error: "Modifier item price must be a non-negative integer",
            }
          : current,
      );
      return;
    }

    const translationsPayload = normalizeTranslations(item.translations);

    setEditor((current) =>
      current
        ? {
            ...current,
            savingModifierItemId: item.id,
            error: null,
          }
        : current,
    );

    try {
      const response = await apiFetch(
        `/api/modifier-group-items/${encodeURIComponent(item.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            modifierGroupId,
            name: normalizedName,
            description: item.description || null,
            price: item.price,
            translations: translationsPayload,
          }),
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Failed to save modifier item";
        throw new Error(message);
      }

      const updatedItem = mapModifierGroupFromUnknown({
        id: "temp",
        title: "temp",
        items: [payload],
      })?.items[0];

      if (!updatedItem) {
        throw new Error("Invalid modifier item response");
      }

      setEditor((current) =>
        current
          ? {
              ...current,
              savingModifierItemId: null,
              modifierGroups: current.modifierGroups.map((group) =>
                group.id === modifierGroupId
                  ? {
                      ...group,
                      items: group.items.map((currentItem) =>
                        currentItem.id === updatedItem.id ? updatedItem : currentItem,
                      ),
                    }
                  : group,
              ),
            }
          : current,
      );
      setLookupModifierGroups((current) =>
        current.map((group) =>
          group.id === modifierGroupId
            ? {
                ...group,
                items: group.items.map((currentItem) =>
                  currentItem.id === updatedItem.id ? updatedItem : currentItem,
                ),
              }
            : group,
        ),
      );
    } catch (requestError) {
      setEditor((current) =>
        current
          ? {
              ...current,
              savingModifierItemId: null,
              error:
                requestError instanceof Error
                  ? requestError.message
                  : "Failed to save modifier item",
            }
          : current,
      );
    }
  }

  async function deleteModifierItem(modifierGroupId: string, itemId: string) {
    setEditor((current) =>
      current
        ? {
            ...current,
            deletingModifierItemId: itemId,
            error: null,
          }
        : current,
    );

    try {
      const response = await apiFetch(
        `/api/modifier-group-items/${encodeURIComponent(itemId)}`,
        {
          method: "DELETE",
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Failed to delete modifier item";
        throw new Error(message);
      }

      setEditor((current) =>
        current
          ? {
              ...current,
              deletingModifierItemId: null,
              modifierGroups: current.modifierGroups.map((group) =>
                group.id === modifierGroupId
                  ? {
                      ...group,
                      items: group.items.filter((item) => item.id !== itemId),
                    }
                  : group,
              ),
            }
          : current,
      );
      setLookupModifierGroups((current) =>
        current.map((group) =>
          group.id === modifierGroupId
            ? {
                ...group,
                items: group.items.filter((item) => item.id !== itemId),
              }
            : group,
        ),
      );
    } catch (requestError) {
      setEditor((current) =>
        current
          ? {
              ...current,
              deletingModifierItemId: null,
              error:
                requestError instanceof Error
                  ? requestError.message
                  : "Failed to delete modifier item",
            }
          : current,
      );
    }
  }

  async function saveEditor() {
    if (!editor) return;

    const normalizedName = editor.name.trim();

    if (!normalizedName) {
      setEditor((current) =>
        current
          ? {
              ...current,
              error: "Product name is required",
            }
          : current,
      );
      return;
    }

    try {
      const price = parseCurrencyInput(editor.priceInput, "Price");
      const comparedAtPrice = parseCurrencyInput(
        editor.comparedAtPriceInput,
        "Compared at price",
      );

      const translationsPayload: ProductManagerTranslations = {
        ...editor.otherTranslations,
      };

      const esName = editor.esName.trim();
      const esDescription = editor.esDescription.trim();
      const ptName = editor.ptName.trim();
      const ptDescription = editor.ptDescription.trim();

      if (esName || esDescription) {
        translationsPayload.es = {
          ...(esName ? { title: esName } : {}),
          ...(esDescription ? { description: esDescription } : {}),
        };
      }

      if (ptName || ptDescription) {
        translationsPayload.pt = {
          ...(ptName ? { title: ptName } : {}),
          ...(ptDescription ? { description: ptDescription } : {}),
        };
      }

      if (editor.itemType === "COMBO") {
        for (const directProduct of editor.comboProducts) {
          if (
            !Number.isInteger(directProduct.quantity) ||
            directProduct.quantity <= 0
          ) {
            throw new Error("Each fixed combo product must have quantity > 0");
          }
        }

        for (const slot of editor.comboSlots) {
          if (!slot.name.trim()) {
            throw new Error("Each combo slot must have a name");
          }
          if (!Number.isInteger(slot.minSelect) || slot.minSelect < 0) {
            throw new Error("Combo slot min selection must be 0 or greater");
          }
          if (!Number.isInteger(slot.maxSelect) || slot.maxSelect < slot.minSelect) {
            throw new Error("Combo slot max selection must be >= min selection");
          }
          if (slot.options.length === 0) {
            throw new Error("Each combo slot must have at least one product option");
          }
          if (!slot.allowDuplicates && slot.maxSelect > slot.options.length) {
            throw new Error("Max selection exceeds available options for a slot");
          }
        }
      }

      const comboSlotsPayload =
        editor.itemType === "COMBO"
          ? editor.comboSlots.map((slot, slotIndex) => ({
              name: slot.name.trim(),
              translations: normalizeTranslations(slot.translations),
              minSelect: slot.minSelect,
              maxSelect: slot.maxSelect,
              allowDuplicates: slot.allowDuplicates,
              sortIndex: slotIndex + 1,
              options: slot.options.map((option, optionIndex) => ({
                productId: option.productId,
                extraPrice:
                  parseCurrencyInput(
                    option.extraPriceInput || "0",
                    "Option extra price",
                  ) ?? 0,
                sortIndex: optionIndex + 1,
              })),
            }))
          : [];

      const comboProductsPayload =
        editor.itemType === "COMBO"
          ? editor.comboProducts.map((product) => ({
              productId: product.productId,
              quantity: product.quantity,
            }))
          : [];

      const body = {
        name: normalizedName,
        description: editor.description.trim() || null,
        categoryId: editor.categoryId.trim() || null,
        categoryIndex: editor.categoryIndex,
        visible: editor.visible,
        price,
        comparedAtPrice,
        itemType: editor.itemType,
        comboSlots:
          editor.itemType === "COMBO"
            ? comboProductsPayload.length > 0
              ? undefined
              : comboSlotsPayload
            : [],
        products:
          editor.itemType === "COMBO"
            ? comboProductsPayload.length > 0
              ? comboProductsPayload
              : undefined
            : [],
        translations:
          Object.keys(translationsPayload).length > 0 ? translationsPayload : null,
        photoUrls: editor.photoUrls,
        modifierGroupIds: editor.modifierGroups.map((modifierGroup) => modifierGroup.id),
        preparationStepIds: editor.prepTasks.map((t) => t.stepId),
      };

      setEditor((current) =>
        current
          ? {
              ...current,
              saving: true,
              error: null,
            }
          : current,
      );

      const response = await apiFetch(
        editor.mode === "create"
          ? "/api/products"
          : `/api/products/${editor.productId}`,
        {
          method: editor.mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        id?: unknown;
        createdAt?: unknown;
        name?: unknown;
        visible?: unknown;
        description?: unknown;
        price?: unknown;
        comparedAtPrice?: unknown;
        itemType?: unknown;
        categoryId?: unknown;
        categoryIndex?: unknown;
        translations?: unknown;
        photos?: unknown;
        modifierGroups?: unknown;
        preparationStepIds?: unknown;
        preparationTasks?: unknown;
        comboSlots?: unknown;
        comboItems?: unknown;
        products?: unknown;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to save product");
      }

      const persistedId =
        typeof payload.id === "string" ? payload.id : editor.productId;

      if (!persistedId) {
        throw new Error("Product id missing in response");
      }

      const photoUrls = Array.isArray(payload.photos)
        ? payload.photos
            .map((photo) => {
              if (!photo || typeof photo !== "object") return null;
              if (!("url" in photo)) return null;
              return typeof photo.url === "string" ? photo.url : null;
            })
            .filter((urlValue): urlValue is string => Boolean(urlValue))
        : editor.photoUrls;
      const existingProduct =
        [...categories.flatMap((category) => category.products), ...uncategorized].find(
          (product) => product.id === persistedId || product.id === editor.productId,
        ) ?? null;
      const nextPreparationStepIds = Array.isArray(payload.preparationStepIds)
        ? payload.preparationStepIds.filter(
            (entry): entry is string => typeof entry === "string",
          )
        : existingProduct?.preparationStepIds ?? [];
      const nextPreparationTasks = Array.isArray(payload.preparationTasks)
        ? payload.preparationTasks
            .map((task) => mapPreparationTaskFromUnknown(task))
            .filter(
              (task): task is ProductManagerPreparationTask => task !== null,
            )
        : existingProduct?.preparationTasks ?? [];

      const updatedProduct: ProductManagerProduct = {
        id: persistedId,
        createdAt:
          typeof payload.createdAt === "string"
            ? payload.createdAt
            : editor.createdAt,
        name: typeof payload.name === "string" ? payload.name : normalizedName,
        itemType:
          payload.itemType === "COMBO" || payload.itemType === "PRODUCT"
            ? payload.itemType
            : editor.itemType,
        visible:
          typeof payload.visible === "boolean" ? payload.visible : editor.visible,
        description:
          typeof payload.description === "string" || payload.description === null
            ? payload.description
            : editor.description.trim() || null,
        price: typeof payload.price === "number" ? payload.price : body.price,
        comparedAtPrice:
          typeof payload.comparedAtPrice === "number" ||
          payload.comparedAtPrice === null
            ? payload.comparedAtPrice
            : body.comparedAtPrice,
        categoryId:
          typeof payload.categoryId === "string" || payload.categoryId === null
            ? payload.categoryId
            : body.categoryId,
        categoryIndex:
          typeof payload.categoryIndex === "number" || payload.categoryIndex === null
            ? payload.categoryIndex
            : editor.categoryIndex,
        translations: normalizeTranslations(payload.translations),
        photoUrls,
        mainPhotoUrl: photoUrls[0] ?? null,
        preparationStepIds: nextPreparationStepIds,
        preparationTasks: nextPreparationTasks,
        modifierGroups: Array.isArray(payload.modifierGroups)
          ? payload.modifierGroups
              .map(mapModifierGroupFromUnknown)
              .filter(
                (modifierGroup): modifierGroup is ProductManagerModifierGroup =>
                  modifierGroup !== null,
              )
          : editor.modifierGroups.map(cloneModifierGroup),
        comboSlots: Array.isArray(payload.comboSlots)
          ? payload.comboSlots
              .map(mapComboSlotFromUnknown)
              .filter((slot): slot is ProductManagerComboSlot => slot !== null)
          : editor.comboSlots.map((slot, slotIndex) => ({
              id: slot.id,
              name: slot.name.trim() || `Slot ${slotIndex + 1}`,
              translations: normalizeTranslations(slot.translations),
              minSelect: slot.minSelect,
              maxSelect: slot.maxSelect,
              allowDuplicates: slot.allowDuplicates,
              sortIndex: slotIndex + 1,
              options: slot.options.map((option, optionIndex) => ({
                productId: option.productId,
                productName:
                  productNameById.get(option.productId) || "Unknown product",
                extraPrice:
                  parseCurrencyInput(
                    option.extraPriceInput || "0",
                    "Option extra price",
                  ) ?? 0,
                sortIndex: optionIndex + 1,
              })),
            })),
        products: Array.isArray(payload.products)
          ? payload.products
              .map(mapFixedComboProductFromUnknown)
              .filter(
                (product): product is ProductManagerFixedComboProduct =>
                  product !== null,
              )
          : [],
        comboItems: [],
      };

      if (updatedProduct.products.length === 0) {
        updatedProduct.products =
          editor.comboProducts.length > 0
            ? editor.comboProducts.map((product) => ({
                productId: product.productId,
                productName:
                  productNameById.get(product.productId) || "Unknown product",
                quantity: product.quantity,
              }))
            : comboItemsFromSlots(updatedProduct.comboSlots);
      }
      updatedProduct.comboItems = comboItemsFromSlots(updatedProduct.comboSlots);

      upsertProductLocally(updatedProduct);
      setEditor(null);
    } catch (requestError) {
      setEditor((current) =>
        current
          ? {
              ...current,
              saving: false,
              error:
                requestError instanceof Error
                  ? requestError.message
                  : "Failed to save product",
            }
          : current,
      );
    }
  }

  // ── Menu Builder helpers ─────────────────────────────────────────────────────

  function moveSectionUp(categoryId: string) {
    const orderedIds = getOrderedCategoryIds();
    const idx = orderedIds.indexOf(categoryId);
    if (idx <= 0) return;
    const newOrder = [...orderedIds];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    setCategories(prev => prev.map(c => { const i = newOrder.indexOf(c.id); return i !== -1 ? { ...c, menuIndex: i + 1 } : c; }));
    void persistSectionOrder(newOrder);
  }

  function moveSectionDown(categoryId: string) {
    const orderedIds = getOrderedCategoryIds();
    const idx = orderedIds.indexOf(categoryId);
    if (idx >= orderedIds.length - 1) return;
    const newOrder = [...orderedIds];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    setCategories(prev => prev.map(c => { const i = newOrder.indexOf(c.id); return i !== -1 ? { ...c, menuIndex: i + 1 } : c; }));
    void persistSectionOrder(newOrder);
  }

  function moveProductUp(categoryId: string, productIdx: number) {
    if (productIdx <= 0) return;
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    const prods = [...category.products];
    [prods[productIdx - 1], prods[productIdx]] = [prods[productIdx], prods[productIdx - 1]];
    const reordered = prods.map((p, i) => ({ ...p, categoryIndex: i + 1 }));
    const prevCats = categories;
    const prevUncat = uncategorized;
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, products: reordered } : c));
    void persistReorderedProducts(reordered, prevCats, prevUncat);
  }

  function moveProductDown(categoryId: string, productIdx: number) {
    const category = categories.find(c => c.id === categoryId);
    if (!category || productIdx >= category.products.length - 1) return;
    const prods = [...category.products];
    [prods[productIdx], prods[productIdx + 1]] = [prods[productIdx + 1], prods[productIdx]];
    const reordered = prods.map((p, i) => ({ ...p, categoryIndex: i + 1 }));
    const prevCats = categories;
    const prevUncat = uncategorized;
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, products: reordered } : c));
    void persistReorderedProducts(reordered, prevCats, prevUncat);
  }

  async function unlinkProduct(productId: string, categoryId: string) {
    const category = categories.find(c => c.id === categoryId);
    const product = category?.products.find(p => p.id === productId);
    if (!product) return;
    const unlinked: ProductManagerProduct = { ...product, categoryId: null, categoryIndex: null };
    const prevCats = categories;
    const prevUncat = uncategorized;
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, products: c.products.filter(p => p.id !== productId) } : c));
    setUncategorized(prev => [...prev, unlinked]);
    try {
      const res = await apiFetch(`/api/products/${productId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId: null, categoryIndex: null }) });
      if (!res.ok) throw new Error("Failed to unlink product");
    } catch (e) {
      setCategories(prevCats);
      setUncategorized(prevUncat);
      setError(e instanceof Error ? e.message : "Failed to unlink product");
    }
  }

  async function attachUncategorizedProduct(categoryId: string, productId: string) {
    const product = uncategorized.find(p => p.id === productId) ?? categories.flatMap(c => c.products).find(p => p.id === productId);
    if (!product) return;
    const category = categories.find(c => c.id === categoryId);
    const nextIndex = (category?.products.length ?? 0) + 1;
    const attached: ProductManagerProduct = { ...product, categoryId, categoryIndex: nextIndex };
    const prevCats = categories;
    const prevUncat = uncategorized;
    setUncategorized(prev => prev.filter(p => p.id !== productId));
    setCategories(prev => prev.map(c => {
      if (c.id === categoryId) return { ...c, products: [...c.products.filter(p => p.id !== productId), attached] };
      return { ...c, products: c.products.filter(p => p.id !== productId) };
    }));
    try {
      const res = await apiFetch(`/api/products/${productId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ categoryId, categoryIndex: nextIndex }) });
      if (!res.ok) throw new Error("Failed to attach product");
    } catch (e) {
      setCategories(prevCats);
      setUncategorized(prevUncat);
      setError(e instanceof Error ? e.message : "Failed to attach product");
    }
  }

  function openCreateEditorForCategory(categoryId: string) {
    if (categories.length === 0) { setError("Add sections to this menu before creating products."); return; }
    setEditor({
      mode: "create", productId: null, createdAt: new Date().toISOString(), categoryIndex: null,
      name: "", description: "", categoryId, visible: true, priceInput: "", comparedAtPriceInput: "",
      itemType: "PRODUCT", comboProducts: [], comboProductLookupId: "", comboProductLookupQuantityInput: "1",
      comboSlots: [], esName: "", esDescription: "", ptName: "", ptDescription: "", otherTranslations: {},
      photoUrls: [], modifierGroups: [], newPhotoUrl: "", modifierLookupIdToAttach: "",
      newModifierGroupTitle: "", creatingModifierGroup: false, savingModifierGroupId: null,
      deletingModifierGroupId: null, creatingModifierItemGroupId: null, savingModifierItemId: null,
      deletingModifierItemId: null, uploadingPhoto: false, activeLanguage: "es", focusSection: null,
      saving: false, error: null, prepTasks: [], prepTaskLookupStepId: "",
      newPrepStepFormOpen: false, newPrepStepStationId: "", newPrepStepName: "",
      newPrepStepGoalMinutes: "", newPrepStepIncludeComments: false, newPrepStepIncludeModifiers: false, creatingPrepStep: false,
    });
  }

  const totalItemCount = categories.reduce((sum, c) => sum + c.products.length, 0);
  const allProductsForAttach = [...uncategorized, ...categories.flatMap(c => c.products)];

  return (
    <>
      <input
        ref={importMenuInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={(event) => void onImportMenuInputChange(event)}
      />
      {/* ── Menu Builder shell ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#f0eee9" }}>

        {/* Top bar */}
        <div style={{ height: 56, background: "var(--paper)", borderBottom: "1px solid rgba(22,18,15,0.08)", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Zippy mark */}
            <svg width="22" height="22" viewBox="0 0 100 100">
              <rect width="100" height="100" rx="18" fill="#ff3d14"/>
              <circle cx="50" cy="60" r="9" fill="#faf5ee"/>
              <path d="M28 60 A22 22 0 0 1 72 60" stroke="#faf5ee" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.55"/>
              <path d="M18 60 A32 32 0 0 1 82 60" stroke="#faf5ee" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.25"/>
            </svg>
            <div style={{ width: 1, height: 20, background: "rgba(22,18,15,0.1)" }} />
            <MBMenuSelector
              menus={localMenus}
              activeId={selectedMenuId}
              onSelect={onMenuChange}
              onCreateMenu={() => void onCreateMenu()}
              onImportMenu={onImportMenuClick}
              onSetDefault={(id) => void onSetDefaultMenu(id)}
              settingDefaultId={settingDefaultMenuId}
              disabled={switchingMenu || creatingMenu || importingMenu}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--slate)" }}>
              {categories.length} sections · {totalItemCount} items
            </span>
            <button type="button" onClick={exportMenu}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(22,18,15,0.16)", background: "transparent", color: "var(--ink)", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Export
            </button>
            <button
              type="button"
              onClick={onImportMenuClick}
              disabled={switchingMenu || creatingMenu || importingMenu}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(22,18,15,0.16)", background: "transparent", color: "var(--ink)", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, cursor: switchingMenu || creatingMenu || importingMenu ? "not-allowed" : "pointer", opacity: switchingMenu || creatingMenu || importingMenu ? 0.55 : 1 }}>
              {importingMenu ? "Importing..." : "Import"}
            </button>
            <button type="button" onClick={onPreviewMenu}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(22,18,15,0.16)", background: "transparent", color: "var(--ink)", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Preview
            </button>
            <button type="button" onClick={openCreateEditor} disabled={categories.length === 0}
              style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "var(--ink)", color: "#fff", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, cursor: categories.length === 0 ? "not-allowed" : "pointer", opacity: categories.length === 0 ? 0.45 : 1 }}>
              Add product
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ padding: "10px 24px", background: "rgba(199,42,10,0.07)", borderBottom: "1px solid rgba(199,42,10,0.15)", fontSize: 12.5, color: "var(--ember)", fontFamily: "var(--font-sans)" }}>
            {error}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
          <div style={{ maxWidth: 740, margin: "0 auto" }}>

            <MBAddSectionBtn
              disabled={creatingSection || linkingSection}
              onAdd={() => { const n = window.prompt("Section name"); if (n?.trim()) void onCreateSectionAtIndex(n.trim(), 0); }}
            />

            {categoryViews.length === 0 && !switchingMenu && (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--slate)", fontSize: 13, fontFamily: "var(--font-sans)" }}>
                No sections yet — add one above.
              </div>
            )}

            {categoryViews.map((category, idx) => (
              <React.Fragment key={`mb-${category.id}`}>
                <div style={{ marginBottom: 6 }}>
                  <MBSectionBlock
                    category={category}
                    isFirst={idx === 0}
                    isLast={idx === categoryViews.length - 1}
                    collapsed={collapsed[category.id] === true}
                    savingProductId={savingProductId}
                    persistingReorder={persistingReorder}
                    detaching={detachingSectionId === category.id}
                    allUnlinkedProducts={allProductsForAttach.filter(p => p.categoryId !== category.id)}
                    onToggleCollapse={() => setCollapsed(cur => ({ ...cur, [category.id]: !(cur[category.id] ?? false) }))}
                    onMoveUp={() => moveSectionUp(category.id)}
                    onMoveDown={() => moveSectionDown(category.id)}
                    onDetach={() => void onDetachSection(category.id)}
                    onToggleProductActive={(productId, visible) => void toggleVisibility(productId, visible)}
                    onMoveProductUp={(productIdx) => moveProductUp(category.id, productIdx)}
                    onMoveProductDown={(productIdx) => moveProductDown(category.id, productIdx)}
                    onEditProduct={(product) => openEditor(product)}
                    onCreateProduct={() => openCreateEditorForCategory(category.id)}
                    onUnlinkProduct={(productId) => void unlinkProduct(productId, category.id)}
                    onAttachProduct={(productId) => void attachUncategorizedProduct(category.id, productId)}
                  />
                </div>
                <MBAddSectionBtn
                  disabled={creatingSection || linkingSection}
                  onAdd={() => { const n = window.prompt("Section name"); if (n?.trim()) void onCreateSectionAtIndex(n.trim(), idx + 1); }}
                />
              </React.Fragment>
            ))}

          </div>
        </div>
      </div>

      {/* ── (legacy layout kept below, hidden) — replaced by the new shell above */}
      <div style={{ display: "none" }}>
      <main className="min-h-dvh bg-zinc-50 p-4 md:p-8">
        <div className="mx-auto w-full max-w-[1400px]">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">Products</h1>
              <p className="text-sm text-zinc-500">
                Manage products by category with inline visibility controls.
              </p>
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto">
              <select
                value={selectedMenuId}
                disabled={
                  switchingMenu ||
                  creatingMenu ||
                  linkingSection ||
                  creatingSection ||
                  detachingSectionId !== null
                }
                onChange={(event) => onMenuChange(event.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2 md:w-[240px]"
              >
                {localMenus.map((menu) => (
                  <option key={menu.id} value={menu.id}>
                    {menu.name}
                    {menu.isDefault ? " (Default)" : ""}
                    {menu.active ? "" : " (Inactive)"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onCreateMenu}
                disabled={
                  switchingMenu ||
                  creatingMenu ||
                  linkingSection ||
                  creatingSection ||
                  detachingSectionId !== null
                }
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingMenu ? "Creating..." : "New menu"}
              </button>
              <button
                type="button"
                onClick={onPreviewMenu}
                disabled={
                  switchingMenu ||
                  creatingMenu ||
                  linkingSection ||
                  creatingSection ||
                  detachingSectionId !== null
                }
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Preview menu
              </button>
              <div className="w-full md:w-[360px]">
                <SectionInsertControl
                  compact
                  disabled={
                    linkingSection || creatingSection || detachingSectionId !== null
                  }
                  availableSections={availableSectionsToLink}
                  onLink={(sectionId) =>
                    void onLinkSectionAtIndex(sectionId, categories.length)
                  }
                  onCreate={(sectionName) =>
                    void onCreateSectionAtIndex(sectionName, categories.length)
                  }
                />
              </div>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2 md:w-[280px]"
              />
              <button
                type="button"
                onClick={openCreateEditor}
                disabled={categories.length === 0}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Product
              </button>
            </div>
          </header>

          {error ? (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <section className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Uber Eats Sync</p>
                <p className="text-xs text-zinc-500">
                  Last run: {formatSyncRunAt(latestSyncRun?.createdAt)} ·{" "}
                  {latestSyncRun?.status ?? "Not synced yet"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSyncPreviewOpen((current) => !current)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  {syncPreviewOpen ? "Hide sync preview" : "Show sync preview"}
                </button>
                <a
                  href="/sales-channels/uber-eats"
                  className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  Open Uber sync
                </a>
              </div>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Total
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {syncSummary.totalItems}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  Synced
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-800">
                  {syncSummary.synced}
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  Needs Sync
                </p>
                <p className="mt-1 text-lg font-semibold text-amber-800">
                  {syncSummary.needsSync}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                  Not Synced
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-800">
                  {syncSummary.notSynced}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                  Excluded
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-700">
                  {syncSummary.excluded}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(
                [
                  { value: "ALL", label: "All products" },
                  { value: "SYNCED", label: "Synced" },
                  { value: "NEEDS_SYNC", label: "Needs sync" },
                  { value: "NOT_SYNCED", label: "Not synced" },
                  { value: "EXCLUDED", label: "Excluded" },
                ] as Array<{ value: SyncFilter; label: string }>
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSyncFilter(option.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    syncFilter === option.value
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {syncPreviewOpen ? (
            <section className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-zinc-900">Sync preview</h3>
              <p className="mb-3 text-xs text-zinc-500">
                Review what will happen on the next Uber Eats menu sync.
              </p>
              <div className="grid gap-3 lg:grid-cols-2">
                {(
                  [
                    {
                      key: "toCreate",
                      title: "Will be created",
                      items: syncPreviewGroups.toCreate,
                    },
                    {
                      key: "toUpdate",
                      title: "Will be updated",
                      items: syncPreviewGroups.toUpdate,
                    },
                    {
                      key: "toDisable",
                      title: "Will be disabled",
                      items: syncPreviewGroups.toDisable,
                    },
                    {
                      key: "noChange",
                      title: "Already synced",
                      items: syncPreviewGroups.noChange,
                    },
                  ] as Array<{
                    key: string;
                    title: string;
                    items: SyncPreviewItem[];
                  }>
                ).map((group) => (
                  <div
                    key={group.key}
                    className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
                        {group.title}
                      </p>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-700">
                        {group.items.length}
                      </span>
                    </div>
                    {group.items.length === 0 ? (
                      <p className="text-xs text-zinc-500">No products.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {group.items.slice(0, 6).map((item) => (
                          <div
                            key={`${group.key}-${item.productId}`}
                            className="rounded-md border border-zinc-200 bg-white px-2 py-1.5"
                          >
                            <p className="text-xs font-medium text-zinc-900">
                              {item.productName}
                            </p>
                            <p className="text-[11px] text-zinc-500">
                              {item.reason}
                            </p>
                          </div>
                        ))}
                        {group.items.length > 6 ? (
                          <p className="text-[11px] text-zinc-500">
                            +{group.items.length - 6} more
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <div className="space-y-4">
            {search.trim().length === 0 && filteredCategoryViews.length > 0 ? (
              <SectionInsertControl
                compact
                disabled={
                  linkingSection || creatingSection || detachingSectionId !== null
                }
                availableSections={availableSectionsToLink}
                onLink={(sectionId) => void onLinkSectionAtIndex(sectionId, 0)}
                onCreate={(sectionName) =>
                  void onCreateSectionAtIndex(sectionName, 0)
                }
              />
            ) : null}

            {filteredCategoryViews.map((category, categoryIndexPosition) => {
              const isCollapsed = collapsed[category.id] === true;
              const productCount = category.products.length;
              const categoryId = category.id;

              return (
                <div key={category.id} className="space-y-3">
                  <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsed((current) => ({
                          ...current,
                          [category.id]: !isCollapsed,
                        }))
                      }
                      onDragOver={(event) => {
                        if (!dragProduct || search.trim() || persistingReorder) {
                          return;
                        }

                        event.preventDefault();
                      }}
                      onDrop={(event) => {
                        if (!dragProduct || search.trim() || persistingReorder) {
                          return;
                        }

                        event.preventDefault();
                        event.stopPropagation();
                        onProductDrop(categoryId, null);
                      }}
                      className="flex w-full items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-left"
                    >
                      <DotsHandle />
                      <span
                        className={`inline-block text-zinc-500 transition ${
                          isCollapsed ? "" : "rotate-90"
                        }`}
                      >
                        ›
                      </span>
                      <span className="text-sm font-semibold text-zinc-900">
                        {category.title}
                      </span>
                      <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                        {productCount} {productCount === 1 ? "product" : "products"}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void onDetachSection(category.id);
                        }}
                        disabled={
                          linkingSection ||
                          creatingSection ||
                          detachingSectionId === category.id
                        }
                        className="ml-auto rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {detachingSectionId === category.id ? "Detaching..." : "Detach"}
                      </button>
                    </button>

                    {!isCollapsed ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[920px]">
                          <thead className="bg-zinc-100 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            <tr>
                              <th className="px-4 py-2 text-left">Product</th>
                              <th className="px-4 py-2 text-left">Price</th>
                              <th className="px-4 py-2 text-left">Status</th>
                              <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody
                            onDragOver={(event) => {
                              if (!dragProduct || search.trim() || persistingReorder) {
                                return;
                              }

                              event.preventDefault();
                            }}
                            onDrop={(event) => {
                              if (!dragProduct || search.trim() || persistingReorder) {
                                return;
                              }

                              event.preventDefault();
                              onProductDrop(categoryId, null);
                            }}
                          >
                            {category.products.map((product) => {
                              const productSyncInsight = getProductSyncInsight(
                                product.id,
                              );
                              return (
                                <tr
                                  key={product.id}
                                draggable={!search.trim() && !persistingReorder}
                                onDragStart={(event) => {
                                  if (search.trim() || persistingReorder) return;

                                  setDragProduct({
                                    productId: product.id,
                                    sourceCategoryId: product.categoryId ?? null,
                                  });
                                  event.dataTransfer.effectAllowed = "move";
                                }}
                                onDragEnd={() => setDragProduct(null)}
                                onDragOver={(event) => {
                                  if (!dragProduct || search.trim() || persistingReorder) {
                                    return;
                                  }

                                  event.preventDefault();
                                  event.dataTransfer.dropEffect = "move";
                                }}
                                onDrop={(event) => {
                                  if (!dragProduct || search.trim() || persistingReorder) {
                                    return;
                                  }

                                  event.preventDefault();
                                  event.stopPropagation();
                                  onProductDrop(categoryId, product.id);
                                }}
                                className={`cursor-pointer border-t border-zinc-100 hover:bg-zinc-50 ${
                                  dragProduct?.productId === product.id
                                    ? "opacity-60"
                                    : ""
                                }`}
                                onClick={() => openEditor(product)}
                              >
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="h-10 w-10 rounded-lg bg-zinc-200 bg-cover bg-center"
                                      style={
                                        product.mainPhotoUrl
                                          ? {
                                              backgroundImage: `url("${product.mainPhotoUrl}")`,
                                            }
                                          : undefined
                                      }
                                    />
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-zinc-900">
                                        {product.name}
                                      </span>
                                      <span
                                        title={productSyncInsight.reason}
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${syncStatusBadgeClasses(
                                          productSyncInsight.status,
                                        )}`}
                                      >
                                        {syncStatusLabel(productSyncInsight.status)}
                                      </span>
                                      {product.itemType === "COMBO" ? (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                          Combo
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="flex flex-col">
                                    <span className="text-base font-semibold text-zinc-900">
                                      {formatPrice(product.price)}
                                    </span>
                                    {typeof product.comparedAtPrice === "number" ? (
                                      <span className="text-xs text-zinc-500 line-through">
                                        {formatPrice(product.comparedAtPrice)}
                                      </span>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-4">
                                    <StatusBadge active={product.visible} />
                                    <Toggle
                                      checked={product.visible}
                                      disabled={savingProductId === product.id}
                                      onChange={() =>
                                        toggleVisibility(product.id, product.visible)
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openEditor(product);
                                      }}
                                      className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openEditor(product, {
                                          focusSection: "translations",
                                          activeLanguage: "es",
                                        });
                                      }}
                                      className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-100"
                                    >
                                      Translations
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(event) => event.stopPropagation()}
                                      className="cursor-grab rounded-md border border-transparent p-1.5 text-zinc-400 hover:bg-zinc-100 active:cursor-grabbing"
                                      aria-label="Drag product"
                                    >
                                      <DotsHandle />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              );
                            })}

                            {category.products.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-8 text-center text-sm text-zinc-500"
                                >
                                  No products in this category.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </section>

                  {search.trim().length === 0 ? (
                    <SectionInsertControl
                      compact
                      disabled={
                        linkingSection || creatingSection || detachingSectionId !== null
                      }
                      availableSections={availableSectionsToLink}
                      onLink={(sectionId) =>
                        void onLinkSectionAtIndex(
                          sectionId,
                          categoryIndexPosition + 1,
                        )
                      }
                      onCreate={(sectionName) =>
                        void onCreateSectionAtIndex(
                          sectionName,
                          categoryIndexPosition + 1,
                        )
                      }
                    />
                  ) : null}
                </div>
              );
            })}

            {filteredCategoryViews.length === 0 ? (
              categories.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-10">
                  <h3 className="mb-2 text-center text-base font-semibold text-zinc-900">
                    No sections in this menu yet
                  </h3>
                  <p className="mb-4 text-center text-sm text-zinc-500">
                    Create a new section or link an existing one to start managing products.
                  </p>
                  <SectionInsertControl
                    disabled={
                      linkingSection || creatingSection || detachingSectionId !== null
                    }
                    availableSections={availableSectionsToLink}
                    onLink={(sectionId) => void onLinkSectionAtIndex(sectionId, 0)}
                    onCreate={(sectionName) =>
                      void onCreateSectionAtIndex(sectionName, 0)
                    }
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500">
                  {syncFilter === "ALL"
                    ? "No products found for your search."
                    : "No products found for this sync filter."}
                </div>
              )
            ) : null}
          </div>
        </div>
      </main>
      </div>
      {/* ── end hidden legacy layout ─────────────────────────────────────────── */}

      {editor ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", background: "#171310", fontFamily: "var(--font-sans)" }}>
          {/* ── Top navigation bar ──────────────────────────────────────────────── */}
          <div style={{ height: 48, background: "#171310", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", padding: "0 24px", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button type="button" onClick={closeEditor} disabled={editor.saving}
                style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(245,240,232,0.7)", display: "flex", alignItems: "center", justifyContent: "center", cursor: editor.saving ? "not-allowed" : "pointer", flexShrink: 0 }}>
                <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 12L6 8l4-4"/></svg>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(245,240,232,0.4)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                <span style={{ cursor: "pointer", color: "rgba(245,240,232,0.4)" }} onClick={closeEditor}>PRODUCTS</span>
                <span>/</span>
                <span>MENU</span>
                <span>/</span>
                <span style={{ color: "rgba(245,240,232,0.8)", fontWeight: 600 }}>{editor.name || "New Product"}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {!editor.saving && !editor.error && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#00a866" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00a866", display: "inline-block" }} />
                  SAVED
                </div>
              )}
              <button type="button" onClick={closeEditor} disabled={editor.saving}
                style={{ padding: "5px 14px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", fontSize: 12.5, fontWeight: 500, color: "rgba(245,240,232,0.7)", cursor: editor.saving ? "not-allowed" : "pointer" }}>
                Discard
              </button>
              <button type="button" onClick={() => void saveEditor()} disabled={editor.saving || editor.uploadingPhoto}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 16px", borderRadius: 7, border: "none", background: "#ff3d14", fontSize: 12.5, fontWeight: 700, color: "#fff", cursor: editor.saving || editor.uploadingPhoto ? "not-allowed" : "pointer", opacity: editor.saving || editor.uploadingPhoto ? 0.6 : 1 }}>
                <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 8.5l3.5 3.5 7.5-7.5"/></svg>
                {editor.saving ? "Saving…" : editor.uploadingPhoto ? "Uploading…" : editor.mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>

          {/* ── Scrollable body ──────────────────────────────────────────────────── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "40px 24px 80px" }}>
            <div style={{ maxWidth: 660, margin: "0 auto" }}>

              {/* Page header */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#ff3d14" }}>
                    {editor.mode === "create" ? "NEW PRODUCT" : "EDITING PRODUCT"}
                  </span>
                  {editor.categoryId && (
                    <>
                      <span style={{ color: "rgba(245,240,232,0.25)", fontSize: 11 }}>·</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(245,240,232,0.4)", letterSpacing: "0.06em" }}>
                        {categories.find((c) => c.id === editor.categoryId)?.title?.toUpperCase() ?? ""}
                      </span>
                    </>
                  )}
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: "#f5f0e8", letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 10px" }}>
                  {editor.name || (editor.mode === "create" ? "New product" : "Product")}
                </h1>
                {editor.mode === "edit" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {editor.priceInput && (
                      <span style={{ fontSize: 20, fontWeight: 700, color: "#f5f0e8" }}>
                        ${editor.priceInput}
                      </span>
                    )}
                    {editor.comparedAtPriceInput && (
                      <span style={{ fontSize: 14, color: "rgba(245,240,232,0.4)", textDecoration: "line-through" }}>
                        ${editor.comparedAtPriceInput}
                      </span>
                    )}
                    {editor.visible && (
                      <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 20, background: "rgba(0,168,102,0.12)", border: "1px solid rgba(0,168,102,0.3)", fontSize: 11, fontWeight: 600, color: "#00a866" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00a866" }} />
                        LIVE
                      </span>
                    )}
                  </div>
                )}
              </div>

              {editor.error && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(255,61,20,0.1)", border: "1px solid rgba(255,61,20,0.25)", borderRadius: 8, fontSize: 13, color: "#ff8066" }}>
                  {editor.error}
                </div>
              )}

              {/* ── Section 01: Basics ──────────────────────────────────────────── */}
              <EdSection num="01" title="Basics" subtitle="Name, description, where it lives, and whether it's visible.">
                <EdFieldLabel required>Product name</EdFieldLabel>
                <input value={editor.name}
                  onChange={(e) => updateEditorField("name", e.target.value)}
                  placeholder="e.g. Spaghetti Carbonara"
                  style={edInput} />
                <EdTranslationPill
                  count={(editor.esName ? 1 : 0) + (editor.ptName ? 1 : 0)}
                  open={editorNameTranslationsOpen}
                  onToggle={() => setEditorNameTranslationsOpen((v) => !v)}
                />
                {editorNameTranslationsOpen && (
                  <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input value={editor.esName} onChange={(e) => updateEditorField("esName", e.target.value)} placeholder="Name (ES)" style={edInput} />
                    <input value={editor.ptName} onChange={(e) => updateEditorField("ptName", e.target.value)} placeholder="Name (PT)" style={edInput} />
                  </div>
                )}

                <div style={{ height: 16 }} />
                <EdFieldLabel>Description</EdFieldLabel>
                <textarea value={editor.description}
                  onChange={(e) => updateEditorField("description", e.target.value)}
                  placeholder="Short, descriptive line. What's in it, how it's made."
                  rows={3}
                  style={{ ...edInput, resize: "vertical" as const }} />
                <EdTranslationPill
                  count={(editor.esDescription ? 1 : 0) + (editor.ptDescription ? 1 : 0)}
                  open={editorDescTranslationsOpen}
                  onToggle={() => setEditorDescTranslationsOpen((v) => !v)}
                />
                {editorDescTranslationsOpen && (
                  <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <textarea value={editor.esDescription} onChange={(e) => updateEditorField("esDescription", e.target.value)} placeholder="Description (ES)" rows={2} style={{ ...edInput, resize: "vertical" as const }} />
                    <textarea value={editor.ptDescription} onChange={(e) => updateEditorField("ptDescription", e.target.value)} placeholder="Description (PT)" rows={2} style={{ ...edInput, resize: "vertical" as const }} />
                  </div>
                )}
                <p style={{ marginTop: 6, fontSize: 12, color: "rgba(245,240,232,0.3)" }}>A short, descriptive line. What's in it, how it's made.</p>

                <div style={{ height: 16 }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <EdFieldLabel required>Menu category</EdFieldLabel>
                    <select value={editor.categoryId} onChange={(e) => updateEditorField("categoryId", e.target.value)} style={edSelect}>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <EdFieldLabel>Visibility</EdFieldLabel>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "rgba(255,255,255,0.05)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.09)" }}>
                      <Toggle checked={editor.visible} disabled={editor.saving} onChange={() => updateEditorField("visible", !editor.visible)} />
                      <span style={{ fontSize: 13, color: editor.visible ? "#f5f0e8" : "rgba(245,240,232,0.4)", fontWeight: 500 }}>
                        {editor.visible ? "Active" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ height: 12 }} />
                <EdFieldLabel>Item type</EdFieldLabel>
                <select value={editor.itemType} onChange={(e) => {
                  const nextItemType = e.target.value === "COMBO" ? "COMBO" : "PRODUCT";
                  setEditor((current) => {
                    if (!current) return current;
                    return { ...current, itemType: nextItemType, comboProducts: nextItemType === "COMBO" ? current.comboProducts : [], comboProductLookupId: nextItemType === "COMBO" ? current.comboProductLookupId : "", comboProductLookupQuantityInput: nextItemType === "COMBO" ? current.comboProductLookupQuantityInput : "1", comboSlots: nextItemType === "COMBO" ? current.comboSlots : [] };
                  });
                }} style={edSelect}>
                  <option value="PRODUCT">Regular product</option>
                  <option value="COMBO">Combo</option>
                </select>
              </EdSection>

              {/* ── Section 02: Media ───────────────────────────────────────────── */}
              <EdSection num="02" title="Media" subtitle="The first image becomes the primary. Up to 8 images recommended."
                right={<span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "rgba(245,240,232,0.4)" }}>{editor.photoUrls.length} / 8</span>}>
                <input id={photoFileInputId} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" style={{ display: "none" }}
                  disabled={editor.uploadingPhoto}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadPhotoFile(f); e.currentTarget.value = ""; }} />
                <label htmlFor={photoFileInputId}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "24px 16px", borderRadius: 10, border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.02)", cursor: editor.uploadingPhoto ? "not-allowed" : "pointer", textAlign: "center" }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(245,240,232,0.6)" }}>
                    {editor.uploadingPhoto ? "Uploading…" : <>Drop images or <span style={{ color: "#ff3d14", cursor: "pointer" }}>browse</span></>}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(245,240,232,0.25)" }}>PNG, JPG, WebP · up to 8MB · first image is the primary</p>
                </label>

                {editor.photoUrls.length > 0 && (
                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {editor.photoUrls.map((url, idx) => (
                      <div key={url} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,0.06)", border: idx === 0 ? "2px solid #ff3d14" : "1px solid rgba(255,255,255,0.1)" }}>
                        <div style={{ width: "100%", height: "100%", backgroundImage: `url("${url}")`, backgroundSize: "cover", backgroundPosition: "center" }} />
                        {idx === 0 && (
                          <div style={{ position: "absolute", top: 5, left: 5, padding: "2px 6px", borderRadius: 4, background: "#ff3d14", fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "0.06em" }}>PRIMARY</div>
                        )}
                        <button type="button" onClick={() => removePhotoUrl(url)}
                          style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 4, background: "rgba(0,0,0,0.65)", border: "none", color: "rgba(245,240,232,0.8)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          ×
                        </button>
                      </div>
                    ))}
                    {editor.photoUrls.length < 8 && (
                      <label htmlFor={photoFileInputId} style={{ aspectRatio: "1", borderRadius: 8, border: "1px dashed rgba(255,255,255,0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", color: "rgba(245,240,232,0.3)", fontSize: 11 }}>
                        <span style={{ fontSize: 18 }}>+</span>
                        <span>ADD</span>
                      </label>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <input value={editor.newPhotoUrl} onChange={(e) => updateEditorField("newPhotoUrl", e.target.value)} placeholder="Or paste image URL https://…" style={{ ...edInput, flex: 1 }} />
                  <button type="button" onClick={addPhotoUrl} style={edSecondaryBtn}>Add URL</button>
                </div>
              </EdSection>

              {/* ── Section 03: Pricing & tax ───────────────────────────────────── */}
              <EdSection num="03" title="Pricing & tax" subtitle="Live price, optional compare-at strikethrough, tax rule.">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <EdFieldLabel required>Price</EdFieldLabel>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "rgba(245,240,232,0.4)" }}>$</span>
                      <input value={editor.priceInput} onChange={(e) => updateEditorField("priceInput", e.target.value)} placeholder="18.00" style={{ ...edInput, paddingLeft: 24 }} />
                    </div>
                  </div>
                  <div>
                    <EdFieldLabel>Compare-at price</EdFieldLabel>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "rgba(245,240,232,0.4)" }}>$</span>
                      <input value={editor.comparedAtPriceInput} onChange={(e) => updateEditorField("comparedAtPriceInput", e.target.value)} placeholder="22.00" style={{ ...edInput, paddingLeft: 24 }} />
                    </div>
                    <p style={{ marginTop: 4, fontSize: 11, color: "rgba(245,240,232,0.3)" }}>Optional — shown as strikethrough.</p>
                  </div>
                </div>
              </EdSection>

              {/* ── Section 04: Modifier groups ─────────────────────────────────── */}
              <EdSection num="04" title="Modifier groups" subtitle="Sizes, add-ons, dietary tweaks. Attach a reusable group or create one just for this product.">
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {editor.modifierGroups.map((mg) => (
                    <ModifierGroupCard key={mg.id} modifierGroup={mg}
                      savingId={editor.savingModifierGroupId}
                      deletingId={editor.deletingModifierGroupId}
                      creatingItemGroupId={editor.creatingModifierItemGroupId}
                      savingItemId={editor.savingModifierItemId}
                      deletingItemId={editor.deletingModifierItemId}
                      onUpdateTitle={(v) => updateModifierGroupDraft(mg.id, { title: v })}
                      onUpdateType={(v) => updateModifierGroupDraft(mg.id, { type: parseModifierGroupType(v) })}
                      onUpdateRequired={(v) => updateModifierGroupDraft(mg.id, { required: v })}
                      onUpdateMin={(v) => updateModifierGroupDraft(mg.id, { minSelection: v })}
                      onUpdateMax={(v) => updateModifierGroupDraft(mg.id, { maxSelection: v })}
                      onUpdateTitleES={(v) => updateModifierGroupTranslationDraft(mg.id, "es", v)}
                      onUpdateTitlePT={(v) => updateModifierGroupTranslationDraft(mg.id, "pt", v)}
                      onSave={() => void saveModifierGroup(mg.id)}
                      onRemove={() => removeModifierGroupFromProduct(mg.id)}
                      onDelete={() => void deleteModifierGroup(mg.id)}
                      onAddItem={() => void createModifierItem(mg.id)}
                      onUpdateItem={(itemId, patch) => updateModifierItemDraft(mg.id, itemId, patch)}
                      onUpdateItemTranslation={(itemId, lg, field, v) => updateModifierItemTranslationDraft(mg.id, itemId, lg, field, v)}
                      onSaveItem={(item) => void saveModifierItem(mg.id, item)}
                      onDeleteItem={(itemId) => void deleteModifierItem(mg.id, itemId)}
                      readTranslationField={readTranslationField}
                    />
                  ))}
                  {editor.modifierGroups.length === 0 && (
                    <p style={{ fontSize: 13, color: "rgba(245,240,232,0.3)", padding: "8px 0" }}>No modifier groups attached yet.</p>
                  )}
                </div>
                <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                  <div style={{ flex: 1, display: "flex", gap: 8 }}>
                    <select value={editor.modifierLookupIdToAttach} onChange={(e) => updateEditorField("modifierLookupIdToAttach", e.target.value)} style={{ ...edSelect, flex: 1 }}>
                      <option value="">Select existing group…</option>
                      {lookupModifierGroups.map((mg) => <option key={mg.id} value={mg.id}>{mg.title}</option>)}
                    </select>
                    <button type="button" onClick={attachExistingModifierGroup} style={{ ...edOutlineBtn, borderColor: "#ff3d14", color: "#ff3d14", whiteSpace: "nowrap" as const }}>
                      🔗 Attach group
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={editor.newModifierGroupTitle} onChange={(e) => updateEditorField("newModifierGroupTitle", e.target.value)} placeholder="New group name…" style={{ ...edInput, width: 160 }} />
                    <button type="button" onClick={() => void createModifierGroup()} disabled={editor.creatingModifierGroup} style={edSecondaryBtn}>
                      {editor.creatingModifierGroup ? "Creating…" : "+ New group"}
                    </button>
                  </div>
                </div>
              </EdSection>

              {/* ── Section 05: Preparation tasks ───────────────────────────────── */}
              {(() => {
                const allSteps = availableStations.flatMap((s) =>
                  s.preparationSteps.map((p) => ({ ...p, stationId: s.id, stationName: s.name })),
                );
                const attachedStepIds = new Set(editor.prepTasks.map((t) => t.stepId));
                const unattachedSteps = allSteps.filter((s) => !attachedStepIds.has(s.id));
                return (
                  <EdSection num="05" title="Preparation tasks" subtitle="Steps fire in parallel at their respective stations when an order is placed.">
                    {editor.prepTasks.length === 0 && (
                      <p style={{ fontSize: 13, color: "rgba(245,240,232,0.3)", padding: "4px 0 10px" }}>No steps attached yet.</p>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: editor.prepTasks.length > 0 ? 14 : 0 }}>
                      {editor.prepTasks.map((task) => (
                        <div key={task.stepId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.09)" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#f5f0e8", marginBottom: 3 }}>{task.stepName}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                              <span style={{ fontSize: 11, color: "rgba(245,240,232,0.45)", background: "rgba(255,255,255,0.06)", padding: "1px 7px", borderRadius: 4 }}>{task.stationName || "No station"}</span>
                              {task.goalMinutes > 0 && (
                                <span style={{ fontSize: 11, color: "rgba(245,240,232,0.4)", background: "rgba(255,255,255,0.05)", padding: "1px 7px", borderRadius: 4 }}>⏱ {task.goalMinutes} min</span>
                              )}
                              {task.includeComments && (
                                <span style={{ fontSize: 11, color: "rgba(245,240,232,0.4)", background: "rgba(255,255,255,0.05)", padding: "1px 7px", borderRadius: 4 }}>comments</span>
                              )}
                              {task.includeModifiers && (
                                <span style={{ fontSize: 11, color: "rgba(245,240,232,0.4)", background: "rgba(255,255,255,0.05)", padding: "1px 7px", borderRadius: 4 }}>modifiers</span>
                              )}
                            </div>
                          </div>
                          <button type="button" onClick={() => removePrepTask(task.stepId)}
                            style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(255,61,20,0.3)", background: "transparent", fontSize: 11, color: "#ff8066", cursor: "pointer", flexShrink: 0 }}>
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Attach existing step row */}
                    <div style={{ display: "flex", gap: 8, marginBottom: editor.newPrepStepFormOpen ? 0 : 10 }}>
                      <select
                        value={editor.prepTaskLookupStepId}
                        onChange={(e) => updateEditorField("prepTaskLookupStepId", e.target.value)}
                        style={{ ...edSelect, flex: 1 }}
                        disabled={editor.newPrepStepFormOpen}
                      >
                        <option value="">Attach an existing step…</option>
                        {availableStations.map((station) => (
                          <optgroup key={station.id} label={station.name}>
                            {station.preparationSteps.map((step) => (
                              <option key={step.id} value={step.id} disabled={attachedStepIds.has(step.id)}>
                                {step.name}{attachedStepIds.has(step.id) ? " (attached)" : ""}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                        {unattachedSteps.length === 0 && allSteps.length > 0 && (
                          <option value="" disabled>All steps already attached</option>
                        )}
                      </select>
                      <button
                        type="button"
                        disabled={!editor.prepTaskLookupStepId || editor.newPrepStepFormOpen}
                        onClick={() => editor.prepTaskLookupStepId && attachPrepStep(editor.prepTaskLookupStepId)}
                        style={{ ...edOutlineBtn, borderColor: "#ff3d14", color: "#ff3d14", opacity: editor.prepTaskLookupStepId && !editor.newPrepStepFormOpen ? 1 : 0.4 }}
                      >
                        Attach
                      </button>
                    </div>

                    {/* New step form / toggle */}
                    {!editor.newPrepStepFormOpen ? (
                      <button
                        type="button"
                        onClick={() => updateEditorField("newPrepStepFormOpen", true)}
                        style={{ ...edOutlineBtn, borderColor: "rgba(255,255,255,0.18)", color: "rgba(245,240,232,0.55)", fontSize: 12, padding: "5px 12px" }}
                      >
                        + Create new step
                      </button>
                    ) : (
                      <div style={{ marginTop: 12, padding: "16px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }}>
                        <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(245,240,232,0.4)", textTransform: "uppercase" as const }}>New preparation step</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                          <div style={{ gridColumn: "1/-1" }}>
                            <EdFieldLabel required>Step name</EdFieldLabel>
                            <input
                              autoFocus
                              value={editor.newPrepStepName}
                              onChange={(e) => updateEditorField("newPrepStepName", e.target.value)}
                              placeholder="e.g. Grill patty"
                              style={edInput}
                            />
                          </div>
                          <div>
                            <EdFieldLabel required>Station</EdFieldLabel>
                            <select
                              value={editor.newPrepStepStationId || availableStations[0]?.id || ""}
                              onChange={(e) => updateEditorField("newPrepStepStationId", e.target.value)}
                              style={edSelect}
                            >
                              {availableStations.length === 0 && <option value="">No stations yet</option>}
                              {availableStations.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <EdFieldLabel>Goal minutes</EdFieldLabel>
                            <input
                              type="number"
                              min={0}
                              value={editor.newPrepStepGoalMinutes}
                              onChange={(e) => updateEditorField("newPrepStepGoalMinutes", e.target.value)}
                              placeholder="0"
                              style={edInput}
                            />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", userSelect: "none" as const }}>
                            <input
                              type="checkbox"
                              checked={editor.newPrepStepIncludeComments}
                              onChange={(e) => updateEditorField("newPrepStepIncludeComments", e.target.checked)}
                              style={{ accentColor: "#ff3d14" }}
                            />
                            <span style={{ fontSize: 12.5, color: "rgba(245,240,232,0.65)" }}>Include comments</span>
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", userSelect: "none" as const }}>
                            <input
                              type="checkbox"
                              checked={editor.newPrepStepIncludeModifiers}
                              onChange={(e) => updateEditorField("newPrepStepIncludeModifiers", e.target.checked)}
                              style={{ accentColor: "#ff3d14" }}
                            />
                            <span style={{ fontSize: 12.5, color: "rgba(245,240,232,0.65)" }}>Include modifiers</span>
                          </label>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            disabled={editor.creatingPrepStep || !editor.newPrepStepName.trim() || availableStations.length === 0}
                            onClick={() => void createAndAttachPrepStep()}
                            style={{ ...edSecondaryBtn, opacity: editor.creatingPrepStep || !editor.newPrepStepName.trim() || availableStations.length === 0 ? 0.5 : 1, cursor: editor.creatingPrepStep || !editor.newPrepStepName.trim() ? "not-allowed" : "pointer" }}
                          >
                            {editor.creatingPrepStep ? "Creating…" : "Create & attach"}
                          </button>
                          <button
                            type="button"
                            disabled={editor.creatingPrepStep}
                            onClick={() => {
                              updateEditorField("newPrepStepFormOpen", false);
                              updateEditorField("newPrepStepName", "");
                              updateEditorField("newPrepStepGoalMinutes", "");
                              updateEditorField("newPrepStepIncludeComments", false);
                              updateEditorField("newPrepStepIncludeModifiers", false);
                            }}
                            style={{ ...edOutlineBtn, fontSize: 12 }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </EdSection>
                );
              })()}

              {/* ── COMBO section (conditionally shown) ─────────────────────────── */}
              {editor.itemType === "COMBO" && (
                <EdSection num="06" title="Combo composition" subtitle="Fixed products or slot-based choices.">
                  <div style={{ marginBottom: 16, padding: "12px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(245,240,232,0.4)", textTransform: "uppercase" as const }}>Fixed products</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 90px auto", gap: 8, marginBottom: 8 }}>
                      <select value={editor.comboProductLookupId} onChange={(e) => updateEditorField("comboProductLookupId", e.target.value)} style={edSelect}>
                        <option value="">Select product…</option>
                        {productLookupList.filter((p) => p.id !== editor.productId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input type="number" min={1} value={editor.comboProductLookupQuantityInput} onChange={(e) => updateEditorField("comboProductLookupQuantityInput", e.target.value)} placeholder="Qty" style={edInput} />
                      <button type="button" onClick={addDirectComboProduct} style={edSecondaryBtn}>Add</button>
                    </div>
                    {editor.comboProducts.map((item) => (
                      <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px auto", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: "#f5f0e8" }}>{productNameById.get(item.productId) || "Unknown"}</span>
                        <input type="number" min={1} value={item.quantity} onChange={(e) => { const v = Number.parseInt(e.target.value || "0", 10); updateDirectComboProductQuantity(item.id, Number.isNaN(v) ? 0 : v); }} style={edInput} />
                        <button type="button" onClick={() => removeDirectComboProduct(item.id)} style={{ ...edOutlineBtn, borderColor: "rgba(255,61,20,0.4)", color: "#ff3d14" }}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(245,240,232,0.35)" }}>Or use slot-based choices.</p>
                    <button type="button" onClick={addComboSlot} style={edSecondaryBtn}>+ Add slot</button>
                  </div>
                  {editor.comboSlots.map((slot, si) => (
                    <div key={slot.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", padding: "14px", marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#f5f0e8" }}>Slot {si + 1}</span>
                        <button type="button" onClick={() => removeComboSlot(slot.id)} style={{ ...edOutlineBtn, borderColor: "rgba(255,61,20,0.4)", color: "#ff3d14", padding: "2px 8px", fontSize: 11 }}>Remove</button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <input value={slot.name} onChange={(e) => updateComboSlot(slot.id, { name: e.target.value })} placeholder="Slot name" style={{ ...edInput, gridColumn: "1/-1" }} />
                        <input value={readTranslationField(slot.translations, "es", "title")} onChange={(e) => updateComboSlotTranslation(slot.id, "es", "title", e.target.value)} placeholder="Slot name (ES)" style={edInput} />
                        <input value={readTranslationField(slot.translations, "pt", "title")} onChange={(e) => updateComboSlotTranslation(slot.id, "pt", "title", e.target.value)} placeholder="Slot name (PT)" style={edInput} />
                        <input type="number" min={0} value={slot.minSelect} onChange={(e) => updateComboSlot(slot.id, { minSelect: Number.parseInt(e.target.value || "0", 10) })} placeholder="Min" style={edInput} />
                        <input type="number" min={0} value={slot.maxSelect} onChange={(e) => updateComboSlot(slot.id, { maxSelect: Number.parseInt(e.target.value || "0", 10) })} placeholder="Max" style={edInput} />
                        <label style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(245,240,232,0.6)", cursor: "pointer" }}>
                          <input type="checkbox" checked={slot.allowDuplicates} onChange={(e) => updateComboSlot(slot.id, { allowDuplicates: e.target.checked })} />
                          Allow duplicate picks
                        </label>
                      </div>
                      <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(245,240,232,0.4)", textTransform: "uppercase" as const }}>Products in slot</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px auto", gap: 8, marginBottom: 6 }}>
                        <select value={slot.optionLookupProductId} onChange={(e) => updateComboSlot(slot.id, { optionLookupProductId: e.target.value })} style={edSelect}>
                          <option value="">Select product…</option>
                          {productLookupList.filter((p) => p.id !== editor.productId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input value={slot.optionLookupExtraPriceInput} onChange={(e) => updateComboSlot(slot.id, { optionLookupExtraPriceInput: e.target.value })} placeholder="Extra $" style={edInput} />
                        <button type="button" onClick={() => addComboSlotOption(slot.id)} style={edSecondaryBtn}>Add</button>
                      </div>
                      {slot.options.map((opt) => (
                        <div key={opt.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px auto", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: "#f5f0e8" }}>{productNameById.get(opt.productId) || "Unknown"}</span>
                          <input value={opt.extraPriceInput} onChange={(e) => updateComboSlotOption(slot.id, opt.id, { extraPriceInput: e.target.value })} placeholder="Extra $" style={edInput} />
                          <button type="button" onClick={() => removeComboSlotOption(slot.id, opt.id)} style={{ ...edOutlineBtn, borderColor: "rgba(255,61,20,0.4)", color: "#ff3d14" }}>✕</button>
                        </div>
                      ))}
                    </div>
                  ))}
                </EdSection>
              )}

            </div>{/* end max-width container */}
          </div>{/* end scrollable body */}
        </div>
      ) : null}
    </>
  );
}
