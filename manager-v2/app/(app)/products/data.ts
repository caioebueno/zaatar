/**
 * Products screen data + helpers, ported from the Zappy `Products.dc.html` design.
 * Deterministic mock data (no Date/random in render) — SSR-safe.
 */
import type { CSSProperties } from "react";

export type Lang = "en" | "es" | "pt";
export type I18n = Partial<Record<Lang, string>>;

export const LANGUAGES: [Lang, string, string][] = [
  ["en", "EN", "English"],
  ["es", "ES", "Español"],
  ["pt", "PT", "Português"],
];

export const STATIONS = ["Grill", "Fry", "Cold prep", "Assembly", "Bar", "Pass"];

export type ModifierOption = { id: string; names: I18n; descriptions: I18n; price: number | string };
export type ModifierGroup = {
  id: string;
  names: I18n;
  selection: "single" | "multi";
  required: boolean;
  min: number;
  max: number;
  options: ModifierOption[];
};
export type TaxGroup = { id: string; name: string; rate: number };
export type PrepTask = { id: string; name: string; station: string; goal: number; comments: boolean; modifiers: boolean };
export type MediaItem = { id: string; kind: "image" | "video"; name: string; url: string | null };

export type ProductDraft = {
  names: I18n;
  descriptions: I18n;
  active: boolean;
  type: "single" | "combo";
  media: MediaItem[];
  price: string;
  comparedAt: string;
  modifiers: string[];
  tasks: string[];
  taxes: string[];
};

export type FlatProduct = {
  id: string;
  section: string;
  rawName: string;
  rawPrice: number;
  rawComparedAt: number;
  rawActive: boolean;
  rawDescription: string;
  name: string;
  price: number;
  comparedAt: number;
  active: boolean;
  description: string;
  photoUrl: string | null;
};

export type CustomProduct = {
  id: string;
  section: string;
  name: string;
  price: number;
  comparedAt: number;
  active: boolean;
  description: string;
};

export type Menu = { id: string; name: string };

type CatalogItem = [string, number, number, boolean, string];
export const CATALOG: { title: string; items: CatalogItem[] }[] = [
  { title: "Burgers", items: [
    ["Classic Cheeseburger", 12.5, 15.0, true, "Grass-fed beef patty, aged cheddar, house pickles and burger sauce in a toasted brioche bun."],
    ["Double Smash", 16.0, 18.5, true, "Two smashed patties, double cheese, caramelised onion."],
    ["Veggie Halloumi Burger", 11.0, 13.0, true, "Grilled halloumi, roasted pepper, rocket and lemon aioli."],
    ["Spicy Chicken Burger", 13.5, 15.5, false, "Buttermilk fried chicken thigh with chipotle mayo and slaw."],
  ] },
  { title: "Sides", items: [
    ["Crispy Fries", 4.5, 5.5, true, "Triple-cooked fries with sea salt."],
    ["Sweet Potato Fries", 5.5, 6.5, true, "Served with smoked paprika mayo."],
    ["Onion Rings", 5.0, 6.0, false, "Beer-battered, six per portion."],
    ["Side Salad", 3.0, 4.0, true, "Leaves, cherry tomato, cucumber, house vinaigrette."],
  ] },
  { title: "Bowls", items: [
    ["Teriyaki Chicken Bowl", 14.0, 16.0, true, "Rice, grilled chicken, edamame, pickled cabbage, sesame."],
    ["Poke Bowl", 16.5, 19.0, true, "Sushi rice, salmon, avocado, cucumber, ponzu."],
    ["Falafel Bowl", 12.5, 14.5, true, "Quinoa, falafel, hummus, tahini dressing."],
  ] },
  { title: "Drinks", items: [
    ["Coke", 2.5, 3.0, true, "Chilled 330ml can."],
    ["Sparkling Water", 2.0, 2.5, true, "500ml bottle."],
    ["Fresh Orange Juice", 4.0, 5.0, false, "Squeezed to order, 300ml."],
    ["Iced Matcha Latte", 5.0, 6.0, true, "Ceremonial grade matcha with oat milk."],
  ] },
  { title: "Desserts", items: [
    ["Chocolate Brownie", 6.0, 7.5, true, "Warm, served with vanilla ice cream."],
    ["Basque Cheesecake", 7.0, 8.5, true, "Burnt top, single slice."],
  ] },
];

export const OPTION_SETS: Record<string, [string, number][]> = {
  Burgers: [["No pickles", 0], ["Add bacon", 2.5], ["Extra patty", 4.0], ["Gluten-free bun", 1.5]],
  Sides: [["Small", 0], ["Large", 2.0], ["Add dip", 0.75]],
  Bowls: [["Regular", 0], ["Extra protein", 3.5], ["No sesame", 0]],
  Drinks: [["Chilled", 0], ["With ice", 0]],
  Desserts: [["Single", 0], ["Add ice cream", 2.0]],
};

export const INITIAL_MODIFIER_LIBRARY: ModifierGroup[] = [
  { id: "size", names: { en: "Size", es: "Tamaño", pt: "Tamanho" }, selection: "single", required: true, min: 1, max: 1, options: [
    { id: "sz-s", names: { en: "Regular" }, descriptions: { en: "" }, price: 0 },
    { id: "sz-m", names: { en: "Large" }, descriptions: { en: "Adds 2 oz" }, price: 1.5 },
    { id: "sz-l", names: { en: "Double" }, descriptions: { en: "" }, price: 3 },
  ] },
  { id: "add-ons", names: { en: "Add-ons", es: "Extras", pt: "Adicionais" }, selection: "multi", required: false, min: 0, max: 4, options: [
    { id: "ao-bacon", names: { en: "Bacon" }, descriptions: { en: "Two strips" }, price: 2 },
    { id: "ao-cheese", names: { en: "Extra cheese" }, descriptions: { en: "" }, price: 1.25 },
    { id: "ao-egg", names: { en: "Fried egg" }, descriptions: { en: "" }, price: 1.75 },
  ] },
  { id: "cook-temp", names: { en: "Cook temperature" }, selection: "single", required: true, min: 1, max: 1, options: [
    { id: "ct-med", names: { en: "Medium" }, descriptions: { en: "" }, price: 0 },
    { id: "ct-mw", names: { en: "Medium well" }, descriptions: { en: "" }, price: 0 },
    { id: "ct-well", names: { en: "Well done" }, descriptions: { en: "" }, price: 0 },
  ] },
  { id: "sauces", names: { en: "Sauces" }, selection: "multi", required: false, min: 0, max: 2, options: [
    { id: "sc-house", names: { en: "House sauce" }, descriptions: { en: "" }, price: 0 },
    { id: "sc-chip", names: { en: "Chipotle mayo" }, descriptions: { en: "Mild heat" }, price: 0.5 },
  ] },
  { id: "swap-side", names: { en: "Swap side" }, selection: "single", required: false, min: 0, max: 1, options: [
    { id: "ss-fries", names: { en: "Fries" }, descriptions: { en: "" }, price: 0 },
    { id: "ss-salad", names: { en: "Side salad" }, descriptions: { en: "" }, price: 1 },
  ] },
];

export const INITIAL_TAX_LIBRARY: TaxGroup[] = [
  { id: "sales-state", name: "State sales tax", rate: 7.25 },
  { id: "sales-city", name: "City surcharge", rate: 1.5 },
  { id: "prepared-food", name: "Prepared food tax", rate: 4 },
  { id: "alcohol", name: "Alcohol tax", rate: 10 },
];

export const INITIAL_PREP_LIBRARY: PrepTask[] = [
  { id: "grill-patty", name: "Grill patty", station: "Grill", goal: 6, comments: true, modifiers: true },
  { id: "toast-bun", name: "Toast bun", station: "Grill", goal: 2, comments: false, modifiers: false },
  { id: "assemble", name: "Assemble & plate", station: "Assembly", goal: 3, comments: true, modifiers: true },
  { id: "fry-basket", name: "Drop fry basket", station: "Fry", goal: 4, comments: false, modifiers: false },
  { id: "pack-bag", name: "Pack for delivery", station: "Pass", goal: 2, comments: true, modifiers: false },
];

export const INITIAL_MENUS: Menu[] = [
  { id: "main", name: "Main menu" },
  { id: "late-night", name: "Late night" },
  { id: "catering", name: "Catering" },
];

// ── Helpers ────────────────────────────────────────────────
export function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T;
}

export function money(v: number): string {
  return "$" + v.toFixed(2);
}

export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function i18n(map: I18n | undefined, lang: Lang): string {
  if (!map) return "";
  return map[lang] || map.en || "";
}

export function parseMoney(v: string | number): number {
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function rate(r: number): string {
  return r.toFixed(2).replace(/\.00$/, "") + "%";
}

export function groupMeta(g: ModifierGroup): string {
  const bits = [g.selection === "multi" ? "Multi-select" : "Single select"];
  if (g.selection === "multi") bits.push("min " + (g.min || 0) + " · max " + (g.max || g.options.length));
  bits.push(g.required ? "required" : "optional");
  bits.push(g.options.length + (g.options.length === 1 ? " option" : " options"));
  return bits.join(" · ");
}

export function taskMeta(t: PrepTask): string {
  const flags: string[] = [];
  if (t.comments) flags.push("comments");
  if (t.modifiers) flags.push("modifiers");
  return t.station + " · " + t.goal + " min" + (flags.length ? " · " + flags.join(", ") : "");
}

// ── Style helpers ──────────────────────────────────────────
export function thumbStyle(size: number, radius: number): CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(150deg,#2F2F2F,#242424)",
    border: "1px solid rgba(255,255,255,0.07)",
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: size > 60 ? 20 : 11.5,
    color: "#75767C",
    letterSpacing: "0.02em",
  };
}

export function statusChip(active: boolean): { statusStyle: CSSProperties; dotStyle: CSSProperties; status: string } {
  const color = active ? "#22C55E" : "#8A8B90";
  return {
    status: active ? "Active" : "Inactive",
    statusStyle: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 8px",
      borderRadius: 9999,
      background: color + "1F",
      color,
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
    },
    dotStyle: { width: 5, height: 5, borderRadius: 9999, background: color, flexShrink: 0 },
  };
}

export function switchStyle(on: boolean): CSSProperties {
  return {
    width: 40,
    height: 23,
    borderRadius: 9999,
    border: "none",
    padding: 2,
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    justifyContent: on ? "flex-end" : "flex-start",
    alignItems: "center",
    background: on ? "#FF5C1A" : "#3A3A3A",
    transition: "background 140ms ease",
  };
}

export const KNOB_STYLE: CSSProperties = { width: 19, height: 19, borderRadius: 9999, background: "#fff", display: "block" };

export function pickerRowStyle(): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: 30,
    padding: "0 8px",
    borderRadius: 6,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    fontSize: 12.5,
    color: "#F1F1F1",
    width: "100%",
  };
}

export function typeOptionStyle(active: boolean): CSSProperties {
  return {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 3,
    padding: "10px 12px",
    borderRadius: 7,
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    textAlign: "left",
    background: active ? "rgba(255,92,26,0.12)" : "#191919",
    border: "1px solid " + (active ? "rgba(255,92,26,0.5)" : "rgba(255,255,255,0.08)"),
    color: active ? "#FF7A44" : "#C7C8CC",
  };
}

export function langTabStyle(active: boolean): CSSProperties {
  return {
    height: 24,
    padding: "0 10px",
    borderRadius: 5,
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.03em",
    background: active ? "#2F2F2F" : "transparent",
    color: active ? "#F1F1F1" : "#75767C",
  };
}

export function primarySaveStyle(enabled: boolean, height = 32): CSSProperties {
  return {
    height,
    padding: height === 32 ? "0 15px" : "0 13px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-body)",
    fontSize: 12.5,
    fontWeight: 600,
    background: enabled ? "#FF5C1A" : "rgba(255,255,255,0.07)",
    color: enabled ? "#171717" : "#75767C",
  };
}
