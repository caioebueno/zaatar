import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ProductManagerList from "@/app/components/ProductManagerList";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/src/lib/auth";
import { readBusinessIdFromCookieStore } from "@/src/lib/business";
import type {
  ProductManagerCategory,
  ProductManagerComboSlot,
  ProductManagerFixedComboProduct,
  ProductManagerModifierGroup,
  ProductManagerModifierGroupItem,
  ProductManagerPreparationTask,
  ProductManagerProduct,
  ProductManagerProductItemType,
  ProductManagerTranslations,
} from "@/src/types/productManager";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    menuId?: string | string[];
  }>;
};

type ApiMenu = {
  id: string;
  name: string;
  active: boolean;
  isDefault: boolean;
};

type UberSyncPreviewResponse = {
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
};

const DEFAULT_API_BASE_URL = "http://127.0.0.1:4000";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeApiBaseUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    return parsed.href.replace(/\/+$/, "").replace(/\/api$/, "");
  } catch {
    return null;
  }
}

function buildApiBaseUrlCandidates(): string[] {
  const rawCandidates = [
    process.env.API_BASE_URL?.trim(),
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim(),
    DEFAULT_API_BASE_URL,
  ];

  const candidates = new Set<string>();

  for (const value of rawCandidates) {
    if (!value) continue;
    const normalized = normalizeApiBaseUrl(value);
    if (!normalized) continue;
    candidates.add(normalized);

    try {
      const parsed = new URL(normalized);
      if (parsed.hostname === "localhost") {
        parsed.hostname = "127.0.0.1";
        candidates.add(parsed.href.replace(/\/+$/, ""));
      } else if (parsed.hostname === "127.0.0.1") {
        parsed.hostname = "localhost";
        candidates.add(parsed.href.replace(/\/+$/, ""));
      }
    } catch {
      continue;
    }
  }

  return Array.from(candidates);
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Unknown error";
}

function toTranslations(value: unknown): ProductManagerTranslations | null {
  if (!isRecord(value)) return null;

  const output: ProductManagerTranslations = {};

  for (const [locale, fields] of Object.entries(value)) {
    if (!isRecord(fields)) continue;
    const normalizedFields: Record<string, string> = {};

    for (const [key, fieldValue] of Object.entries(fields)) {
      if (typeof fieldValue !== "string") continue;
      const trimmed = fieldValue.trim();
      if (!trimmed) continue;
      normalizedFields[key] = trimmed;
    }

    if (Object.keys(normalizedFields).length > 0) {
      output[locale] = normalizedFields;
    }
  }

  return Object.keys(output).length > 0 ? output : null;
}

function toModifierItem(value: unknown): ProductManagerModifierGroupItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string") return null;
  if (typeof value.price !== "number") return null;

  let photoUrl: string | null = null;
  if (isRecord(value.photo) && typeof value.photo.url === "string") {
    photoUrl = value.photo.url;
  } else if (typeof value.photoUrl === "string") {
    photoUrl = value.photoUrl;
  }

  return {
    id: value.id,
    name: value.name,
    description: typeof value.description === "string" ? value.description : null,
    price: value.price,
    translations: toTranslations(value.translations),
    photoUrl,
  };
}

function toModifierGroup(value: unknown): ProductManagerModifierGroup | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.title !== "string") return null;

  const items = Array.isArray(value.items)
    ? value.items
        .map(toModifierItem)
        .filter((item): item is ProductManagerModifierGroupItem => item !== null)
    : [];

  return {
    id: value.id,
    title: value.title,
    required: value.required === true,
    type:
      value.type === "MULTI" || value.type === "SINGLE"
        ? value.type
        : null,
    minSelection: typeof value.minSelection === "number" ? value.minSelection : null,
    maxSelection: typeof value.maxSelection === "number" ? value.maxSelection : null,
    translations: toTranslations(value.translations),
    items,
  };
}

function toComboSlots(value: unknown): ProductManagerComboSlot[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((slot) => {
      if (!isRecord(slot)) return null;
      if (typeof slot.id !== "string" || typeof slot.name !== "string") return null;

      const options = Array.isArray(slot.options)
        ? slot.options
            .map((option) => {
              if (!isRecord(option)) return null;
              if (
                typeof option.productId !== "string" ||
                typeof option.productName !== "string" ||
                typeof option.extraPrice !== "number"
              ) {
                return null;
              }

              return {
                productId: option.productId,
                productName: option.productName,
                extraPrice: option.extraPrice,
                sortIndex: typeof option.sortIndex === "number" ? option.sortIndex : null,
              };
            })
            .filter(
              (
                option,
              ): option is ProductManagerComboSlot["options"][number] => option !== null,
            )
        : [];

      return {
        id: slot.id,
        name: slot.name,
        translations: toTranslations(slot.translations),
        minSelect: typeof slot.minSelect === "number" ? slot.minSelect : 1,
        maxSelect: typeof slot.maxSelect === "number" ? slot.maxSelect : 1,
        allowDuplicates: slot.allowDuplicates !== false,
        sortIndex: typeof slot.sortIndex === "number" ? slot.sortIndex : null,
        options,
      } satisfies ProductManagerComboSlot;
    })
    .filter((slot): slot is ProductManagerComboSlot => slot !== null);
}

function toFixedComboProducts(value: unknown): ProductManagerFixedComboProduct[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((product) => {
      if (!isRecord(product)) return null;
      if (
        typeof product.productId !== "string" ||
        typeof product.productName !== "string" ||
        typeof product.quantity !== "number"
      ) {
        return null;
      }

      return {
        productId: product.productId,
        productName: product.productName,
        quantity: product.quantity,
      } satisfies ProductManagerFixedComboProduct;
    })
    .filter(
      (product): product is ProductManagerFixedComboProduct => product !== null,
    );
}

function toPreparationStepIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function toPreparationTaskLookupMap(
  value: unknown,
): Map<string, ProductManagerPreparationTask> {
  const map = new Map<string, ProductManagerPreparationTask>();
  if (!Array.isArray(value)) return map;

  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.id !== "string") continue;
    if (typeof entry.name !== "string") continue;

    map.set(entry.id, {
      id: entry.id,
      name: entry.name,
      stationId: typeof entry.stationId === "string" ? entry.stationId : null,
      stationName: typeof entry.stationName === "string" ? entry.stationName : null,
      includeComments: entry.includeComments === true,
      includeModifiers: entry.includeModifiers === true,
    });
  }

  return map;
}

function mapProduct(
  value: unknown,
  assignment: { categoryId: string | null; categoryIndex: number | null },
  preparationTaskLookupById: Map<string, ProductManagerPreparationTask>,
): ProductManagerProduct | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string") return null;

  const photoUrls = Array.isArray(value.photos)
    ? value.photos
        .map((photo) =>
          isRecord(photo) && typeof photo.url === "string" ? photo.url : null,
        )
        .filter((url): url is string => url !== null)
    : [];

  const comboSlots = toComboSlots(value.comboSlots);
  const products = toFixedComboProducts(value.products);
  const preparationStepIds = toPreparationStepIds(value.preparationStepIds);

  return {
    id: value.id,
    itemType:
      value.itemType === "COMBO"
        ? "COMBO"
        : ("PRODUCT" as ProductManagerProductItemType),
    name: value.name,
    visible: value.visible !== false,
    description: typeof value.description === "string" ? value.description : null,
    price: typeof value.price === "number" ? value.price : null,
    comparedAtPrice:
      typeof value.comparedAtPrice === "number" ? value.comparedAtPrice : null,
    categoryId: assignment.categoryId,
    categoryIndex: assignment.categoryIndex,
    createdAt:
      typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    translations: toTranslations(value.translations),
    photoUrls,
    mainPhotoUrl: photoUrls[0] ?? null,
    modifierGroups: Array.isArray(value.modifierGroups)
      ? value.modifierGroups
          .map(toModifierGroup)
          .filter((group): group is ProductManagerModifierGroup => group !== null)
      : [],
    preparationStepIds,
    preparationTasks: preparationStepIds
      .map((stepId) => preparationTaskLookupById.get(stepId) ?? null)
      .filter(
        (step): step is ProductManagerPreparationTask => step !== null,
      ),
    products,
    comboSlots,
    comboItems: comboSlots
      .map((slot) => {
        const firstOption = slot.options[0];
        if (!firstOption) return null;
        return {
          productId: firstOption.productId,
          productName: firstOption.productName,
          quantity: Math.max(1, slot.maxSelect),
        };
      })
      .filter(
        (
          item,
        ): item is ProductManagerProduct["comboItems"][number] => item !== null,
      ),
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

function getCategoryAssignments(value: unknown): {
  categoryId: string;
  categoryIndex: number | null;
}[] {
  if (!isRecord(value)) return [];

  if (Array.isArray(value.categoryEntries)) {
    return value.categoryEntries
      .map((entry) => {
        if (!isRecord(entry) || typeof entry.categoryId !== "string") return null;
        return {
          categoryId: entry.categoryId,
          categoryIndex:
            typeof entry.categoryIndex === "number" ? entry.categoryIndex : null,
        };
      })
      .filter(
        (
          entry,
        ): entry is { categoryId: string; categoryIndex: number | null } =>
          entry !== null,
      );
  }

  if (typeof value.categoryId === "string" && value.categoryId.trim()) {
    return [
      {
        categoryId: value.categoryId,
        categoryIndex:
          typeof value.categoryIndex === "number" ? value.categoryIndex : null,
      },
    ];
  }

  return [];
}

async function fetchApiJson<T>(
  apiBaseUrls: string[],
  path: string,
  accessToken: string,
  businessId: string | null,
): Promise<T> {
  let lastError: unknown = null;

  for (const apiBaseUrl of apiBaseUrls) {
    try {
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(businessId ? { "x-business-id": businessId } : {}),
        },
        cache: "no-store",
      });

      if (response.status === 401) {
        redirect("/login");
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: unknown;
        };
        const message =
          typeof payload.error === "string"
            ? payload.error
            : `Request failed (${response.status})`;

        lastError = new Error(`${message} at ${apiBaseUrl}${path}`);
        continue;
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
    }
  }

  const attempted = apiBaseUrls.join(", ");
  throw new Error(
    `Could not reach API for "${path}". Tried: ${attempted}. Last error: ${toErrorMessage(lastError)}`,
  );
}

export default async function MenuProductsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const rawMenuId = resolvedSearchParams.menuId;
  const requestedMenuId =
    typeof rawMenuId === "string" && rawMenuId.trim().length > 0
      ? rawMenuId.trim()
      : null;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = readBusinessIdFromCookieStore(cookieStore);

  if (!accessToken) {
    redirect("/login");
  }

  const apiBaseUrls = buildApiBaseUrlCandidates();
  let menus: ApiMenu[] = [];

  try {
    menus = await fetchApiJson<ApiMenu[]>(apiBaseUrls, "/menus", accessToken, businessId);
  } catch (error) {
    return (
      <div className="manager-page">
        <h1 className="manager-page-title">Products</h1>
        <p className="manager-page-subtitle">
          Could not load data from API. {toErrorMessage(error)}
        </p>
      </div>
    );
  }

  const selectedMenuId =
    (requestedMenuId && menus.some((menu) => menu.id === requestedMenuId)
      ? requestedMenuId
      : null) ??
    menus.find((menu) => menu.isDefault)?.id ??
    menus[0]?.id ??
    "";

  if (!selectedMenuId) {
    return (
      <div className="manager-page">
        <h1 className="manager-page-title">Products</h1>
        <p className="manager-page-subtitle">No menu available yet.</p>
      </div>
    );
  }

  let productsResponse: {
    products?: unknown;
    lookup?: {
      categories?: unknown;
      modifierGroups?: unknown;
      preparationSteps?: unknown;
    };
  };
  let menuCategoriesResponse: unknown[];

  try {
    [productsResponse, menuCategoriesResponse] = await Promise.all([
      fetchApiJson<{
        products?: unknown;
        lookup?: {
          categories?: unknown;
          modifierGroups?: unknown;
          preparationSteps?: unknown;
        };
      }>(apiBaseUrls, "/products", accessToken, businessId),
      fetchApiJson<unknown[]>(
        apiBaseUrls,
        `/categories?menuId=${encodeURIComponent(selectedMenuId)}`,
        accessToken,
        businessId,
      ),
    ]);
  } catch (error) {
    return (
      <div className="manager-page">
        <h1 className="manager-page-title">Products</h1>
        <p className="manager-page-subtitle">
          Could not load products data. {toErrorMessage(error)}
        </p>
      </div>
    );
  }

  const products = Array.isArray(productsResponse.products)
    ? productsResponse.products
    : [];
  const menuCategories = Array.isArray(menuCategoriesResponse)
    ? menuCategoriesResponse
        .map((category) => {
          if (!isRecord(category)) return null;
          if (typeof category.id !== "string") return null;
          const title =
            typeof category.title === "string"
              ? category.title
              : typeof category.name === "string"
                ? category.name
                : "Untitled";

          return {
            id: category.id,
            title,
            menuIndex: typeof category.menuIndex === "number" ? category.menuIndex : null,
          };
        })
        .filter(
          (
            category,
          ): category is { id: string; title: string; menuIndex: number | null } =>
            category !== null,
        )
    : [];
  const categoryIdsInMenu = new Set(menuCategories.map((category) => category.id));
  const preparationTaskLookupById = toPreparationTaskLookupMap(
    productsResponse.lookup?.preparationSteps,
  );

  const categories: ProductManagerCategory[] = menuCategories.map((category) => {
    const categoryProducts = products
      .map((product) => {
        const assignment = getCategoryAssignments(product).find(
          (entry) => entry.categoryId === category.id,
        );
        if (!assignment) return null;
        return mapProduct(product, {
          categoryId: category.id,
          categoryIndex: assignment.categoryIndex,
        }, preparationTaskLookupById);
      })
      .filter((product): product is ProductManagerProduct => product !== null)
      .sort(sortProducts);

    return {
      id: category.id,
      title: category.title,
      menuIndex: category.menuIndex,
      products: categoryProducts,
    };
  });

  const uncategorized = products
    .filter((product) => {
      const assignments = getCategoryAssignments(product);
      return !assignments.some((entry) => categoryIdsInMenu.has(entry.categoryId));
    })
    .map((product) =>
      mapProduct(product, {
        categoryId: null,
        categoryIndex: null,
      }, preparationTaskLookupById),
    )
    .filter((product): product is ProductManagerProduct => product !== null)
    .sort(sortProducts);

  const lookupModifierGroups = Array.isArray(productsResponse.lookup?.modifierGroups)
    ? productsResponse.lookup.modifierGroups
        .map(toModifierGroup)
        .filter((group): group is ProductManagerModifierGroup => group !== null)
    : [];
  const allSections = Array.isArray(productsResponse.lookup?.categories)
    ? productsResponse.lookup.categories
        .map((section) => {
          if (!isRecord(section) || typeof section.id !== "string") return null;
          const title =
            typeof section.name === "string"
              ? section.name
              : typeof section.title === "string"
                ? section.title
                : "Untitled";
          return {
            id: section.id,
            title,
          };
        })
        .filter(
          (section): section is { id: string; title: string } => section !== null,
        )
    : [];

  let initialUberSyncInsights: UberSyncPreviewResponse | null = null;
  try {
    initialUberSyncInsights = await fetchApiJson<UberSyncPreviewResponse>(
      apiBaseUrls,
      `/integrations/uber-eats/menu-sync/preview?menuId=${encodeURIComponent(
        selectedMenuId,
      )}`,
      accessToken,
      businessId,
    );
  } catch {
    initialUberSyncInsights = null;
  }

  return (
    <ProductManagerList
      initialCategories={categories}
      initialUncategorized={uncategorized}
      initialLookupModifierGroups={lookupModifierGroups}
      menus={menus}
      selectedMenuId={selectedMenuId}
      allSections={allSections}
      initialUberSyncInsights={initialUberSyncInsights}
    />
  );
}
