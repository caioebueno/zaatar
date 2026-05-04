import ProductManagerList from "../components/ProductManagerList";
import getProductsManagerList from "@/src/getProductsManagerList";
import prisma from "@/prisma";
import { DEFAULT_MENU_ID } from "@/src/constants/menu";

type ProductsPageProps = {
  searchParams: Promise<{
    menuId?: string | string[];
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawMenuId = resolvedSearchParams.menuId;
  const selectedMenuId =
    typeof rawMenuId === "string" && rawMenuId.trim().length > 0
      ? rawMenuId.trim()
      : DEFAULT_MENU_ID;

  const [products, menus, allSections] = await Promise.all([
    getProductsManagerList(selectedMenuId),
    prisma.menu.findMany({
      select: {
        id: true,
        name: true,
        active: true,
        isDefault: true,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const resolvedSelectedMenuId = menus.some((menu) => menu.id === selectedMenuId)
    ? selectedMenuId
    : (menus.find((menu) => menu.isDefault)?.id ?? DEFAULT_MENU_ID);

  return (
    <ProductManagerList
      initialCategories={products.categories}
      initialUncategorized={products.uncategorized}
      initialLookupModifierGroups={products.lookupModifierGroups}
      menus={menus}
      selectedMenuId={resolvedSelectedMenuId}
      allSections={allSections.map((section) => ({
        id: section.id,
        title: section.name,
      }))}
    />
  );
}
