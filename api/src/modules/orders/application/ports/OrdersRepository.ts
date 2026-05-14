export type OrderListQuery = {
  from?: string;
  includeCanceled: boolean;
  limit: number;
  timezone: string;
  to?: string;
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

export interface OrdersRepository {
  getById(orderId: string): Promise<OrderDetail | null>;
  list(query: OrderListQuery): Promise<OrderListItem[]>;
}
