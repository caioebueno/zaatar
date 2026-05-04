type TCartItem = {
  cartId: string;
  productId: string;
  quantity: number;
  modifiers: TSelectedModifier[];
  comboSelections?: TSelectedComboSlotOption[];
  description?: string;
};

type TCartPrizeSelection = {
  selectedPrizeId: string | null;
  selectedProductIdsByPrizeId: {
    [prizeId: string]: string[];
  };
};

type TSelectedModifier = {
  modifierId: string;
  modifierItemId: string;
};

type TSelectedComboSlotOption = {
  slotId: string;
  optionProductId: string;
  quantity: number;
  extraPrice?: number;
  slotName?: string;
  optionProductName?: string;
};

type TCart = {
  items: TCartItem[];
  selectedPrize?: TCartPrizeSelection | null;
};

export default TCart;
export {
  TCartItem,
  TCartPrizeSelection,
  TSelectedModifier,
  TSelectedComboSlotOption,
};
