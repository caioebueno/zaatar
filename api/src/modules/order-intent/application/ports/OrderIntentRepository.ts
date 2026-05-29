export type OrderIntentStatus =
  | "ACCEPTED"
  | "PREPARING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export type OrderIntentType = "DELIVERY" | "TAKEAWAY";

export type OrderIntentPaymentMethod = "CASH" | "CARD" | "ZELLE";

export type OrderIntentPaymentProvider = "STRIPE" | null;

export type UpsertOrderIntentProductInput = {
  amount: number | null;
  comments: string | null;
  fullAmount: number | null;
  id: string;
  modifierGroupItemIds: string[];
  productId: string;
  quantity: number;
};

export type UpsertOrderIntentInput = {
  active: boolean | undefined;
  amount: number | null | undefined;
  branchId: string | undefined;
  customerName: string | undefined;
  customerPhone: string | undefined;
  deliveryAddress: string | null | undefined;
  deliveryAddressId: string | null | undefined;
  language: string | null | undefined;
  orderIntentId: string | null | undefined;
  orderProducts: UpsertOrderIntentProductInput[] | undefined;
  paymentMethod: OrderIntentPaymentMethod | undefined;
  paymentProvider: OrderIntentPaymentProvider | undefined;
  progressiveDiscountSnapshot: unknown;
  status: OrderIntentStatus | undefined;
  tags: string[] | undefined;
  tipAmount: number | null | undefined;
  type: OrderIntentType | undefined;
};

export type OrderIntentProductRecord = {
  amount: number | null;
  comments: string | null;
  createdAt: Date;
  fullAmount: number | null;
  id: string;
  modifierGroupItemIds: string[];
  productId: string;
  quantity: number;
};

export type OrderIntentRecord = {
  active: boolean;
  amount: number | null;
  createdAt: Date;
  customerId: string;
  deliveryAddressId: string | null;
  id: string;
  language: string | null;
  orderProducts: OrderIntentProductRecord[];
  paymentMethod: OrderIntentPaymentMethod;
  paymentProvider: OrderIntentPaymentProvider;
  progressiveDiscountSnapshot: unknown;
  status: OrderIntentStatus;
  tags: string[];
  tipAmount: number | null;
  type: OrderIntentType | null;
  updatedAt: Date;
};

export interface OrderIntentRepository {
  upsert(input: UpsertOrderIntentInput): Promise<OrderIntentRecord>;
}
