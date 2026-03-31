type TCartItem = {
  cartId: string;
  productId: string;
  quantity: number;
  modifiers: TSelectedModifier[];
  description?: string;
};

type TSelectedModifier = {
  modifierId: string;
  modifierItemId: string;
};

type TCart = {
  items: TCartItem[];
};

export default TCart;
export { TCartItem, TSelectedModifier };
