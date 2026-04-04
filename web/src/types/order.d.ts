import TAddress from "./address";
import TCustomer from "./customer";
import TProduct from "./product";
import { TPreparationStepCategory, TPreparationStepTrack } from "./station";

export type TPaymentMethod = "CARD" | "CASH" | "ZELLE";
export type TOrderType = "DELIVERY" | "TAKEAWAY";

export type TOrder = {
  id: string;
  createdAt: string;
  number?: string;
  type: TOrderType;
  costumerId?: string;
  customer?: TCustomer;
  paymentMethod: TPaymentMethod;
  addressId?: string;
  address?: TAddress;
  orderProducts: TOrderProduct[];
  preparationStepCategory: TPreparationStepCategory[];
};

export type TOrderProduct = {
  id: string;
  productId: string;
  product?: TProduct;
  comments?: string;
  selectedModifierGroupItemIds?: string[];
  amount: number;
  fullAmount: number;
  quantity: number;
};
