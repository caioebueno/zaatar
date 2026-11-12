import type { TCartItem, TSelectedModifier } from "@/types/cart";

type TCatalogModifierGroup = {
  id: string;
  type?: "MULTI" | "SINGLE" | null;
  maxSelection?: number | null;
  items: Array<{ id: string }>;
};

/** Minimum catalog shape needed to check a cart item's selected IDs. */
export type TSelectionCatalogProduct = {
  modifierGroups?: TCatalogModifierGroup[];
  comboSlots?: Array<{
    id: string;
    maxSelect?: number | null;
    allowDuplicates?: boolean | null;
    options: Array<{
      productId: string;
      modifierGroups?: TCatalogModifierGroup[];
    }>;
  }>;
};

function invalidField(field: string) {
  return { code: "INVALID_PARAMS", details: { field } };
}

function assertModifiersInGroups(
  modifierGroups: TCatalogModifierGroup[] | undefined,
  modifiers: TSelectedModifier[] | undefined,
  field: string,
) {
  if (!modifiers?.length) return;

  const groupByItemId = new Map<string, TCatalogModifierGroup>();
  for (const group of modifierGroups ?? []) {
    for (const item of group.items) {
      groupByItemId.set(item.id, group);
    }
  }

  const seenItemIds = new Set<string>();
  const countByGroupId = new Map<string, number>();
  for (const modifier of modifiers) {
    const group = groupByItemId.get(modifier.modifierItemId);
    if (!group || group.id !== modifier.modifierId) {
      throw invalidField(field);
    }
    if (seenItemIds.has(modifier.modifierItemId)) {
      throw invalidField(field);
    }
    seenItemIds.add(modifier.modifierItemId);
    countByGroupId.set(group.id, (countByGroupId.get(group.id) ?? 0) + 1);
  }

  for (const group of modifierGroups ?? []) {
    const count = countByGroupId.get(group.id) ?? 0;
    // Mirrors the menu: only MULTI groups allow more than one item.
    const maxSelection =
      group.type === "MULTI"
        ? group.maxSelection && group.maxSelection > 0
          ? group.maxSelection
          : Infinity
        : 1;
    if (count > maxSelection) {
      throw invalidField(field);
    }
  }
}

/**
 * Rejects a cart item whose modifier and combo selection IDs are not part of
 * the catalog product being priced. Pricing then only ever reads catalog
 * prices, never values carried on the client payload.
 */
export function assertCartItemSelectionsInCatalog(
  product: TSelectionCatalogProduct,
  cartItem: TCartItem,
) {
  assertModifiersInGroups(
    product.modifierGroups,
    cartItem.modifiers,
    "cart.items.modifiers",
  );

  const comboSelections = cartItem.comboSelections ?? [];
  if (comboSelections.length === 0) return;

  const comboSlots = product.comboSlots ?? [];
  if (comboSlots.length === 0) {
    throw invalidField("cart.items.comboSelections");
  }

  const quantityBySlotId = new Map<string, number>();
  const optionIdsBySlotId = new Map<string, Set<string>>();
  for (const selection of comboSelections) {
    const slot = comboSlots.find((item) => item.id === selection.slotId);
    const option = slot?.options.find(
      (item) => item.productId === selection.optionProductId,
    );
    if (!slot || !option) {
      throw invalidField("cart.items.comboSelections");
    }

    const slotOptionIds = optionIdsBySlotId.get(slot.id) ?? new Set<string>();
    if (slot.allowDuplicates === false && slotOptionIds.has(option.productId)) {
      throw invalidField("cart.items.comboSelections");
    }
    slotOptionIds.add(option.productId);
    optionIdsBySlotId.set(slot.id, slotOptionIds);

    const slotQuantity = (quantityBySlotId.get(slot.id) ?? 0) + selection.quantity;
    if (slotQuantity > Math.max(1, slot.maxSelect ?? 1)) {
      throw invalidField("cart.items.comboSelections.quantity");
    }
    quantityBySlotId.set(slot.id, slotQuantity);

    assertModifiersInGroups(
      option.modifierGroups,
      selection.modifiers,
      "cart.items.comboSelections.modifiers",
    );
  }
}
