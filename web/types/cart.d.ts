type TCartItem = {
  cartId: string;
  productId: string;
  quantity: number;
  modifiers: TSelectedModifier[];
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

type TCart = {
  items: TCartItem[];
  selectedPrize?: TCartPrizeSelection | null;
};

export default TCart;
export { TCartItem, TCartPrizeSelection, TSelectedModifier };
