export type OrderListQuery = {
  from?: string;
  includeCanceled: boolean;
  limit: number;
  timezone: string;
  to?: string;
};

export type DayWindow = {
  end: Date;
  start: Date;
};

export type OrderListItem = {
  canceled: boolean;
  createdAt: Date;
  customerName: string | null;
  customerPhone: string | null;
  id: string;
  number: string | null;
  orderType: string;
  paymentMethod: string;
  status: string;
  totalCents: number;
};

export type OrderDetailLineItem = {
  lineTotalCents: number;
  productId: string;
  productName: string;
  quantity: number;
  unitAmountCents: number;
};

export type OrderDetail = {
  canceled: boolean;
  createdAt: Date;
  customer: {
    name: string | null;
    phone: string | null;
  };
  deliveryFeeCents: number;
  discountedSubtotalCents: number;
  id: string;
  items: OrderDetailLineItem[];
  number: string | null;
  orderType: string;
  paymentMethod: string;
  status: string;
  subtotalCents: number;
  tipAmountCents: number;
  tipPercent: number;
  totalCents: number;
};

export type UpdateOrderDeliveryInput = {
  deliveredAt: Date | null;
  orderId: string;
};

export type UpdateOrderDeliveryResult = {
  deliveredAt: string | null;
  id: string;
};

export type OrdersByStationItem = {
  address?: unknown;
  addressId?: string;
  canceled?: boolean;
  createdAt: string;
  customer?: unknown;
  dispatchId?: string;
  dispatchOrderIndex?: number;
  estimatedDeliveryDurationMinutes?: number | null;
  externalId?: string | null;
  id: string;
  language?: string | null;
  number?: string;
  orderProducts: Array<{
    amount: number;
    fullAmount: number;
    id: string;
    product?: unknown;
    productId: string;
    quantity: number;
  }>;
  paidAt?: string | null;
  paymentMethod: string;
  paymentProvider?: string | null;
  preparationTaskStation: unknown[];
  productionIndex?: number;
  progressiveDiscountSnapshot?: unknown;
  redeemedRewards?: unknown[];
  scheduleFor?: string | null;
  status: string;
  tip?: number;
  tipAmount?: number;
  type: string;
};

export interface OrdersRepository {
  findByStation(stationId: string, window: DayWindow): Promise<OrdersByStationItem[]>;
  getById(orderId: string): Promise<OrderDetail | null>;
  findAssignedDriverIdByOrderId(orderId: string): Promise<string | null>;
  list(query: OrderListQuery): Promise<OrderListItem[]>;
  updateDelivery(input: UpdateOrderDeliveryInput): Promise<UpdateOrderDeliveryResult | null>;
}
