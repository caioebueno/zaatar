import {
  type CatalogProduct,
  type CatalogCategory,
  type CategoriesResponse,
} from './api';

type CatalogData = { products: CatalogProduct[]; categories: CatalogCategory[] };
let _catalogCache: CatalogData | null = null;

export function getCatalogCache(): CatalogData | null { return _catalogCache; }
export function setCatalogCache(data: CatalogData): void { _catalogCache = data; }

export function mapCategories(data: CategoriesResponse): CatalogData {
  const categories: CatalogCategory[] = data.map(c => ({ id: c.id, name: c.title }));
  const seen = new Map<string, CatalogProduct>();

  for (const cat of data) {
    for (const p of cat.products) {
      if (seen.has(p.id)) {
        const existing = seen.get(p.id)!;
        if (!existing.categoryIds.includes(cat.id)) existing.categoryIds.push(cat.id);
        continue;
      }
      seen.set(p.id, {
        id: p.id,
        name: p.name,
        price: p.price ?? null,
        description: p.description ?? null,
        categoryId: cat.id,
        categoryIds: [cat.id],
        photos: (p.photos ?? []).map(ph => ({ url: ph.url })),
        visible: p.visible,
        modifierGroups: p.modifierGroups.map(g => ({
          id: g.id,
          title: g.title,
          description: g.description ?? null,
          required: g.required,
          type: g.type,
          minSelection: g.minSelection,
          maxSelection: g.maxSelection,
          items: g.items.map(i => ({
            id: i.id,
            name: i.name,
            price: i.price || null,
            description: i.description ?? null,
          })),
        })),
      });
    }
  }

  return { products: Array.from(seen.values()), categories };
}

export function fmtCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
