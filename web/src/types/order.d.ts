import TAddress from "./address";
import TCustomer from "./customer";
import TProduct, { TModifierGroupItem } from "./product";
import TProgressiveDiscount, {
  TProgressiveDiscountPrizeProduct,
  TProgressiveDiscountStep,
} from "./progressiveDiscount";
import { TPreparationTaskStation } from "./station";

export type TPaymentMethod = "CARD" | "CASH" | "ZELLE";
export type TPaymentProvider = "STRIPE";
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
  externalId?: string | null;
  canceled?: boolean;
  status: TOrderStatus;
  type: TOrderType;
  dispatchId?: string;
  dispatchOrderIndex?: number;
  productionIndex?: number;
  totalAmount?: number;
  subtotalAmount?: number;
  tip?: number;
  tipAmount?: number;
  deliveryFee?: number;
  costumerId?: string;
  customer?: TCustomer;
  paymentMethod: TPaymentMethod;
  paymentProvider?: TPaymentProvider | null;
  redeemedRewards?: TOrderRedeemedReward[];
  addressId?: string;
  address?: TAddress;
  orderProducts: TOrderProduct[];
  preparationTaskStation: TPreparationTaskStation[];
};

export type TOrderRedeemedReward = {
  id: string;
  customerId: string;
  status: "ACTIVE" | "REDEEMED" | "EXPIRED" | "CANCELED";
  type: "FREE_PRODUCT" | "PERCENT_DISCOUNT" | "FIXED_DISCOUNT" | "CUSTOM";
  title: string;
  description?: string;
  quantity?: number | null;
  value?: number | null;
  couponCode?: string | null;
  issuedAt: string;
  expiresAt?: string | null;
  redeemedAt?: string | null;
  productId?: string | null;
  product?: TProduct;
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
