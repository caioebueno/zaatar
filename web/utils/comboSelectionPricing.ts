import type { TSelectedComboSlotOption } from "@/types/cart";

/** Minimum catalog shape needed to price combo selections. */
export type TComboPricingSlot = {
  id: string;
  options: Array<{
    productId: string;
    extraPrice: number;
    modifierGroups?: Array<{
      items: Array<{ id: string; price: number }>;
    }>;
  }>;
};

/**
 * Per-unit cost that a combo's slot selections add on top of the combo price.
 *
 * Prices always come from the catalog when the slot/option is still there —
 * `extraPrice` carried on the selection is only a fallback for options that
 * have since been removed, and modifier prices are never read from the client.
 */
export function calculateComboSelectionsUnitPrice(
  comboSlots: TComboPricingSlot[] | undefined,
  comboSelections: TSelectedComboSlotOption[] | undefined,
): number {
  if (!comboSelections?.length || !comboSlots?.length) return 0;

  const optionBySlotOptionKey = new Map<
    string,
    { extraPrice: number; modifierPriceByItemId: Map<string, number> }
  >();

  for (const slot of comboSlots) {
    for (const option of slot.options) {
      const modifierPriceByItemId = new Map<string, number>();

      for (const modifierGroup of option.modifierGroups ?? []) {
        for (const modifierItem of modifierGroup.items) {
          modifierPriceByItemId.set(modifierItem.id, modifierItem.price);
        }
      }

      optionBySlotOptionKey.set(`${slot.id}:${option.productId}`, {
        extraPrice: option.extraPrice,
        modifierPriceByItemId,
      });
    }
  }

  return comboSelections.reduce((sum, selection) => {
    const option = optionBySlotOptionKey.get(
      `${selection.slotId}:${selection.optionProductId}`,
    );
    const extraPrice =
      option?.extraPrice ??
      (typeof selection.extraPrice === "number" ? selection.extraPrice : 0);
    const modifiersPrice = (selection.modifiers ?? []).reduce(
      (modifierSum, modifier) =>
        modifierSum +
        (option?.modifierPriceByItemId.get(modifier.modifierItemId) ?? 0),
      0,
    );
    const quantity =
      typeof selection.quantity === "number" &&
      Number.isInteger(selection.quantity) &&
      selection.quantity > 0
        ? selection.quantity
        : 1;

    return sum + (extraPrice + modifiersPrice) * quantity;
  }, 0);
}
