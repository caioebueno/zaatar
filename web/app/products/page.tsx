import ProductManagerList from "../components/ProductManagerList";
import getProductsManagerList from "@/src/getProductsManagerList";

export default async function ProductsPage() {
  const products = await getProductsManagerList();

  return (
    <ProductManagerList
      initialCategories={products.categories}
      initialUncategorized={products.uncategorized}
      initialLookupModifierGroups={products.lookupModifierGroups}
    />
  );
}
