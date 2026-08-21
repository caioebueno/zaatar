import type {
  PaginatedOrderListItem,
  OrdersRepository,
} from "../ports/OrdersRepository.js";

export type ListOrdersV1Input = {
  from?: string;
  includeCanceled?: boolean;
  page?: number;
  pageSize?: number;
  timezone?: string;
  to?: string;
};

export type ListOrdersV1Output = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  items: Array<{
    branchId?: string | null;
    canceled: boolean;
    createdAt: string;
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
    paidAt?: string | null;
    paymentMethod: string;
    paymentProvider?: string | null;
    payments: {
      amount: number;
      externalId: string | null;
      paidAt: string | null;
      paymentProvider: string | null;
      paymentType: string;
    }[];
    progressiveDiscountSnapshot?: unknown;
    scheduleFor?: string | null;
    status: string;
    subtotalCents: number;
    tags: string[];
    tipAmountCents: number;
    tipPercent: number;
    totalCents: number;
  }>;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export class ListOrdersV1UseCase {
  constructor(private readonly repository: OrdersRepository) {}

  async execute(input: ListOrdersV1Input): Promise<ListOrdersV1Output> {
    const timezone = (input.timezone ?? "").trim() || "America/New_York";
    const includeCanceled = input.includeCanceled === true;
    const page = Number.isFinite(input.page)
      ? Math.max(1, Math.floor(Number(input.page)))
      : 1;
    const pageSize = Number.isFinite(input.pageSize)
      ? Math.min(Math.max(Math.floor(Number(input.pageSize)), 1), 500)
      : 50;

    const from = (input.from ?? "").trim() || undefined;
    const to = (input.to ?? "").trim() || undefined;

    const result = await this.repository.listPaginated({
      timezone,
      includeCanceled,
      page,
      pageSize,
      from,
      to,
    });

    const totalPages =
      result.totalItems > 0 ? Math.ceil(result.totalItems / pageSize) : 0;

    return {
      items: result.items.map((item: PaginatedOrderListItem) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      })),
      page,
      pageSize,
      totalItems: result.totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: totalPages > 0 && page < totalPages,
    };
  }
}
