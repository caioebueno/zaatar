export type OrderListQuery = {
  from?: string;
  includeCanceled: boolean;
  limit: number;
  timezone: string;
  to?: string;
};

export type PaginatedOrderListQuery = {
  from?: string;
  includeCanceled: boolean;
  page: number;
  pageSize: number;
  timezone: string;
  to?: string;
};

export type PaginatedOrderListItem = {
  branchId?: string | null;
  canceled: boolean;
  createdAt: Date;
  customer: {
    name: string | null;
    phone: string | null;
  };
  deliveredAt?: string | null;
  deliveryAddress?: {
    city: string;
    complement?: string;
    deliveryFee?: number;
    description: string;
    expectedHandoffDuration?: number;
    id: string;
    lat: string;
    lng: string;
    number: string;
    numberComplement?: string;
    state: string;
    street: string;
    zipCode: string;
  } | null;
  deliveryAddressId?: string | null;
  deliveryFeeCents: number;
  discountedSubtotalCents: number;
  dispatchId?: string | null;
  externalId?: string | null;
  id: string;
  items: Array<{
    comments?: string;
    lineTotalCents: number;
    modifierGroupItems: Array<{
      description?: string;
      id: string;
      name: string;
      price: number;
    }>;
    productId: string;
    productName: string;
    quantity: number;
    unitAmountCents: number;
  }>;
  language?: string | null;
  number: string | null;
  orderType: string;
  sourcePlatform?: string | null;
  paidAt?: string | null;
  paymentMethod: string;
  paymentProvider?: string | null;
  payments: OrderPaymentSummary[];
  progressiveDiscountSnapshot?: unknown;
  scheduleFor?: string | null;
  status: string;
  subtotalCents: number;
  tags: string[];
  tipAmountCents: number;
  tipPercent: number;
  totalCents: number;
};

export type PaginatedOrderListResult = {
  items: PaginatedOrderListItem[];
  totalItems: number;
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
  sourcePlatform?: string | null;
  paymentMethod: string;
  payments: OrderPaymentSummary[];
  status: string;
  totalCents: number;
};

export type OrderPaymentSummary = {
  amount: number;
  externalId: string | null;
  paidAt: string | null;
  paymentProvider: string | null;
  paymentType: string;
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
  sourcePlatform?: string | null;
  paymentMethod: string;
  payments: OrderPaymentSummary[];
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
  sourcePlatform?: string | null;
  payments?: OrderPaymentSummary[];
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
  listPaginated(query: PaginatedOrderListQuery): Promise<PaginatedOrderListResult>;
  updateDelivery(input: UpdateOrderDeliveryInput): Promise<UpdateOrderDeliveryResult | null>;
}
