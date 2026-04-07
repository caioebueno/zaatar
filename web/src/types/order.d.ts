import TAddress from "./address";
import TCustomer from "./customer";
import TProduct, { TModifierGroupItem } from "./product";
import { TPreparationStepCategory, TPreparationStepTrack } from "./station";

export type TPaymentMethod = "CARD" | "CASH" | "ZELLE";
export type TOrderType = "DELIVERY" | "TAKEAWAY";
export type TOrderStatus =
  | "ACCEPTED"
  | "PREPARING"
  | "DELIVERING"
  | "DELIVERED";

export type TOrder = {
  id: string;
  createdAt: string;
  paidAt?: string | null;
  deliveredAt?: string;
  number?: string;
  status: TOrderStatus;
  type: TOrderType;
  dispatchId?: string;
  totalAmount?: number;
  subtotalAmount?: number;
  tipAmount?: number;
  deliveryFee?: number;
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
  selectedModifierGroupItems?: TModifierGroupItem[];
  amount: number;
  fullAmount: number;
  quantity: number;
};
