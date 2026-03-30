import TAddress from "./address";
import TProduct from "./product";

export type TPaymentMethod = "CARD" | "CASH" | "ZELLE";
export type TOrderType = "DELIVERY" | "TAKEAWAY";

export type TOrder = {
  id: string;
  createdAt: string;
  number?: string;
  type: TOrderType;
  paymentMethod: TPaymentMethod;
  addressId?: string;
  address?: TAddress;
  orderProducts: TOrderProduct[];
};

export type TOrderProduct = {
  id: string;
  productId: string;
  product?: TProduct;
  amount: number;
  fullAmount: number;
  quantity: number;
};
