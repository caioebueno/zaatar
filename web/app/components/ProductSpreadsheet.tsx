"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Button from "./Button";

type SpreadsheetRow = {
  id: string;
  createdAt: string;
  name: string;
  visible: boolean;
  description: string | null;
  price: number | null;
  comparedAtPrice: number | null;
  categoryId: string | null;
  categoryIndex: number | null;
  translations: unknown | null;
  photos: {
    id: string;
    name: string;
    url: string;
  }[];
  photoIds: string[];
  modifierGroupIds: string[];
  preparationStepIds: string[];
};

type EditableRow = {
  id: string;
  createdAt: string;
  name: string;
  visible: boolean;
  description: string;
  price: string;
  comparedAtPrice: string;
  categoryId: string;
  categoryIndex: string;
  translationsText: string;
  photoIdsText: string;
  modifierGroupIdsText: string;
  preparationStepIdsText: string;
  statusMessage?: string;
  errorMessage?: string;
};

type RelationField =
  | "photoIdsText"
  | "modifierGroupIdsText"
  | "preparationStepIdsText";

type EditableTextField = Exclude<
  keyof EditableRow,
  "visible" | "statusMessage" | "errorMessage"
>;

type LookupOption = {
  id: string;
  name?: string;
  title?: string;
  url?: string;
  menuIndex?: number | null;
  createdAt?: string;
  stationId?: string;
  stationName?: string;
  includeComments?: boolean;
  includeModifiers?: boolean;
};

type ProductApiResponse = {
  products: SpreadsheetRow[];
  lookup: {
    categories: LookupOption[];
    files: LookupOption[];
    modifierGroups: LookupOption[];
    preparationSteps: LookupOption[];
    stations: LookupOption[];
  };
};

type TranslationEditorEntry = {
  id: string;
  language: string;
  key: string;
  value: string;
};

type PreparationStepDraft = {
  name: string;
  stationId: string;
  includeComments: boolean;
  includeModifiers: boolean;
};

type TableRenderItem =
  | {
      kind: "categoryHeader";
      category: LookupOption;
      rowCount: number;
    }
  | {
      kind: "uncategorizedHeader";
      rowCount: number;
    }
  | {
      kind: "product";
      row: EditableRow;
      categoryKey: string;
    };

function toIdCsv(values: string[]) {
  return values.join(", ");
}

function parseIdCsv(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function toEditableRow(row: SpreadsheetRow): EditableRow {
  return {
    id: row.id,
    createdAt: row.createdAt,
    name: row.name,
    visible: row.visible !== false,
    description: row.description ?? "",
    price: row.price === null ? "" : String(row.price),
    comparedAtPrice:
      row.comparedAtPrice === null ? "" : String(row.comparedAtPrice),
    categoryId: row.categoryId ?? "",
    categoryIndex:
      row.categoryIndex === null || row.categoryIndex === undefined
        ? ""
        : String(row.categoryIndex),
    translationsText: row.translations
      ? JSON.stringify(row.translations, null, 2)
      : "",
    photoIdsText: toIdCsv(
      row.photos?.map((photo) => photo.url).filter(Boolean) || [],
    ),
    modifierGroupIdsText: toIdCsv(row.modifierGroupIds),
    preparationStepIdsText: toIdCsv(row.preparationStepIds),
  };
}

function serializeComparableRow(row: EditableRow): string {
  return JSON.stringify({
    name: row.name.trim(),
    visible: row.visible,
    description: row.description.trim(),
    price: row.price.trim(),
    comparedAtPrice: row.comparedAtPrice.trim(),
    categoryId: row.categoryId.trim(),
    categoryIndex: row.categoryIndex.trim(),
    translationsText: row.translationsText.trim(),
    photoIds: parseIdCsv(row.photoIdsText),
    modifierGroupIds: parseIdCsv(row.modifierGroupIdsText),
    preparationStepIds: parseIdCsv(row.preparationStepIdsText),
  });
}

function normalizeNullableNumber(value: string, field: string) {
  const normalized = value.trim();

  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${field} must be an integer in cents`);
  }

  return Number(normalized);
}

function normalizeCurrencyDigitsInput(value: string): string {
  return value.replace(/\D/g, "");
}

function formatCurrencyDigitsInput(value: string): string {
  const digits = normalizeCurrencyDigitsInput(value);

  if (!digits) return "";

  const cents = Number(digits);
  const dollars = Math.floor(cents / 100);
  const centsPart = String(cents % 100).padStart(2, "0");

  return `${dollars}.${centsPart}`;
}

function parsePayload(row: EditableRow): {
  name: string;
  visible: boolean;
  description: string | null;
  price: number | null;
  comparedAtPrice: number | null;
  categoryId: string | null;
  categoryIndex: number | null;
  translations: unknown | null;
  photoUrls: string[];
  modifierGroupIds: string[];
  preparationStepIds: string[];
} {
  const name = row.name.trim();

  if (!name) {
    throw new Error("name is required");
  }

  let parsedTranslations: unknown | null = null;
  const normalizedTranslations = row.translationsText.trim();

  if (normalizedTranslations) {
    try {
      parsedTranslations = JSON.parse(normalizedTranslations);
    } catch {
      throw new Error("translations must be valid JSON");
    }

    if (
      typeof parsedTranslations !== "object" ||
      parsedTranslations === null ||
      Array.isArray(parsedTranslations)
    ) {
      throw new Error("translations must be a JSON object");
    }
  }

  return {
    name,
    visible: row.visible,
    description: row.description.trim() || null,
    price: normalizeNullableNumber(row.price, "price"),
    comparedAtPrice: normalizeNullableNumber(
      row.comparedAtPrice,
      "comparedAtPrice",
    ),
    categoryId: row.categoryId.trim() || null,
    categoryIndex: normalizeNullableNumber(row.categoryIndex, "categoryIndex"),
    translations: parsedTranslations,
    photoUrls: parseIdCsv(row.photoIdsText),
    modifierGroupIds: parseIdCsv(row.modifierGroupIdsText),
    preparationStepIds: parseIdCsv(row.preparationStepIdsText),
  };
}

function renderLookupLabel(option: LookupOption): string {
  return option.name || option.title || option.url || option.id;
}

function renderPreparationStepLabel(option: LookupOption): string {
  const baseLabel = renderLookupLabel(option);

  if (option.stationName) {
    return `${option.stationName} - ${baseLabel}`;
  }

  if (option.stationId) {
    return `${option.stationId} - ${baseLabel}`;
  }

  return baseLabel;
}

function createEditorEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createUuid() {
  if (
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;

    return value.toString(16);
  });
}

function parseTranslationsToEditorEntries(
  translationsText: string,
): TranslationEditorEntry[] {
  const normalized = translationsText.trim();

  if (!normalized) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(normalized);
  } catch {
    throw new Error("Current translations JSON is invalid");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error("Translations must be a JSON object");
  }

  const entries: TranslationEditorEntry[] = [];
  const languages = Object.entries(parsed as Record<string, unknown>);

  for (const [language, value] of languages) {
    if (
      typeof value !== "object" ||
      value === null ||
      Array.isArray(value)
    ) {
      continue;
    }

    for (const [key, rawValue] of Object.entries(
      value as Record<string, unknown>,
    )) {
      entries.push({
        id: createEditorEntryId(),
        language,
        key,
        value:
          rawValue === undefined || rawValue === null ? "" : String(rawValue),
      });
    }
  }

  return entries;
}

function buildTranslationsTextFromEditorEntries(
  entries: TranslationEditorEntry[],
): string {
  const output: Record<string, Record<string, string>> = {};

  for (const entry of entries) {
    const language = entry.language.trim();
    const key = entry.key.trim();

    if (!language || !key) continue;

    if (!output[language]) {
      output[language] = {};
    }

    output[language][key] = entry.value;
  }

  if (Object.keys(output).length === 0) {
    return "";
  }

  return JSON.stringify(output, null, 2);
}

function parseIndexValue(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return Number.MAX_SAFE_INTEGER;
  }

  return parsed;
}

function isValidHttpUrl(value: string): boolean {
  const normalized = value.trim();

  if (!normalized) return false;

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function sortRowsByCategoryIndex(rows: EditableRow[]): EditableRow[] {
  return rows.slice().sort((left, right) => {
    const leftIndex = parseIndexValue(left.categoryIndex);
    const rightIndex = parseIndexValue(right.categoryIndex);

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return (
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  });
}

function sortCategoriesByMenuIndex(categories: LookupOption[]): LookupOption[] {
  return categories.slice().sort((left, right) => {
    const leftIndex =
      typeof left.menuIndex === "number" && Number.isFinite(left.menuIndex)
        ? left.menuIndex
        : Number.MAX_SAFE_INTEGER;
    const rightIndex =
      typeof right.menuIndex === "number" && Number.isFinite(right.menuIndex)
        ? right.menuIndex
        : Number.MAX_SAFE_INTEGER;

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;

    if (leftTime !== rightTime) {
      return leftTime - rightTime;
    }

    return left.id.localeCompare(right.id);
  });
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

const RELATION_FIELD_LABELS: Record<RelationField, string> = {
  photoIdsText: "photos",
  modifierGroupIdsText: "modifierGroupIds",
  preparationStepIdsText: "preparationStepIds",
};

export default function ProductSpreadsheet() {
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [lookup, setLookup] = useState<ProductApiResponse["lookup"]>({
    categories: [],
    files: [],
    modifierGroups: [],
    preparationSteps: [],
    stations: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingRowIds, setSavingRowIds] = useState<Set<string>>(new Set());
  const [originalById, setOriginalById] = useState<Record<string, string>>({});
  const [savingAll, setSavingAll] = useState(false);
  const [openRelationEditor, setOpenRelationEditor] = useState<{
    rowId: string;
    field: RelationField;
  } | null>(null);
  const [relationPickerByKey, setRelationPickerByKey] = useState<
    Record<string, string>
  >({});
  const [photoUrlInputByKey, setPhotoUrlInputByKey] = useState<
    Record<string, string>
  >({});
  const [openTranslationsEditorRowId, setOpenTranslationsEditorRowId] =
    useState<string | null>(null);
  const [translationsEditorEntries, setTranslationsEditorEntries] = useState<
    TranslationEditorEntry[]
  >([]);
  const [translationsEditorError, setTranslationsEditorError] = useState<
    string | null
  >(null);
  const [dragCategoryId, setDragCategoryId] = useState<string | null>(null);
  const [dragProductId, setDragProductId] = useState<string | null>(null);
  const [persistingReorder, setPersistingReorder] = useState(false);
  const [isChangingCategoryIndex, setIsChangingCategoryIndex] = useState(false);
  const [expandedDescriptionRowId, setExpandedDescriptionRowId] = useState<
    string | null
  >(null);
  const [preparationStepDraftsById, setPreparationStepDraftsById] = useState<
    Record<string, PreparationStepDraft>
  >({});
  const [savingPreparationStepId, setSavingPreparationStepId] = useState<
    string | null
  >(null);

  const refreshProducts = useCallback(async () => {
    setLoading(true);
    setLoadingError(null);

    try {
      const response = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("failed to load products");
      }

      const data = (await response.json()) as ProductApiResponse;
      const editableRows = data.products.map(toEditableRow);
      const comparableMap = Object.fromEntries(
        editableRows.map((row) => [row.id, serializeComparableRow(row)]),
      );

      setRows(editableRows);
      setLookup(data.lookup);
      setOriginalById(comparableMap);
    } catch (error) {
      console.error("Failed to load products for spreadsheet:", error);
      setLoadingError("Could not load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  const isRowDirty = useCallback(
    (row: EditableRow) => serializeComparableRow(row) !== originalById[row.id],
    [originalById],
  );

  const changedCount = useMemo(
    () => rows.filter((row) => isRowDirty(row)).length,
    [rows, isRowDirty],
  );

  const visibleRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return rows;

    return rows.filter((row) => {
      return (
        row.name.toLowerCase().includes(normalizedSearch) ||
        row.id.toLowerCase().includes(normalizedSearch) ||
        row.categoryId.toLowerCase().includes(normalizedSearch) ||
        row.categoryIndex.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [rows, search]);

  const onCellChange = useCallback(
    (id: string, field: EditableTextField, value: string) => {
      setRows((currentRows) =>
        currentRows.map((row) =>
          row.id === id
            ? {
                ...row,
                [field]: value,
                statusMessage: undefined,
                errorMessage: undefined,
              }
            : row,
        ),
      );
    },
    [],
  );

  const onVisibleChange = useCallback((id: string, visible: boolean) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === id
          ? {
              ...row,
              visible,
              statusMessage: undefined,
              errorMessage: undefined,
            }
          : row,
      ),
    );
  }, []);

  const getRelationIds = useCallback((row: EditableRow, field: RelationField) => {
    return parseIdCsv(row[field]);
  }, []);

  const setRelationIds = useCallback(
    (rowId: string, field: RelationField, ids: string[]) => {
      const normalizedIds = Array.from(
        new Set(
          ids.map((id) => id.trim()).filter(Boolean),
        ),
      );
      onCellChange(rowId, field, toIdCsv(normalizedIds));
    },
    [onCellChange],
  );

  const getRelationLookupOptions = useCallback(
    (field: RelationField): LookupOption[] => {
      if (field === "photoIdsText") return lookup.files;
      if (field === "modifierGroupIdsText") return lookup.modifierGroups;
      return lookup.preparationSteps;
    },
    [lookup.files, lookup.modifierGroups, lookup.preparationSteps],
  );

  const openTranslationsEditor = useCallback((row: EditableRow) => {
    try {
      const entries = parseTranslationsToEditorEntries(row.translationsText);
      setTranslationsEditorEntries(entries);
      setTranslationsEditorError(null);
      setOpenTranslationsEditorRowId(row.id);
    } catch (error) {
      setTranslationsEditorEntries([]);
      setTranslationsEditorError(
        error instanceof Error ? error.message : "Invalid translations JSON",
      );
      setOpenTranslationsEditorRowId(row.id);
    }
  }, []);

  const closeTranslationsEditor = useCallback(() => {
    setOpenTranslationsEditorRowId(null);
    setTranslationsEditorEntries([]);
    setTranslationsEditorError(null);
  }, []);

  const getPreparationStepDraft = useCallback(
    (preparationStepId: string): PreparationStepDraft | undefined => {
      const existingDraft = preparationStepDraftsById[preparationStepId];

      if (existingDraft) {
        return existingDraft;
      }

      const step = lookup.preparationSteps.find(
        (item) => item.id === preparationStepId,
      );

      if (!step) return undefined;

      return {
        name: step.name || "",
        stationId: step.stationId || "",
        includeComments: Boolean(step.includeComments),
        includeModifiers: Boolean(step.includeModifiers),
      };
    },
    [lookup.preparationSteps, preparationStepDraftsById],
  );

  const updatePreparationStepDraft = useCallback(
    (
      preparationStepId: string,
      patch: Partial<PreparationStepDraft>,
    ) => {
      setPreparationStepDraftsById((current) => {
        const fallback = getPreparationStepDraft(preparationStepId);
        const nextBase: PreparationStepDraft = fallback || {
          name: "",
          stationId: "",
          includeComments: false,
          includeModifiers: false,
        };

        return {
          ...current,
          [preparationStepId]: {
            ...nextBase,
            ...patch,
          },
        };
      });
    },
    [getPreparationStepDraft],
  );

  const savePreparationStepDraft = useCallback(
    async (preparationStepId: string) => {
      const draft = getPreparationStepDraft(preparationStepId);
      if (!draft) return;
      const name = draft.name.trim();
      const stationId = draft.stationId.trim();
      if (!stationId || !name) return;
      const isExistingPreparationStep = lookup.preparationSteps.some(
        (step) => step.id === preparationStepId,
      );

      try {
        setSavingPreparationStepId(preparationStepId);
        const response = await fetch(
          isExistingPreparationStep
            ? `/api/preparation-steps/${encodeURIComponent(preparationStepId)}`
            : "/api/preparation-steps",
          {
            method: isExistingPreparationStep ? "PATCH" : "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: preparationStepId,
              name,
              stationId,
              includeComments: draft.includeComments,
              includeModifiers: draft.includeModifiers,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to save preparation step");
        }

        const updated = (await response.json()) as {
          id: string;
          name: string;
          stationId: string;
          stationName?: string | null;
          includeComments?: boolean;
          includeModifiers?: boolean;
        };

        setLookup((current) => {
          const fallbackStationName =
            current.stations.find((station) => station.id === updated.stationId)
              ?.name;
          const mergedPreparationStep: LookupOption = {
            id: updated.id,
            name: updated.name,
            stationId: updated.stationId,
            stationName: updated.stationName ?? fallbackStationName,
            includeComments: Boolean(updated.includeComments),
            includeModifiers: Boolean(updated.includeModifiers),
          };
          const alreadyExists = current.preparationSteps.some(
            (step) => step.id === updated.id,
          );

          return {
            ...current,
            preparationSteps: alreadyExists
              ? current.preparationSteps.map((step) =>
                  step.id === updated.id ? { ...step, ...mergedPreparationStep } : step,
                )
              : [...current.preparationSteps, mergedPreparationStep],
          };
        });
      } catch (error) {
        console.error("Failed to save preparation step:", error);
      } finally {
        setSavingPreparationStepId(null);
      }
    },
    [getPreparationStepDraft, lookup.preparationSteps],
  );

  const groupedVisibleRows = useMemo(() => {
    const categoryOrder = sortCategoriesByMenuIndex(lookup.categories);
    const groups = categoryOrder
      .map((category) => ({
        category,
        rows: sortRowsByCategoryIndex(
          visibleRows.filter((row) => row.categoryId === category.id),
        ),
      }))
      .filter((group) => group.rows.length > 0);

    const uncategorizedRows = sortRowsByCategoryIndex(
      visibleRows.filter((row) => !row.categoryId),
    );

    return {
      categories: groups,
      uncategorizedRows,
    };
  }, [lookup.categories, visibleRows]);

  const tableRenderItems = useMemo(() => {
    if (isChangingCategoryIndex) {
      return sortCategoriesByMenuIndex(lookup.categories).map((category) => ({
        kind: "categoryHeader" as const,
        category,
        rowCount: rows.filter((row) => row.categoryId === category.id).length,
      }));
    }

    const items: TableRenderItem[] = [];

    for (const group of groupedVisibleRows.categories) {
      items.push({
        kind: "categoryHeader",
        category: group.category,
        rowCount: group.rows.length,
      });

      for (const row of group.rows) {
        items.push({
          kind: "product",
          row,
          categoryKey: group.category.id,
        });
      }
    }

    if (groupedVisibleRows.uncategorizedRows.length > 0) {
      items.push({
        kind: "uncategorizedHeader",
        rowCount: groupedVisibleRows.uncategorizedRows.length,
      });

      for (const row of groupedVisibleRows.uncategorizedRows) {
        items.push({
          kind: "product",
          row,
          categoryKey: "",
        });
      }
    }

    return items;
  }, [
    groupedVisibleRows.categories,
    groupedVisibleRows.uncategorizedRows,
    isChangingCategoryIndex,
    lookup.categories,
    rows,
  ]);

  const persistCategoryOrder = useCallback(async (categories: LookupOption[]) => {
    const categoriesWithIndex = categories.map((category, index) => ({
      ...category,
      menuIndex: index + 1,
    }));

    setLookup((current) => ({
      ...current,
      categories: categoriesWithIndex,
    }));

    try {
      setPersistingReorder(true);
      await Promise.all(
        categoriesWithIndex.map((category) =>
          fetch(`/api/categories/${encodeURIComponent(category.id)}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              menuIndex: category.menuIndex,
            }),
          }),
        ),
      );
    } catch (error) {
      console.error("Failed to persist category order:", error);
    } finally {
      setPersistingReorder(false);
    }
  }, []);

  const onCategoryDrop = useCallback(
    (targetCategoryId: string) => {
      if (!dragCategoryId || dragCategoryId === targetCategoryId) return;
      if (search.trim()) return;

      const currentOrder = sortCategoriesByMenuIndex(lookup.categories).map(
        (category) => category.id,
      );
      const reorderedIds = reorderIds(currentOrder, dragCategoryId, targetCategoryId);
      const categoryById = new Map(
        lookup.categories.map((category) => [category.id, category]),
      );
      const reorderedCategories = reorderedIds
        .map((id) => categoryById.get(id))
        .filter((category): category is LookupOption => Boolean(category));

      if (reorderedCategories.length !== lookup.categories.length) {
        return;
      }

      void persistCategoryOrder(reorderedCategories);
    },
    [dragCategoryId, lookup.categories, persistCategoryOrder, search],
  );

  const persistProductCategoryIndexes = useCallback(async (rowsToPersist: EditableRow[]) => {
    if (rowsToPersist.length === 0) return;

    try {
      setPersistingReorder(true);
      await Promise.all(
        rowsToPersist.map((row) =>
          fetch(`/api/products/${encodeURIComponent(row.id)}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              categoryIndex: Number(row.categoryIndex),
            }),
          }),
        ),
      );
    } catch (error) {
      console.error("Failed to persist product order:", error);
    } finally {
      setPersistingReorder(false);
    }
  }, []);

  const onProductDrop = useCallback(
    (categoryId: string, targetProductId: string) => {
      if (!dragProductId || dragProductId === targetProductId) return;
      if (search.trim()) return;

      const sourceRows = sortRowsByCategoryIndex(
        rows.filter((row) => (row.categoryId || "") === categoryId),
      );
      const rowIds = sourceRows.map((row) => row.id);
      const reorderedIds = reorderIds(rowIds, dragProductId, targetProductId);

      if (rowIds.join("|") === reorderedIds.join("|")) {
        return;
      }

      const indexById = new Map(
        reorderedIds.map((rowId, index) => [rowId, String(index + 1)]),
      );
      const nextRows = rows.map((row) => {
        if ((row.categoryId || "") !== categoryId) return row;

        const nextIndex = indexById.get(row.id);
        if (!nextIndex) return row;

        return {
          ...row,
          categoryIndex: nextIndex,
          statusMessage: undefined,
          errorMessage: undefined,
        };
      });
      const reorderedRows = sortRowsByCategoryIndex(
        nextRows.filter((row) => (row.categoryId || "") === categoryId),
      );

      setRows(nextRows);
      void persistProductCategoryIndexes(reorderedRows);
    },
    [dragProductId, persistProductCategoryIndexes, rows, search],
  );

  const saveRow = useCallback(
    async (id: string) => {
      const row = rows.find((item) => item.id === id);

      if (!row) return false;

      let payload: ReturnType<typeof parsePayload>;

      try {
        payload = parsePayload(row);
      } catch (error) {
        setRows((currentRows) =>
          currentRows.map((item) =>
            item.id === id
              ? {
                  ...item,
                  errorMessage:
                    error instanceof Error ? error.message : "Invalid row data",
                  statusMessage: undefined,
                }
              : item,
          ),
        );

        return false;
      }

      setSavingRowIds((current) => new Set(current).add(id));

      try {
        const response = await fetch(`/api/products/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const responseData = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            (responseData &&
              typeof responseData === "object" &&
              "field" in responseData &&
              typeof responseData.field === "string" &&
              responseData.field) ||
            (responseData &&
              typeof responseData === "object" &&
              "error" in responseData &&
              typeof responseData.error === "string" &&
              responseData.error) ||
            "Failed to save row";

          throw new Error(message);
        }

        const updated = toEditableRow(responseData as SpreadsheetRow);
        const comparable = serializeComparableRow(updated);

        setRows((currentRows) =>
          currentRows.map((item) =>
            item.id === id
              ? {
                  ...updated,
                  statusMessage: "Saved",
                  errorMessage: undefined,
                }
              : item,
          ),
        );
        setOriginalById((current) => ({
          ...current,
          [id]: comparable,
        }));

        return true;
      } catch (error) {
        setRows((currentRows) =>
          currentRows.map((item) =>
            item.id === id
              ? {
                  ...item,
                  errorMessage:
                    error instanceof Error
                      ? error.message
                      : "Failed to save row",
                  statusMessage: undefined,
                }
              : item,
          ),
        );

        return false;
      } finally {
        setSavingRowIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }
    },
    [rows],
  );

  const saveAll = useCallback(async () => {
    const changedRows = rows.filter((row) => isRowDirty(row));

    if (changedRows.length === 0) return;

    setSavingAll(true);

    try {
      for (const row of changedRows) {
        await saveRow(row.id);
      }
    } finally {
      setSavingAll(false);
    }
  }, [rows, isRowDirty, saveRow]);

  if (loading) {
    return (
      <div className="h-dvh w-full bg-zinc-100 flex items-center justify-center">
        <div className="text-base font-semibold text-text">Loading products...</div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="h-dvh w-full bg-zinc-100 flex flex-col items-center justify-center gap-3">
        <div className="text-base font-semibold text-red-600">{loadingError}</div>
        <div>
          <Button size="sm" variant="outline" onClick={() => void refreshProducts()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const openTranslationsEditorRow = openTranslationsEditorRowId
    ? rows.find((row) => row.id === openTranslationsEditorRowId)
    : undefined;

  return (
    <div className="h-dvh w-full bg-zinc-100">
      <div className="h-full w-full flex flex-col">
        <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-zinc-200 bg-white">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="w-full max-w-[420px] rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void refreshProducts()}
              disabled={savingAll}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => void saveAll()}
              disabled={savingAll || changedCount === 0}
            >
              {savingAll ? "Saving..." : `Save All (${changedCount})`}
            </Button>
          </div>
        </div>
        <div className="flex-1 min-h-0 border border-zinc-200 bg-white overflow-hidden">
          <div className="h-full overflow-auto">
            <table className="min-w-[2080px] w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-zinc-100/90 backdrop-blur">
              <tr>
                <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600 sticky left-0 z-20 bg-zinc-100/95 min-w-[220px]">
                  name
                </th>
                <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                  visible
                </th>
                <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                  createdAt
                </th>
                <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                  description
                </th>
                <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                  price
                </th>
                <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                  comparedAtPrice
                </th>
                <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                  categoryId
                </th>
                <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                  photos
                </th>
                <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                  modifierGroupIds
                </th>
                <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                  preparationStepIds
                </th>
                <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                  translations
                </th>
                <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                  actions
                </th>
              </tr>
              </thead>
              <tbody>
              {tableRenderItems.map((item) => {
                if (item.kind === "categoryHeader") {
                  return (
                    <tr
                      key={`category-header-${item.category.id}`}
                      draggable={!search.trim() && !persistingReorder}
                      onDragStart={() => {
                        if (search.trim()) return;
                        setIsChangingCategoryIndex(true);
                        setDragCategoryId(item.category.id);
                      }}
                      onDragEnd={() => {
                        setDragCategoryId(null);
                        setIsChangingCategoryIndex(false);
                      }}
                      onDragOver={(event) => {
                        if (search.trim()) return;
                        event.preventDefault();
                      }}
                      onDrop={(event) => {
                        if (search.trim()) return;
                        event.preventDefault();
                        onCategoryDrop(item.category.id);
                        setDragCategoryId(null);
                        setIsChangingCategoryIndex(false);
                      }}
                      className="bg-zinc-200/70"
                    >
                      <td
                        colSpan={12}
                        className="border border-zinc-200 px-3 py-2.5 text-left"
                      >
                        <span className="text-[12px] font-semibold text-zinc-700">
                          {renderLookupLabel(item.category)}
                        </span>
                      </td>
                    </tr>
                  );
                }

                if (item.kind === "uncategorizedHeader") {
                  return (
                    <tr key="uncategorized-header" className="bg-zinc-100">
                      <td
                        colSpan={12}
                        className="border border-zinc-200 px-3 py-2.5 text-[12px] font-semibold text-zinc-700"
                      >
                        No category | Products: {item.rowCount}
                      </td>
                    </tr>
                  );
                }

                const row = item.row;
                const dirty = isRowDirty(row);
                const saving = savingRowIds.has(row.id);
                const isDescriptionExpanded = expandedDescriptionRowId === row.id;
                const openFieldForRow =
                  openRelationEditor?.rowId === row.id
                    ? openRelationEditor.field
                    : null;
                const openFieldLabel = openFieldForRow
                  ? RELATION_FIELD_LABELS[openFieldForRow]
                  : null;
                const openFieldIds = openFieldForRow
                  ? getRelationIds(row, openFieldForRow)
                  : [];
                const openFieldLookupOptions = openFieldForRow
                  ? getRelationLookupOptions(openFieldForRow)
                  : [];
                const lookupLabelById = new Map(
                  openFieldLookupOptions.map((option) => [
                    option.id,
                    openFieldForRow === "preparationStepIdsText"
                      ? renderPreparationStepLabel(option)
                      : renderLookupLabel(option),
                  ]),
                );
                const pickerKey = openFieldForRow
                  ? `${row.id}:${openFieldForRow}`
                  : "";
                const pickerValue = pickerKey
                  ? relationPickerByKey[pickerKey] || ""
                  : "";
                const photoUrlInputValue = pickerKey
                  ? photoUrlInputByKey[pickerKey] || ""
                  : "";
                const canAddPhotoUrl = isValidHttpUrl(photoUrlInputValue);
                const availableStationOptions =
                  openFieldForRow === "preparationStepIdsText"
                    ? lookup.stations.map((station) => ({
                        id: station.id,
                        name: station.name || station.id,
                      }))
                    : [];
                const selectableLookupOptions = openFieldLookupOptions;
                const attachableLookupOptions =
                  openFieldForRow === "preparationStepIdsText"
                    ? selectableLookupOptions.filter(
                        (option) => !openFieldIds.includes(option.id),
                      )
                    : openFieldForRow === "photoIdsText"
                      ? selectableLookupOptions.filter(
                          (option) =>
                            Boolean(option.url) &&
                            !openFieldIds.includes((option.url || "").trim()),
                        )
                    : selectableLookupOptions;

                return (
                  <Fragment key={row.id}>
                    <tr
                      draggable={!search.trim() && !saving && !persistingReorder}
                      onDragStart={() => {
                        if (search.trim()) return;
                        setDragProductId(row.id);
                      }}
                      onDragEnd={() => setDragProductId(null)}
                      onDragOver={(event) => {
                        if (search.trim()) return;
                        event.preventDefault();
                      }}
                      onDrop={(event) => {
                        if (search.trim()) return;
                        event.preventDefault();
                        onProductDrop(item.categoryKey, row.id);
                        setDragProductId(null);
                      }}
                      className={dirty ? "bg-indigo-50/60" : "bg-white hover:bg-zinc-50"}
                    >
                      <td
                        className={`border border-zinc-200 p-0 align-top min-w-[220px] sticky left-0 z-10 focus-within:outline focus-within:outline-2 focus-within:outline-indigo-400 focus-within:outline-offset-[-2px] focus-within:z-20 ${
                          dirty ? "bg-indigo-50" : "bg-white"
                        }`}
                      >
                        <input
                          value={row.name}
                          onChange={(event) =>
                            onCellChange(row.id, "name", event.target.value)
                          }
                          className="h-full min-h-[42px] w-full rounded-none border-0 bg-transparent px-3 py-2 text-[13px] outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border border-zinc-200 px-3 py-2 align-top">
                        <label className="flex min-h-[42px] items-center gap-2 text-[13px] text-zinc-700">
                          <input
                            type="checkbox"
                            checked={row.visible}
                            onChange={(event) =>
                              onVisibleChange(row.id, event.target.checked)
                            }
                          />
                          <span>{row.visible ? "Visible" : "Hidden"}</span>
                        </label>
                      </td>
                      <td className="border border-zinc-200 px-3 py-2 font-mono text-[11px] align-top whitespace-nowrap text-zinc-600">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="border border-zinc-200 p-0 align-top min-w-[260px] focus-within:outline focus-within:outline-2 focus-within:outline-indigo-400 focus-within:outline-offset-[-2px] focus-within:z-20">
                        {isDescriptionExpanded ? (
                          <textarea
                            value={row.description}
                            onChange={(event) =>
                              onCellChange(row.id, "description", event.target.value)
                            }
                            onBlur={() =>
                              setExpandedDescriptionRowId((current) =>
                                current === row.id ? null : current,
                              )
                            }
                            autoFocus
                            rows={4}
                            className="h-full min-h-[112px] w-full rounded-none border-0 bg-white px-3 py-2 text-[13px] resize-y outline-none"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setExpandedDescriptionRowId(row.id)}
                            onFocus={() => setExpandedDescriptionRowId(row.id)}
                            className="h-full min-h-[42px] w-full bg-transparent px-3 py-2 text-left text-[13px] outline-none hover:bg-zinc-50 focus:bg-white"
                            title={row.description}
                          >
                            <span className="block truncate">
                              {row.description || "-"}
                            </span>
                          </button>
                        )}
                      </td>
                      <td className="border border-zinc-200 p-0 align-top min-w-[130px] focus-within:outline focus-within:outline-2 focus-within:outline-indigo-400 focus-within:outline-offset-[-2px] focus-within:z-20">
                        <input
                          value={formatCurrencyDigitsInput(row.price)}
                          onChange={(event) =>
                            onCellChange(
                              row.id,
                              "price",
                              normalizeCurrencyDigitsInput(event.target.value),
                            )
                          }
                          inputMode="numeric"
                          className="h-full min-h-[42px] w-full rounded-none border-0 bg-transparent px-3 py-2 text-[13px] outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border border-zinc-200 p-0 align-top min-w-[150px] focus-within:outline focus-within:outline-2 focus-within:outline-indigo-400 focus-within:outline-offset-[-2px] focus-within:z-20">
                        <input
                          value={formatCurrencyDigitsInput(row.comparedAtPrice)}
                          onChange={(event) =>
                            onCellChange(
                              row.id,
                              "comparedAtPrice",
                              normalizeCurrencyDigitsInput(event.target.value),
                            )
                          }
                          inputMode="numeric"
                          className="h-full min-h-[42px] w-full rounded-none border-0 bg-transparent px-3 py-2 text-[13px] outline-none focus:bg-white"
                        />
                      </td>
                      <td className="border border-zinc-200 p-0 align-top min-w-[220px] focus-within:outline focus-within:outline-2 focus-within:outline-indigo-400 focus-within:outline-offset-[-2px] focus-within:z-20">
                        <select
                          value={row.categoryId}
                          onChange={(event) =>
                            onCellChange(row.id, "categoryId", event.target.value)
                          }
                          className="h-full min-h-[42px] w-full rounded-none border-0 bg-transparent px-3 py-2 text-[13px] outline-none focus:bg-white"
                        >
                          <option value="">No category</option>
                          {lookup.categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.id} - {renderLookupLabel(category)}
                            </option>
                          ))}
                        </select>
                      </td>
                      {(
                        [
                          "photoIdsText",
                          "modifierGroupIdsText",
                          "preparationStepIdsText",
                        ] as RelationField[]
                      ).map((relationField) => {
                        const isOpen =
                          openRelationEditor?.rowId === row.id &&
                          openRelationEditor.field === relationField;

                        return (
                          <td
                            key={`${row.id}:${relationField}`}
                            className="border border-zinc-200 p-1.5 align-top min-w-[280px] focus-within:outline focus-within:outline-2 focus-within:outline-indigo-400 focus-within:outline-offset-[-2px] focus-within:z-20"
                          >
                            <div className="flex flex-col">
                              <Button
                                type="button"
                                size="sm"
                                variant={isOpen ? "primary" : "outline"}
                                onClick={() =>
                                  setOpenRelationEditor((current) =>
                                    current &&
                                    current.rowId === row.id &&
                                    current.field === relationField
                                      ? null
                                      : {
                                          rowId: row.id,
                                          field: relationField,
                                        },
                                  )
                                }
                              >
                                {isOpen ? "Close Sub Table" : "Open Sub Table"}
                              </Button>
                            </div>
                          </td>
                        );
                      })}
                      <td className="border border-zinc-200 p-1.5 align-top min-w-[340px] focus-within:outline focus-within:outline-2 focus-within:outline-indigo-400 focus-within:outline-offset-[-2px] focus-within:z-20">
                        <div className="flex flex-col">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openTranslationsEditor(row)}
                          >
                            Open JSON Editor
                          </Button>
                        </div>
                      </td>
                      <td className="border border-zinc-200 p-1.5 align-top min-w-[170px] focus-within:outline focus-within:outline-2 focus-within:outline-indigo-400 focus-within:outline-offset-[-2px] focus-within:z-20">
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant={dirty ? "primary" : "outline"}
                            disabled={saving || !dirty}
                            onClick={() => void saveRow(row.id)}
                          >
                            {saving ? "Saving..." : "Save Row"}
                          </Button>
                          {row.statusMessage && (
                            <span className="text-[11px] text-green-700">
                              {row.statusMessage}
                            </span>
                          )}
                          {row.errorMessage && (
                            <span className="text-[11px] text-red-700">
                              {row.errorMessage}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {openFieldForRow && (
                      <tr className="bg-[#f7f8fc]">
                        <td
                          colSpan={12}
                          className="border border-zinc-200 p-0 align-top"
                        >
                          <div className="border border-zinc-200 bg-white flex flex-col">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 bg-zinc-100/90">
                              <span className="text-xs font-semibold text-zinc-700">
                                {openFieldLabel} Sub Table
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setOpenRelationEditor(null)}
                              >
                                Close
                              </Button>
                            </div>

                            <div className="grid lg:grid-cols-[1fr_320px]">
                              <div className="border-r border-zinc-200 overflow-auto">
                                <table className="min-w-full border-collapse text-xs">
                                  <thead className="bg-zinc-100/90">
                                    <tr>
                                      <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600 w-12">
                                        #
                                      </th>
                                      {openFieldForRow === "preparationStepIdsText" ? (
                                        <>
                                          <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                                            Station
                                          </th>
                                          <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                                            Label
                                          </th>
                                          <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                                            Include Comments
                                          </th>
                                          <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                                            Include Modifiers
                                          </th>
                                        </>
                                      ) : openFieldForRow === "photoIdsText" ? (
                                        <>
                                          <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                                            Image URL
                                          </th>
                                          <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                                            Preview
                                          </th>
                                        </>
                                      ) : (
                                        <>
                                          <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                                            Relation ID
                                          </th>
                                          <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600">
                                            Label
                                          </th>
                                        </>
                                      )}
                                      <th className="border border-zinc-200 px-3 py-3 text-left text-[13px] font-semibold text-zinc-600 w-20">
                                        Action
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {openFieldIds.length === 0 ? (
                                      <tr>
                                        <td
                                          colSpan={
                                            openFieldForRow === "preparationStepIdsText"
                                              ? 6
                                              : openFieldForRow === "photoIdsText"
                                                ? 4
                                              : 4
                                          }
                                          className="border border-zinc-200 px-3 py-2 text-zinc-500"
                                        >
                                          {openFieldForRow === "photoIdsText"
                                            ? "No images"
                                            : "No relation IDs"}
                                        </td>
                                      </tr>
                                    ) : (
                                      openFieldIds.map((relationId, index) => {
                                        const relationLabel =
                                          lookupLabelById.get(relationId) || "-";
                                        const stepDraft =
                                          openFieldForRow === "preparationStepIdsText"
                                            ? getPreparationStepDraft(relationId)
                                            : undefined;
                                        const canSavePreparationStep = Boolean(
                                          stepDraft?.name.trim() &&
                                            stepDraft?.stationId.trim(),
                                        );

                                        return (
                                          <tr key={`${row.id}:${openFieldForRow}:${index}`}>
                                            <td className="border border-zinc-200 px-3 py-2 font-mono text-[11px] text-zinc-600">
                                              {index + 1}
                                            </td>
                                            {openFieldForRow ===
                                            "preparationStepIdsText" ? (
                                              <>
                                                <td className="border border-zinc-200 p-0 align-top focus-within:outline focus-within:outline-2 focus-within:outline-indigo-400 focus-within:outline-offset-[-2px] focus-within:z-20">
                                                  <select
                                                    value={stepDraft?.stationId || ""}
                                                    onChange={(event) =>
                                                      updatePreparationStepDraft(relationId, {
                                                        stationId: event.target.value,
                                                      })
                                                    }
                                                    className="h-full min-h-[40px] w-full rounded-none border-0 bg-transparent px-3 py-2 text-[13px] outline-none focus:bg-white"
                                                  >
                                                    <option value="">Select station</option>
                                                    {availableStationOptions.map(
                                                      (stationOption) => (
                                                        <option
                                                          key={stationOption.id}
                                                          value={stationOption.id}
                                                        >
                                                          {stationOption.name}
                                                        </option>
                                                      ),
                                                    )}
                                                  </select>
                                                </td>
                                                <td className="border border-zinc-200 p-0 align-top focus-within:outline focus-within:outline-2 focus-within:outline-indigo-400 focus-within:outline-offset-[-2px] focus-within:z-20">
                                                  <input
                                                    value={stepDraft?.name || ""}
                                                    onChange={(event) =>
                                                      updatePreparationStepDraft(relationId, {
                                                        name: event.target.value,
                                                      })
                                                    }
                                                    className="h-full min-h-[40px] w-full rounded-none border-0 bg-transparent px-3 py-2 text-[13px] outline-none focus:bg-white"
                                                  />
                                                </td>
                                                <td className="border border-zinc-200 px-3 py-2">
                                                  <label className="flex items-center justify-center">
                                                    <input
                                                      type="checkbox"
                                                      checked={Boolean(
                                                        stepDraft?.includeComments,
                                                      )}
                                                      onChange={(event) =>
                                                        updatePreparationStepDraft(relationId, {
                                                          includeComments:
                                                            event.target.checked,
                                                        })
                                                      }
                                                    />
                                                  </label>
                                                </td>
                                                <td className="border border-zinc-200 px-3 py-2">
                                                  <label className="flex items-center justify-center">
                                                    <input
                                                      type="checkbox"
                                                      checked={Boolean(
                                                        stepDraft?.includeModifiers,
                                                      )}
                                                      onChange={(event) =>
                                                        updatePreparationStepDraft(relationId, {
                                                          includeModifiers:
                                                            event.target.checked,
                                                        })
                                                      }
                                                    />
                                                  </label>
                                                </td>
                                              </>
                                            ) : openFieldForRow ===
                                              "photoIdsText" ? (
                                              <>
                                                <td className="border border-zinc-200 p-0 align-top focus-within:outline focus-within:outline-2 focus-within:outline-indigo-400 focus-within:outline-offset-[-2px] focus-within:z-20">
                                                  <input
                                                    value={relationId}
                                                    onChange={(event) => {
                                                      const nextIds = [...openFieldIds];
                                                      nextIds[index] = event.target.value;
                                                      setRelationIds(
                                                        row.id,
                                                        openFieldForRow,
                                                        nextIds,
                                                      );
                                                    }}
                                                    className="h-full min-h-[40px] w-full rounded-none border-0 bg-transparent px-3 py-2 text-[13px] outline-none focus:bg-white"
                                                    placeholder="https://example.com/image.jpg"
                                                  />
                                                </td>
                                                <td className="border border-zinc-200 px-3 py-2">
                                                  {isValidHttpUrl(relationId) ? (
                                                    <div
                                                      className="h-12 w-12 rounded border border-zinc-200 bg-zinc-100 bg-cover bg-center"
                                                      style={{
                                                        backgroundImage: `url(${relationId})`,
                                                      }}
                                                    />
                                                  ) : (
                                                    <span className="text-zinc-400">-</span>
                                                  )}
                                                </td>
                                              </>
                                            ) : (
                                              <>
                                                <td className="border border-zinc-200 p-0 align-top focus-within:outline focus-within:outline-2 focus-within:outline-indigo-400 focus-within:outline-offset-[-2px] focus-within:z-20">
                                                  <input
                                                    value={relationId}
                                                    onChange={(event) => {
                                                      const nextIds = [...openFieldIds];
                                                      nextIds[index] = event.target.value;
                                                      setRelationIds(
                                                        row.id,
                                                        openFieldForRow,
                                                        nextIds,
                                                      );
                                                    }}
                                                    className="h-full min-h-[40px] w-full rounded-none border-0 bg-transparent px-3 py-2 text-[13px] font-mono outline-none focus:bg-white"
                                                  />
                                                </td>
                                                <td className="border border-zinc-200 px-3 py-2 text-zinc-600">
                                                  {relationLabel}
                                                </td>
                                              </>
                                            )}
                                            <td className="border border-zinc-200 px-2 py-1 align-top">
                                              <div className="flex gap-1">
                                                {openFieldForRow ===
                                                  "preparationStepIdsText" && (
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={
                                                      savingPreparationStepId === relationId ||
                                                      !canSavePreparationStep
                                                    }
                                                    onClick={() =>
                                                      void savePreparationStepDraft(
                                                        relationId,
                                                      )
                                                    }
                                                  >
                                                    {savingPreparationStepId === relationId
                                                      ? "Saving..."
                                                      : "Save Step"}
                                                  </Button>
                                                )}
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => {
                                                    const nextIds = openFieldIds.filter(
                                                      (_, currentIndex) =>
                                                        currentIndex !== index,
                                                    );
                                                    setRelationIds(
                                                      row.id,
                                                      openFieldForRow,
                                                      nextIds,
                                                    );
                                                  }}
                                                >
                                                  Detach
                                                </Button>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              <div className="p-2 flex flex-col gap-2 bg-white">
                                <span className="text-[13px] font-semibold text-zinc-700 px-1">
                                  {openFieldForRow === "photoIdsText"
                                    ? "Add Image"
                                    : "Add Relation"}
                                </span>
                                {openFieldForRow === "preparationStepIdsText" ? (
                                  <>
                                    <select
                                      value=""
                                      onChange={(event) => {
                                        const nextId = event.target.value;
                                        if (!nextId) return;

                                        setRelationIds(row.id, openFieldForRow, [
                                          ...openFieldIds,
                                          nextId,
                                        ]);
                                      }}
                                      className="h-[40px] w-full rounded-md border border-zinc-300 bg-white px-3 text-[13px] outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                      <option value="">Select existing preparation step</option>
                                      {attachableLookupOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                          {renderPreparationStepLabel(option)}
                                        </option>
                                      ))}
                                    </select>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newPreparationStepId = createUuid();
                                        const fallbackStationId =
                                          availableStationOptions[0]?.id || "";

                                        setRelationIds(row.id, openFieldForRow, [
                                          ...openFieldIds,
                                          newPreparationStepId,
                                        ]);
                                        updatePreparationStepDraft(newPreparationStepId, {
                                          name: "",
                                          stationId: fallbackStationId,
                                          includeComments: false,
                                          includeModifiers: false,
                                        });
                                      }}
                                    >
                                      Add New Row
                                    </Button>
                                  </>
                                ) : openFieldForRow === "photoIdsText" ? (
                                  <>
                                    <select
                                      value={pickerValue}
                                      onChange={(event) =>
                                        setRelationPickerByKey((current) => ({
                                          ...current,
                                          [pickerKey]: event.target.value,
                                        }))
                                      }
                                      className="h-[40px] w-full rounded-md border border-zinc-300 bg-white px-3 text-[13px] outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                      <option value="">Select existing image</option>
                                      {attachableLookupOptions
                                        .filter((option) => Boolean(option.url))
                                        .map((option) => (
                                          <option
                                            key={option.id}
                                            value={option.url || ""}
                                          >
                                            {renderLookupLabel(option)}
                                          </option>
                                        ))}
                                    </select>
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={!pickerValue}
                                      onClick={() => {
                                        if (!pickerValue) return;

                                        setRelationIds(row.id, openFieldForRow, [
                                          ...openFieldIds,
                                          pickerValue.trim(),
                                        ]);
                                        setRelationPickerByKey((current) => ({
                                          ...current,
                                          [pickerKey]: "",
                                        }));
                                      }}
                                    >
                                      Add Selected Image
                                    </Button>
                                    <div className="h-px bg-zinc-200 my-1" />
                                    <input
                                      value={photoUrlInputValue}
                                      onChange={(event) =>
                                        setPhotoUrlInputByKey((current) => ({
                                          ...current,
                                          [pickerKey]: event.target.value,
                                        }))
                                      }
                                      placeholder="https://example.com/new-image.jpg"
                                      className="h-[40px] w-full rounded-md border border-zinc-300 bg-white px-3 text-[13px] outline-none focus:ring-2 focus:ring-indigo-200"
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={!canAddPhotoUrl}
                                      onClick={() => {
                                        const normalizedUrl = photoUrlInputValue.trim();
                                        if (!isValidHttpUrl(normalizedUrl)) return;

                                        setRelationIds(row.id, openFieldForRow, [
                                          ...openFieldIds,
                                          normalizedUrl,
                                        ]);
                                        setPhotoUrlInputByKey((current) => ({
                                          ...current,
                                          [pickerKey]: "",
                                        }));
                                      }}
                                    >
                                      Create And Attach Image
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <select
                                      value={pickerValue}
                                      onChange={(event) =>
                                        setRelationPickerByKey((current) => ({
                                          ...current,
                                          [pickerKey]: event.target.value,
                                        }))
                                      }
                                      className="h-[40px] w-full rounded-md border border-zinc-300 bg-white px-3 text-[13px] outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                      <option value="">Select an existing ID</option>
                                      {attachableLookupOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                          {renderLookupLabel(option)}
                                        </option>
                                      ))}
                                    </select>
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={!pickerValue}
                                      onClick={() => {
                                        if (!pickerValue) return;

                                        setRelationIds(row.id, openFieldForRow, [
                                          ...openFieldIds,
                                          pickerValue,
                                        ]);
                                        setRelationPickerByKey((current) => ({
                                          ...current,
                                          [pickerKey]: "",
                                        }));
                                      }}
                                    >
                                      Add Selected ID
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const newRelationId = createUuid();

                                        setRelationIds(row.id, openFieldForRow, [
                                          ...openFieldIds,
                                          newRelationId,
                                        ]);
                                      }}
                                    >
                                      Add Empty Row
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>

      </div>

      {openTranslationsEditorRow && (
        <div className="fixed inset-0 z-[100] bg-black/40 p-4">
          <div className="mx-auto w-full max-w-5xl h-[85dvh] rounded-xl bg-white border border-zinc-200 shadow-xl flex flex-col">
            <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-zinc-800">
                  Translations JSON Editor
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Product: {openTranslationsEditorRow.id}
                </span>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={closeTranslationsEditor}>
                Close
              </Button>
            </div>

            <div className="p-4 flex-1 overflow-auto flex flex-col gap-3">
              {translationsEditorError && (
                <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {translationsEditorError}
                </div>
              )}

              <div className="rounded border border-zinc-200 overflow-auto">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="bg-zinc-100">
                    <tr>
                      <th className="border border-zinc-200 px-2 py-1 text-left w-12">
                        #
                      </th>
                      <th className="border border-zinc-200 px-2 py-1 text-left w-40">
                        language
                      </th>
                      <th className="border border-zinc-200 px-2 py-1 text-left w-56">
                        property
                      </th>
                      <th className="border border-zinc-200 px-2 py-1 text-left">
                        value
                      </th>
                      <th className="border border-zinc-200 px-2 py-1 text-left w-24">
                        action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {translationsEditorEntries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="border border-zinc-200 px-2 py-3 text-zinc-500"
                        >
                          No rows yet
                        </td>
                      </tr>
                    ) : (
                      translationsEditorEntries.map((entry, index) => (
                        <tr key={entry.id}>
                          <td className="border border-zinc-200 px-2 py-1 font-mono">
                            {index + 1}
                          </td>
                          <td className="border border-zinc-200 px-2 py-1">
                            <input
                              value={entry.language}
                              onChange={(event) =>
                                setTranslationsEditorEntries((current) =>
                                  current.map((item) =>
                                    item.id === entry.id
                                      ? { ...item, language: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                              placeholder="en"
                              className="w-full rounded border border-zinc-300 px-2 py-1 font-mono"
                            />
                          </td>
                          <td className="border border-zinc-200 px-2 py-1">
                            <input
                              value={entry.key}
                              onChange={(event) =>
                                setTranslationsEditorEntries((current) =>
                                  current.map((item) =>
                                    item.id === entry.id
                                      ? { ...item, key: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                              placeholder="title"
                              className="w-full rounded border border-zinc-300 px-2 py-1 font-mono"
                            />
                          </td>
                          <td className="border border-zinc-200 px-2 py-1">
                            <input
                              value={entry.value}
                              onChange={(event) =>
                                setTranslationsEditorEntries((current) =>
                                  current.map((item) =>
                                    item.id === entry.id
                                      ? { ...item, value: event.target.value }
                                      : item,
                                  ),
                                )
                              }
                              className="w-full rounded border border-zinc-300 px-2 py-1"
                            />
                          </td>
                          <td className="border border-zinc-200 px-2 py-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setTranslationsEditorEntries((current) =>
                                  current.filter((item) => item.id !== entry.id),
                                )
                              }
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-zinc-200 flex items-center justify-between">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setTranslationsEditorEntries((current) => [
                    ...current,
                    {
                      id: createEditorEntryId(),
                      language: "en",
                      key: "title",
                      value: "",
                    },
                  ])
                }
              >
                Add Property Row
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={closeTranslationsEditor}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const nextTranslationsText =
                      buildTranslationsTextFromEditorEntries(
                        translationsEditorEntries,
                      );
                    onCellChange(
                      openTranslationsEditorRow.id,
                      "translationsText",
                      nextTranslationsText,
                    );
                    closeTranslationsEditor();
                  }}
                >
                  Apply JSON
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
