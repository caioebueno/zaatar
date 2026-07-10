export type OrderPayment = {
  id: string;
  createdAt: string;
  orderId: string;
  amount: number;
  paymentType: string;
  paymentProvider: string | null;
  externalId: string | null;
  paidAt: string | null;
};

export type CreatePaymentInput = {
  id: string;
  orderId: string;
  amount: number;
  paymentType: string;
  paymentProvider?: string | null;
  externalId?: string | null;
  paidAt?: string | null;
};

export type UpdatePaymentInput = {
  id: string;
  amount?: number;
  paymentType?: string;
  paymentProvider?: string | null;
  externalId?: string | null;
  paidAt?: string | null;
};

export type PaymentsRepository = {
  listByOrderId(orderId: string): Promise<OrderPayment[]>;
  create(input: CreatePaymentInput): Promise<OrderPayment>;
  update(input: UpdatePaymentInput): Promise<OrderPayment | null>;
  delete(id: string): Promise<boolean>;
};
