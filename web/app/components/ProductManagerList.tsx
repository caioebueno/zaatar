"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  ProductManagerCategory,
  ProductManagerFixedComboProduct,
  ProductManagerComboSlot,
  ProductManagerModifierGroup,
  ProductManagerModifierGroupItem,
  ProductManagerProduct,
  ProductManagerProductItemType,
  ProductManagerTranslations,
} from "@/src/getProductsManagerList";

type Props = {
  initialCategories: ProductManagerCategory[];
  initialUncategorized: ProductManagerProduct[];
  initialLookupModifierGroups: ProductManagerModifierGroup[];
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
type ProductEditorFocusSection = "translations";

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

export default function ProductManagerList({
  initialCategories,
  initialUncategorized,
  initialLookupModifierGroups,
  menus,
  selectedMenuId,
  allSections,
}: Props) {
  const photoFileInputId = "product-photo-upload-input";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  const [switchingMenu, setSwitchingMenu] = useState(false);
  const [creatingMenu, setCreatingMenu] = useState(false);
  const [linkingSection, setLinkingSection] = useState(false);
  const [creatingSection, setCreatingSection] = useState(false);
  const [detachingSectionId, setDetachingSectionId] = useState<string | null>(null);
  const translationsSectionRef = useRef<HTMLElement | null>(null);
  const esTranslationNameInputRef = useRef<HTMLInputElement | null>(null);
  const ptTranslationNameInputRef = useRef<HTMLInputElement | null>(null);

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
    const previewUrl = `/menu/en?menuId=${encodeURIComponent(selectedMenuId)}`;
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
      const response = await fetch(
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

      const response = await fetch("/api/categories", {
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

      const response = await fetch(
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

  async function onCreateMenu() {
    const menuNameInput = window.prompt("New menu name");
    const menuName = menuNameInput?.trim();

    if (!menuName) return;

    try {
      setCreatingMenu(true);
      setError(null);

      const response = await fetch("/api/menus", {
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

      const payload = (await response.json()) as { id?: unknown };
      if (typeof payload.id !== "string" || !payload.id.trim()) {
        throw new Error("Menu created but response is invalid");
      }

      onMenuChange(payload.id.trim());
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create menu",
      );
      setCreatingMenu(false);
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

      const response = await fetch("/api/bucket/upload", {
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
        itemType?: unknown;
        categoryId?: unknown;
        categoryIndex?: unknown;
        translations?: unknown;
        photos?: unknown;
        modifierGroups?: unknown;
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
                {menus.map((menu) => (
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

          <div className="space-y-4">
            {search.trim().length === 0 && categoryViews.length > 0 ? (
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

            {categoryViews.map((category, categoryIndexPosition) => {
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
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-zinc-900">
                                        {product.name}
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

            {categoryViews.length === 0 ? (
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
                  No products found for your search.
                </div>
              )
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

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[720px] flex-col border-l border-zinc-200 bg-white shadow-2xl">
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

                  <div>
                    <InputLabel>Item type</InputLabel>
                    <select
                      value={editor.itemType}
                      onChange={(event) => {
                        const nextItemType =
                          event.target.value === "COMBO" ? "COMBO" : "PRODUCT";
                        setEditor((current) => {
                          if (!current) return current;

                          return {
                            ...current,
                            itemType: nextItemType,
                            comboProducts:
                              nextItemType === "COMBO" ? current.comboProducts : [],
                            comboProductLookupId:
                              nextItemType === "COMBO" ? current.comboProductLookupId : "",
                            comboProductLookupQuantityInput:
                              nextItemType === "COMBO"
                                ? current.comboProductLookupQuantityInput
                                : "1",
                            comboSlots:
                              nextItemType === "COMBO" ? current.comboSlots : [],
                          };
                        });
                      }}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                    >
                      <option value="PRODUCT">Regular product</option>
                      <option value="COMBO">Combo</option>
                    </select>
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

              <section
                ref={translationsSectionRef}
                className="border-b border-zinc-200 px-6 py-5"
              >
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
                        ref={esTranslationNameInputRef}
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
                        ref={ptTranslationNameInputRef}
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

              {editor.itemType === "COMBO" ? (
                <section className="border-b border-zinc-200 px-6 py-5">
                  <SectionTitle>Combo Composition</SectionTitle>

                  <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Fixed products (direct)
                    </p>
                    <div className="grid grid-cols-[1fr_100px_auto] gap-2">
                      <select
                        value={editor.comboProductLookupId}
                        onChange={(event) =>
                          updateEditorField("comboProductLookupId", event.target.value)
                        }
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                      >
                        <option value="">Select product...</option>
                        {productLookupList
                          .filter((product) => product.id !== editor.productId)
                          .map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={editor.comboProductLookupQuantityInput}
                        onChange={(event) =>
                          updateEditorField(
                            "comboProductLookupQuantityInput",
                            event.target.value,
                          )
                        }
                        placeholder="Qty"
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                      />
                      <button
                        type="button"
                        onClick={addDirectComboProduct}
                        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                      >
                        Add
                      </button>
                    </div>

                    <div className="mt-2 space-y-2">
                      {editor.comboProducts.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-[1fr_100px_auto] items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-2"
                        >
                          <p className="text-sm text-zinc-800">
                            {productNameById.get(item.productId) || "Unknown product"}
                          </p>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={item.quantity}
                            onChange={(event) => {
                              const parsedQuantity = Number.parseInt(
                                event.target.value || "0",
                                10,
                              );
                              updateDirectComboProductQuantity(
                                item.id,
                                Number.isNaN(parsedQuantity) ? 0 : parsedQuantity,
                              );
                            }}
                            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                          />
                          <button
                            type="button"
                            onClick={() => removeDirectComboProduct(item.id)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {editor.comboProducts.length === 0 ? (
                        <p className="text-xs text-zinc-500">
                          Attach fixed products for combos with no choice step.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-500">
                      Slot-based choices (use this instead of fixed products).
                    </p>
                    <button
                      type="button"
                      onClick={addComboSlot}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      Add Combo Slot
                    </button>
                  </div>

                  <div className="space-y-3">
                    {editor.comboSlots.map((slot, slotIndex) => (
                      <div
                        key={slot.id}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-zinc-900">
                            Slot {slotIndex + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeComboSlot(slot.id)}
                            className="rounded-md px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                          >
                            Remove slot
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={slot.name}
                            onChange={(event) =>
                              updateComboSlot(slot.id, { name: event.target.value })
                            }
                            placeholder="Slot name (e.g. Choose your pizzas)"
                            className="col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                          />
                          <input
                            value={readTranslationField(
                              slot.translations,
                              "es",
                              "title",
                            )}
                            onChange={(event) =>
                              updateComboSlotTranslation(
                                slot.id,
                                "es",
                                "title",
                                event.target.value,
                              )
                            }
                            placeholder="Slot name (ES)"
                            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                          />
                          <input
                            value={readTranslationField(
                              slot.translations,
                              "pt",
                              "title",
                            )}
                            onChange={(event) =>
                              updateComboSlotTranslation(
                                slot.id,
                                "pt",
                                "title",
                                event.target.value,
                              )
                            }
                            placeholder="Slot name (PT-BR)"
                            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                          />
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={slot.minSelect}
                            onChange={(event) =>
                              updateComboSlot(slot.id, {
                                minSelect: Number.parseInt(event.target.value || "0", 10),
                              })
                            }
                            placeholder="Min select"
                            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                          />
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={slot.maxSelect}
                            onChange={(event) =>
                              updateComboSlot(slot.id, {
                                maxSelect: Number.parseInt(event.target.value || "0", 10),
                              })
                            }
                            placeholder="Max select"
                            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                          />
                          <label className="col-span-2 flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
                            <input
                              type="checkbox"
                              checked={slot.allowDuplicates}
                              onChange={(event) =>
                                updateComboSlot(slot.id, {
                                  allowDuplicates: event.target.checked,
                                })
                              }
                            />
                            Allow duplicate picks in this slot
                          </label>
                        </div>

                        <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-2">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Attach products
                          </p>
                          <div className="grid grid-cols-[1fr_110px_auto] gap-2">
                            <select
                              value={slot.optionLookupProductId}
                              onChange={(event) =>
                                updateComboSlot(slot.id, {
                                  optionLookupProductId: event.target.value,
                                })
                              }
                              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                            >
                              <option value="">Select product...</option>
                              {productLookupList
                                .filter((product) => product.id !== editor.productId)
                                .map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.name}
                                  </option>
                                ))}
                            </select>
                            <input
                              value={slot.optionLookupExtraPriceInput}
                              onChange={(event) =>
                                updateComboSlot(slot.id, {
                                  optionLookupExtraPriceInput: event.target.value,
                                })
                              }
                              placeholder="Extra $"
                              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                            />
                            <button
                              type="button"
                              onClick={() => addComboSlotOption(slot.id)}
                              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                            >
                              Add
                            </button>
                          </div>

                          <div className="mt-2 space-y-2">
                            {slot.options.map((option) => (
                              <div
                                key={option.id}
                                className="grid grid-cols-[1fr_110px_auto] items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-2"
                              >
                                <p className="text-sm text-zinc-800">
                                  {productNameById.get(option.productId) || "Unknown product"}
                                </p>
                                <input
                                  value={option.extraPriceInput}
                                  onChange={(event) =>
                                    updateComboSlotOption(slot.id, option.id, {
                                      extraPriceInput: event.target.value,
                                    })
                                  }
                                  placeholder="Extra $"
                                  className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeComboSlotOption(slot.id, option.id)}
                                  className="rounded-md px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}

                            {slot.options.length === 0 ? (
                              <p className="text-xs text-zinc-500">
                                No products attached to this slot yet.
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}

                    {editor.comboSlots.length === 0 ? (
                      <p className="text-xs text-zinc-500">
                        No slots configured. This is optional.
                      </p>
                    ) : null}
                  </div>
                </section>
              ) : null}

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
                  <input
                    id={photoFileInputId}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void uploadPhotoFile(file);
                      }
                      event.currentTarget.value = "";
                    }}
                    disabled={editor.uploadingPhoto}
                  />
                  <label
                    htmlFor={photoFileInputId}
                    className={`inline-flex flex-col items-center gap-1 ${
                      editor.uploadingPhoto ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    }`}
                  >
                    <p className="text-lg">^</p>
                    <p className="text-sm">
                      {editor.uploadingPhoto
                        ? "Uploading image..."
                        : "Click to upload or drag and drop"}
                    </p>
                  </label>
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
                  disabled={editor.saving || editor.uploadingPhoto}
                >
                  {editor.saving
                    ? "Saving..."
                    : editor.uploadingPhoto
                      ? "Uploading image..."
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
