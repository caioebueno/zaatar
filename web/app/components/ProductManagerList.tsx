"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ProductManagerCategory,
  ProductManagerModifierGroup,
  ProductManagerModifierGroupItem,
  ProductManagerProduct,
  ProductManagerTranslations,
} from "@/src/getProductsManagerList";

type Props = {
  initialCategories: ProductManagerCategory[];
  initialUncategorized: ProductManagerProduct[];
  initialLookupModifierGroups: ProductManagerModifierGroup[];
};

type CategoryView = {
  id: string;
  title: string;
  products: ProductManagerProduct[];
};

type DragProductState = {
  productId: string;
  sourceCategoryId: string | null;
};

type DrawerLanguage = "es" | "pt";
type ProductEditorMode = "create" | "edit";

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
  activeLanguage: DrawerLanguage;
  saving: boolean;
  error: string | null;
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

export default function ProductManagerList({
  initialCategories,
  initialUncategorized,
  initialLookupModifierGroups,
}: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [uncategorized, setUncategorized] = useState(initialUncategorized);
  const [lookupModifierGroups, setLookupModifierGroups] = useState(
    initialLookupModifierGroups,
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [dragProduct, setDragProduct] = useState<DragProductState | null>(null);
  const [persistingReorder, setPersistingReorder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<ProductEditorState | null>(null);

  const categoryViews = useMemo<CategoryView[]>(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const source: CategoryView[] = [
      ...categories.map((category) => ({
        id: category.id,
        title: category.title,
        products: category.products,
      })),
      ...(uncategorized.length > 0
        ? [
            {
              id: "__uncategorized__",
              title: "Uncategorized",
              products: uncategorized,
            },
          ]
        : []),
    ];

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
  }, [categories, uncategorized, search]);

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
          const response = await fetch(
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

  function openEditor(product: ProductManagerProduct) {
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
      activeLanguage: "es",
      saving: false,
      error: null,
    });
  }

  function openCreateEditor() {
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
      activeLanguage: "es",
      saving: false,
      error: null,
    });
  }

  function closeEditor() {
    setEditor((current) => {
      if (current?.saving) return current;
      return null;
    });
  }

  async function toggleVisibility(productId: string, currentVisible: boolean) {
    const nextVisible = !currentVisible;
    setError(null);
    setSavingProductId(productId);
    setProductVisibility(productId, nextVisible);

    try {
      const response = await fetch(`/api/products/${productId}`, {
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

  function removePhotoUrl(urlToRemove: string) {
    setEditor((current) => {
      if (!current) return current;

      return {
        ...current,
        photoUrls: current.photoUrls.filter((urlValue) => urlValue !== urlToRemove),
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
      const response = await fetch("/api/modifier-groups", {
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
      const response = await fetch(
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
      const response = await fetch(
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
      const response = await fetch("/api/modifier-group-items", {
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
      const response = await fetch(
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
      const response = await fetch(
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

      const body = {
        name: normalizedName,
        description: editor.description.trim() || null,
        categoryId: editor.categoryId.trim() || null,
        categoryIndex: editor.categoryIndex,
        visible: editor.visible,
        price,
        comparedAtPrice,
        translations:
          Object.keys(translationsPayload).length > 0 ? translationsPayload : null,
        photoUrls: editor.photoUrls,
        modifierGroupIds: editor.modifierGroups.map((modifierGroup) => modifierGroup.id),
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

      const response = await fetch(
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
        categoryId?: unknown;
        categoryIndex?: unknown;
        translations?: unknown;
        photos?: unknown;
        modifierGroups?: unknown;
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

      const updatedProduct: ProductManagerProduct = {
        id: persistedId,
        createdAt:
          typeof payload.createdAt === "string"
            ? payload.createdAt
            : editor.createdAt,
        name: typeof payload.name === "string" ? payload.name : normalizedName,
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
        modifierGroups: Array.isArray(payload.modifierGroups)
          ? payload.modifierGroups
              .map(mapModifierGroupFromUnknown)
              .filter(
                (modifierGroup): modifierGroup is ProductManagerModifierGroup =>
                  modifierGroup !== null,
              )
          : editor.modifierGroups.map(cloneModifierGroup),
      };

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
  return (
    <>
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
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2 md:w-[280px]"
              />
              <button
                type="button"
                onClick={openCreateEditor}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
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

          <div className="space-y-4">
            {categoryViews.map((category) => {
              const isCollapsed = collapsed[category.id] === true;
              const productCount = category.products.length;
              const categoryId =
                category.id === "__uncategorized__" ? null : category.id;

              return (
                <section
                  key={category.id}
                  className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                >
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
                          {category.products.map((product) => (
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
                                  <span className="text-sm font-semibold text-zinc-900">
                                    {product.name}
                                  </span>
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
                                    onClick={(event) => event.stopPropagation()}
                                    className="cursor-grab rounded-md border border-transparent p-1.5 text-zinc-400 hover:bg-zinc-100 active:cursor-grabbing"
                                    aria-label="Drag product"
                                  >
                                    <DotsHandle />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}

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
              );
            })}

            {categoryViews.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500">
                No products found for your search.
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {editor ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close product editor"
            onClick={closeEditor}
            className="absolute inset-0 bg-zinc-900/30"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col border-l border-zinc-200 bg-white shadow-2xl">
            <header className="border-b border-zinc-200 px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-900">
                    {editor.mode === "create" ? "Create Product" : "Edit Product"}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    {editor.mode === "create" ? "New product" : editor.name || "Product"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-zinc-500 hover:bg-zinc-100"
                  aria-label="Close"
                >
                  x
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto">
              <section className="border-b border-zinc-200 px-6 py-5">
                <SectionTitle>Basic Info</SectionTitle>

                <div className="space-y-3">
                  <div>
                    <InputLabel>Product name</InputLabel>
                    <input
                      value={editor.name}
                      onChange={(event) => updateEditorField("name", event.target.value)}
                      placeholder="e.g. Shawarma Wrap"
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                    />
                  </div>

                  <div>
                    <InputLabel>Description</InputLabel>
                    <textarea
                      value={editor.description}
                      onChange={(event) =>
                        updateEditorField("description", event.target.value)
                      }
                      placeholder="Short product description..."
                      rows={3}
                      className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                    />
                  </div>

                  <div>
                    <InputLabel>Category</InputLabel>
                    <select
                      value={editor.categoryId}
                      onChange={(event) =>
                        updateEditorField("categoryId", event.target.value)
                      }
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <InputLabel>Product index</InputLabel>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={editor.categoryIndex ?? ""}
                      onChange={(event) => {
                        if (event.target.value === "") {
                          updateEditorField("categoryIndex", null);
                          return;
                        }

                        const parsedValue = Number.parseInt(
                          event.target.value,
                          10,
                        );

                        updateEditorField(
                          "categoryIndex",
                          Number.isNaN(parsedValue) ? null : parsedValue,
                        );
                      }}
                      placeholder="e.g. 1"
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Active</p>
                      <p className="text-xs text-zinc-500">Visible to customers</p>
                    </div>
                    <Toggle
                      checked={editor.visible}
                      disabled={editor.saving}
                      onChange={() => updateEditorField("visible", !editor.visible)}
                    />
                  </div>
                </div>
              </section>

              <section className="border-b border-zinc-200 px-6 py-5">
                <SectionTitle>Translations</SectionTitle>

                <div className="mb-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateEditorField("activeLanguage", "es")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      editor.activeLanguage === "es"
                        ? "bg-violet-100 text-violet-700"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    Spanish (ES)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateEditorField("activeLanguage", "pt")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      editor.activeLanguage === "pt"
                        ? "bg-violet-100 text-violet-700"
                        : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    Portuguese (PT)
                  </button>
                </div>

                {editor.activeLanguage === "es" ? (
                  <div className="space-y-3">
                    <div>
                      <InputLabel>Name (ES)</InputLabel>
                      <input
                        value={editor.esName}
                        onChange={(event) =>
                          updateEditorField("esName", event.target.value)
                        }
                        placeholder="Nombre del producto..."
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                      />
                    </div>
                    <div>
                      <InputLabel>Description (ES)</InputLabel>
                      <textarea
                        value={editor.esDescription}
                        onChange={(event) =>
                          updateEditorField("esDescription", event.target.value)
                        }
                        placeholder="Descripcion en espanol..."
                        rows={3}
                        className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <InputLabel>Name (PT)</InputLabel>
                      <input
                        value={editor.ptName}
                        onChange={(event) =>
                          updateEditorField("ptName", event.target.value)
                        }
                        placeholder="Nome do produto..."
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                      />
                    </div>
                    <div>
                      <InputLabel>Description (PT)</InputLabel>
                      <textarea
                        value={editor.ptDescription}
                        onChange={(event) =>
                          updateEditorField("ptDescription", event.target.value)
                        }
                        placeholder="Descricao em portugues..."
                        rows={3}
                        className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                      />
                    </div>
                  </div>
                )}

                <p className="mt-2 text-xs text-zinc-400">
                  Optional - falls back to default language if empty
                </p>
              </section>

              <section className="border-b border-zinc-200 px-6 py-5">
                <SectionTitle>Pricing</SectionTitle>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <InputLabel>Price</InputLabel>
                    <input
                      value={editor.priceInput}
                      onChange={(event) =>
                        updateEditorField("priceInput", event.target.value)
                      }
                      placeholder="12.00"
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                    />
                  </div>
                  <div>
                    <InputLabel>Compared at price</InputLabel>
                    <input
                      value={editor.comparedAtPriceInput}
                      onChange={(event) =>
                        updateEditorField("comparedAtPriceInput", event.target.value)
                      }
                      placeholder="14.00"
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                    />
                  </div>
                </div>

                <p className="mt-2 text-xs text-zinc-400">
                  Compared price displays as strikethrough discount
                </p>
              </section>

              <section className="border-b border-zinc-200 px-6 py-5">
                <SectionTitle>Modifier Groups</SectionTitle>

                <div className="mb-4 flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-500">
                    Attach existing group
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={editor.modifierLookupIdToAttach}
                      onChange={(event) =>
                        updateEditorField("modifierLookupIdToAttach", event.target.value)
                      }
                      className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                    >
                      <option value="">Select a modifier group</option>
                      {lookupModifierGroups.map((modifierGroup) => (
                        <option key={modifierGroup.id} value={modifierGroup.id}>
                          {modifierGroup.title}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={attachExistingModifierGroup}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      Attach
                    </button>
                  </div>
                </div>

                <div className="mb-4 flex flex-col gap-2">
                  <label className="text-xs font-medium text-zinc-500">
                    Create new group
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={editor.newModifierGroupTitle}
                      onChange={(event) =>
                        updateEditorField("newModifierGroupTitle", event.target.value)
                      }
                      placeholder="e.g. Sauces"
                      className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                    />
                    <button
                      type="button"
                      onClick={() => void createModifierGroup()}
                      disabled={editor.creatingModifierGroup}
                      className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
                    >
                      {editor.creatingModifierGroup ? "Creating..." : "Create"}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {editor.modifierGroups.map((modifierGroup) => (
                    <div
                      key={modifierGroup.id}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                    >
                      <div className="mb-3 grid grid-cols-2 gap-2">
                        <input
                          value={modifierGroup.title}
                          onChange={(event) =>
                            updateModifierGroupDraft(modifierGroup.id, {
                              title: event.target.value,
                            })
                          }
                          placeholder="Group title"
                          className="col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                        />
                        <input
                          value={readTranslationField(
                            modifierGroup.translations,
                            "es",
                            "title",
                          )}
                          onChange={(event) =>
                            updateModifierGroupTranslationDraft(
                              modifierGroup.id,
                              "es",
                              event.target.value,
                            )
                          }
                          placeholder="Group title (ES)"
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                        />
                        <input
                          value={readTranslationField(
                            modifierGroup.translations,
                            "pt",
                            "title",
                          )}
                          onChange={(event) =>
                            updateModifierGroupTranslationDraft(
                              modifierGroup.id,
                              "pt",
                              event.target.value,
                            )
                          }
                          placeholder="Group title (PT-BR)"
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                        />
                        <select
                          value={modifierGroup.type ?? ""}
                          onChange={(event) =>
                            updateModifierGroupDraft(modifierGroup.id, {
                              type: parseModifierGroupType(event.target.value),
                            })
                          }
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                        >
                          <option value="">No type</option>
                          <option value="SINGLE">Single</option>
                          <option value="MULTI">Multi</option>
                        </select>
                        <label className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
                          <input
                            type="checkbox"
                            checked={modifierGroup.required}
                            onChange={(event) =>
                              updateModifierGroupDraft(modifierGroup.id, {
                                required: event.target.checked,
                              })
                            }
                          />
                          Required
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={modifierGroup.minSelection ?? ""}
                          onChange={(event) =>
                            updateModifierGroupDraft(modifierGroup.id, {
                              minSelection: event.target.value
                                ? Number(event.target.value)
                                : null,
                            })
                          }
                          placeholder="Min selection"
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                        />
                        <input
                          type="number"
                          min={0}
                          value={modifierGroup.maxSelection ?? ""}
                          onChange={(event) =>
                            updateModifierGroupDraft(modifierGroup.id, {
                              maxSelection: event.target.value
                                ? Number(event.target.value)
                                : null,
                            })
                          }
                          placeholder="Max selection"
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                        />
                      </div>

                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void saveModifierGroup(modifierGroup.id)}
                          disabled={editor.savingModifierGroupId === modifierGroup.id}
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                        >
                          {editor.savingModifierGroupId === modifierGroup.id
                            ? "Saving..."
                            : "Save group"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeModifierGroupFromProduct(modifierGroup.id)}
                          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                        >
                          Remove from product
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteModifierGroup(modifierGroup.id)}
                          disabled={editor.deletingModifierGroupId === modifierGroup.id}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          {editor.deletingModifierGroupId === modifierGroup.id
                            ? "Deleting..."
                            : "Delete group"}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {modifierGroup.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-zinc-200 bg-white p-2"
                          >
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                value={item.name}
                                onChange={(event) =>
                                  updateModifierItemDraft(modifierGroup.id, item.id, {
                                    name: event.target.value,
                                  })
                                }
                                placeholder="Modifier item name"
                                className="col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                              />
                              <textarea
                                value={item.description ?? ""}
                                onChange={(event) =>
                                  updateModifierItemDraft(modifierGroup.id, item.id, {
                                    description: event.target.value || null,
                                  })
                                }
                                rows={2}
                                placeholder="Description"
                                className="col-span-2 resize-none rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                              />
                              <input
                                value={readTranslationField(
                                  item.translations,
                                  "es",
                                  "name",
                                )}
                                onChange={(event) =>
                                  updateModifierItemTranslationDraft(
                                    modifierGroup.id,
                                    item.id,
                                    "es",
                                    "name",
                                    event.target.value,
                                  )
                                }
                                placeholder="Name (ES)"
                                className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                              />
                              <input
                                value={readTranslationField(
                                  item.translations,
                                  "pt",
                                  "name",
                                )}
                                onChange={(event) =>
                                  updateModifierItemTranslationDraft(
                                    modifierGroup.id,
                                    item.id,
                                    "pt",
                                    "name",
                                    event.target.value,
                                  )
                                }
                                placeholder="Name (PT-BR)"
                                className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                              />
                              <textarea
                                value={readTranslationField(
                                  item.translations,
                                  "es",
                                  "description",
                                )}
                                onChange={(event) =>
                                  updateModifierItemTranslationDraft(
                                    modifierGroup.id,
                                    item.id,
                                    "es",
                                    "description",
                                    event.target.value,
                                  )
                                }
                                rows={2}
                                placeholder="Description (ES)"
                                className="col-span-2 resize-none rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                              />
                              <textarea
                                value={readTranslationField(
                                  item.translations,
                                  "pt",
                                  "description",
                                )}
                                onChange={(event) =>
                                  updateModifierItemTranslationDraft(
                                    modifierGroup.id,
                                    item.id,
                                    "pt",
                                    "description",
                                    event.target.value,
                                  )
                                }
                                rows={2}
                                placeholder="Description (PT-BR)"
                                className="col-span-2 resize-none rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                              />
                              <input
                                type="number"
                                min={0}
                                value={item.price}
                                onChange={(event) =>
                                  updateModifierItemDraft(modifierGroup.id, item.id, {
                                    price: Number(event.target.value || 0),
                                  })
                                }
                                placeholder="Price (cents)"
                                className="rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => void saveModifierItem(modifierGroup.id, item)}
                                  disabled={editor.savingModifierItemId === item.id}
                                  className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                                >
                                  {editor.savingModifierItemId === item.id
                                    ? "Saving..."
                                    : "Save"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void deleteModifierItem(modifierGroup.id, item.id)
                                  }
                                  disabled={editor.deletingModifierItemId === item.id}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                >
                                  {editor.deletingModifierItemId === item.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => void createModifierItem(modifierGroup.id)}
                        disabled={editor.creatingModifierItemGroupId === modifierGroup.id}
                        className="mt-3 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                      >
                        {editor.creatingModifierItemGroupId === modifierGroup.id
                          ? "Adding..."
                          : "Add modifier item"}
                      </button>
                    </div>
                  ))}

                  {editor.modifierGroups.length === 0 ? (
                    <p className="text-xs text-zinc-500">
                      No modifier groups attached to this product yet.
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="px-6 py-5">
                <SectionTitle>Photos</SectionTitle>

                <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-zinc-500">
                  <p className="text-lg">^</p>
                  <p className="text-sm">Click to upload or drag and drop</p>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    value={editor.newPhotoUrl}
                    onChange={(event) =>
                      updateEditorField("newPhotoUrl", event.target.value)
                    }
                    placeholder="https://..."
                    className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={addPhotoUrl}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Add
                  </button>
                </div>

                {editor.photoUrls.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {editor.photoUrls.map((urlValue) => (
                      <div
                        key={urlValue}
                        className="flex items-center gap-2 rounded-lg border border-zinc-200 px-2 py-2"
                      >
                        <div
                          className="h-10 w-10 rounded-md bg-zinc-200 bg-cover bg-center"
                          style={{ backgroundImage: `url("${urlValue}")` }}
                        />
                        <p className="line-clamp-1 flex-1 text-xs text-zinc-500">
                          {urlValue}
                        </p>
                        <button
                          type="button"
                          onClick={() => removePhotoUrl(urlValue)}
                          className="rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            </div>

            <footer className="border-t border-zinc-200 px-6 py-4">
              {editor.error ? (
                <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {editor.error}
                </p>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  disabled={editor.saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void saveEditor()}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={editor.saving}
                >
                  {editor.saving
                    ? "Saving..."
                    : editor.mode === "create"
                      ? "Create product"
                      : "Save changes"}
                </button>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
