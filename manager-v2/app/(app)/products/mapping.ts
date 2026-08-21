/**
 * Maps the real `GET /products` + `GET /categories` responses into the
 * Products screen's local model (FlatProduct / ProductDraft / libraries).
 */
import type { ApiCategory, ApiModifierGroup, ApiPrepStepDef, ApiProduct } from "../../lib/api";
import type { ModifierGroup, PrepTask, ProductDraft } from "./data";

export const UNCATEGORIZED = "Uncategorized";

/** API monetary values are integer cents; the screen works in dollars. */
export function centsToDollars(cents: number | null | undefined): number {
  return Math.round(cents ?? 0) / 100;
}

export function categoryNameById(categories: ApiCategory[]): Record<string, string> {
  const out: Record<string, string> = {};
  categories.forEach((c) => (out[c.id] = c.name));
  return out;
}

/** Section (category) a product belongs to, by name. */
export function sectionOf(p: ApiProduct, names: Record<string, string>): string {
  const id = p.categoryId ?? (p.categoryIds && p.categoryIds[0]) ?? null;
  return (id && names[id]) || UNCATEGORIZED;
}

/** Ordered section titles: categories in API order, then any Uncategorized bucket. */
export function sectionTitles(categories: ApiCategory[], products: ApiProduct[]): string[] {
  const names = categoryNameById(categories);
  const ordered = categories.map((c) => c.name);
  const present = new Set(products.map((p) => sectionOf(p, names)));
  const titles = ordered.filter((t) => present.has(t));
  if (present.has(UNCATEGORIZED)) titles.push(UNCATEGORIZED);
  return titles;
}

function mapModifierGroup(mg: ApiModifierGroup): ModifierGroup {
  const selection = mg.type === "MULTI" ? "multi" : "single";
  return {
    id: mg.id,
    names: { en: mg.title, es: translated(mg.translations, "es", "title"), pt: translated(mg.translations, "pt", "title") },
    selection,
    required: mg.required,
    min: mg.minSelection ?? 0,
    max: mg.maxSelection ?? (selection === "multi" ? mg.items.length : 1),
    options: mg.items.map((it) => ({
      id: it.id,
      names: { en: it.name, es: translated(it.translations, "es", "title"), pt: translated(it.translations, "pt", "title") },
      descriptions: { en: it.description ?? "", es: translated(it.translations, "es", "description"), pt: translated(it.translations, "pt", "description") },
      price: centsToDollars(it.price),
    })),
  };
}

/** Unique modifier groups aggregated across all products. */
export function deriveModifierLibrary(products: ApiProduct[]): ModifierGroup[] {
  const byId = new Map<string, ModifierGroup>();
  products.forEach((p) => (p.modifierGroups ?? []).forEach((mg) => {
    if (!byId.has(mg.id)) byId.set(mg.id, mapModifierGroup(mg));
  }));
  return Array.from(byId.values());
}

/** Preparation-task library from the response's `lookup.preparationSteps` (full defs). */
export function prepLibraryFromLookup(steps: ApiPrepStepDef[]): PrepTask[] {
  return steps.map((s) => ({
    id: s.id,
    name: s.name,
    station: s.stationName || "—",
    goal: s.goalMinutes,
    comments: s.includeComments,
    modifiers: s.includeModifiers,
  }));
}

/** Reads `translations[locale][field]` (e.g. es.title) from the loosely-typed translations object. */
function translated(translations: unknown, locale: string, field: "title" | "description"): string {
  if (!translations || typeof translations !== "object") return "";
  const entry = (translations as Record<string, unknown>)[locale];
  if (!entry || typeof entry !== "object") return "";
  const v = (entry as Record<string, unknown>)[field];
  return typeof v === "string" ? v : "";
}

export function mapProductToDraft(p: ApiProduct): ProductDraft {
  const price = centsToDollars(p.price);
  const cmp = centsToDollars(p.comparedAtPrice);
  const tr = p.translations;
  return {
    names: { en: p.name, es: translated(tr, "es", "title"), pt: translated(tr, "pt", "title") },
    descriptions: { en: p.description ?? "", es: translated(tr, "es", "description"), pt: translated(tr, "pt", "description") },
    active: p.visible,
    type: p.itemType === "COMBO" ? "combo" : "single",
    media: (p.photos ?? []).map((ph) => ({ id: ph.id, kind: "image" as const, name: ph.name, url: ph.url })),
    price: price.toFixed(2),
    comparedAt: cmp > price ? cmp.toFixed(2) : "",
    modifiers: (p.modifierGroups ?? []).map((mg) => mg.id),
    tasks: (p.preparationSteps ?? []).map((s) => s.id),
    taxes: [],
  };
}
