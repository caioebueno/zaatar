export type ChatConversationOrder = {
  canceled: boolean;
  createdAt: string;
  customer: {
    name: string | null;
    phone: string | null;
  };
  deliveryFeeCents: number;
  discountedSubtotalCents: number;
  id: string;
  items: Array<{
    lineTotalCents: number;
    productId: string;
    productName: string;
    quantity: number;
    unitAmountCents: number;
  }>;
  number: string | null;
  orderType: string;
  paymentMethod: string;
  status: string;
  subtotalCents: number;
  tipAmountCents: number;
  tipPercent: number;
  totalCents: number;
};

export type ChatConversationOrderIntent = {
  active: boolean;
  amount: number | null;
  createdAt: string;
  customerId: string;
  deliveryAddress: {
    city: string;
    deliveryFee: number;
    description: string;
    id: string;
    lat: string;
    lng: string;
    number: string;
    state: string;
    street: string;
    zipCode: string;
  } | null;
  deliveryAddressId: string | null;
  id: string;
  language: string | null;
  orderProducts: Array<{
    id: string;
    amount: number | null;
    comments: string | null;
    fullAmount: number | null;
    modifierGroupItemIds: string[];
    productId: string;
    quantity: number;
  }>;
  paymentMethod: "CARD" | "CASH" | "ZELLE";
  paymentProvider: "STRIPE" | null;
  progressiveDiscountSnapshot: unknown;
  status: "ACCEPTED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED";
  tags: string[];
  tipAmount: number | null;
  type: "DELIVERY" | "TAKEAWAY" | null;
  updatedAt: string;
};

export interface ChatConversationOrderRepository {
  findLatestOrderByPhoneCandidates(
    phoneCandidates: string[],
  ): Promise<ChatConversationOrder | null>;
  findActiveOrderIntentByPhoneCandidates(
    phoneCandidates: string[],
  ): Promise<ChatConversationOrderIntent | null>;
}
