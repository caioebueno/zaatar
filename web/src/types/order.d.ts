import TAddress from "./address";
import TCustomer from "./customer";
import TProduct, { TModifierGroupItem } from "./product";
import TProgressiveDiscount, {
  TProgressiveDiscountPrizeProduct,
  TProgressiveDiscountStep,
} from "./progressiveDiscount";
import { TPreparationStepCategory } from "./station";

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
  scheduleFor?: string | null;
  language?: string | null;
  paidAt?: string | null;
  progressiveDiscountSnapshot?: TOrderProgressiveDiscountSnapshot;
  deliveredAt?: string;
  estimatedDeliveryDurationMinutes?: number | null;
  number?: string;
  status: TOrderStatus;
  type: TOrderType;
  dispatchId?: string;
  dispatchOrderIndex?: number;
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

export type TOrderProgressiveDiscountSnapshot = {
  progressiveDiscount: TProgressiveDiscount;
  appliedStep: TProgressiveDiscountStep | null;
  fullPrice: number;
  discountedPrice: number;
  discountAmount: number;
  selectedPrize?: TOrderSelectedPrizeSnapshot | null;
};

export type TOrderSelectedPrizeSnapshot = {
  prizeId: string;
  prizeName: string;
  quantity: number;
  selectedProductIds: string[];
  selectedProductCounts: {
    productId: string;
    quantity: number;
  }[];
  availableProducts: TProgressiveDiscountPrizeProduct[];
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
