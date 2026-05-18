import type { OrderListItem, OrdersRepository } from "../ports/OrdersRepository.js";

export type ListOrdersInput = {
  from?: string;
  includeCanceled?: boolean;
  limit?: number;
  timezone?: string;
  to?: string;
};

export type ListOrdersOutput = {
  items: Array<{
    canceled: boolean;
    createdAt: string;
    customerName: string | null;
    customerPhone: string | null;
    id: string;
    number: string | null;
    orderType: string;
    paymentMethod: string;
    status: string;
    totalCents: number;
  }>;
};

export class ListOrdersUseCase {
  constructor(private readonly repository: OrdersRepository) {}

  async execute(input: ListOrdersInput): Promise<ListOrdersOutput> {
    const timezone = (input.timezone ?? "").trim() || "America/New_York";
    const includeCanceled = input.includeCanceled === true;
    const limit = Number.isFinite(input.limit)
      ? Math.min(Math.max(Number(input.limit) || 50, 1), 500)
      : 50;

    const from = (input.from ?? "").trim() || undefined;
    const to = (input.to ?? "").trim() || undefined;

    const items = await this.repository.list({
      timezone,
      includeCanceled,
      limit,
      from,
      to,
    });

    return {
      items: items.map((item: OrderListItem) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }
}
