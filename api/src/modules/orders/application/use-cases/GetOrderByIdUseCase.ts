import type {
  OrderDetail,
  OrderPaymentSummary,
  OrdersRepository,
} from "../ports/OrdersRepository.js";

export type GetOrderByIdInput = {
  orderId: string;
};

export type GetOrderByIdOutput = {
  canceled: boolean;
  createdAt: string;
  customer: {
    name: string | null;
    phone: string | null;
  };
  deliveryFeeCents: number;
  discountedSubtotalCents: number;
  id: string;
  items: OrderDetail["items"];
  number: string | null;
  orderType: string;
  paymentMethod: string;
  payments: OrderPaymentSummary[];
  status: string;
  subtotalCents: number;
  tipAmountCents: number;
  tipPercent: number;
  totalCents: number;
} | null;

export class GetOrderByIdUseCase {
  constructor(private readonly repository: OrdersRepository) {}

  async execute(input: GetOrderByIdInput): Promise<GetOrderByIdOutput> {
    const orderId = input.orderId.trim();
    if (!orderId) return null;

    const order = await this.repository.getById(orderId);
    if (!order) return null;

    return {
      ...order,
      createdAt: order.createdAt.toISOString(),
    };
  }
}
