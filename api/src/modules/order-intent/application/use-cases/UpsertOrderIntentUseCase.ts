import { randomUUID } from "node:crypto";
import { InvalidUpsertOrderIntentPayloadError } from "../errors/InvalidUpsertOrderIntentPayloadError.js";
import type {
  OrderIntentPaymentMethod,
  OrderIntentPaymentProvider,
  OrderIntentRepository,
  OrderIntentStatus,
  OrderIntentType,
  UpsertOrderIntentInput,
  UpsertOrderIntentProductInput,
} from "../ports/OrderIntentRepository.js";

export type UpsertOrderIntentUseCaseInput = {
  active: unknown;
  amount: unknown;
  branchId: unknown;
  customerName: unknown;
  customerPhone: unknown;
  deliveryAddress: unknown;
  deliveryAddressId: unknown;
  id: unknown;
  language: unknown;
  orderProducts: unknown;
  paymentMethod: unknown;
  paymentProvider: unknown;
  progressiveDiscountSnapshot: unknown;
  status: unknown;
  tags: unknown;
  tipAmount: unknown;
  type: unknown;
};

export type UpsertOrderIntentUseCaseOutput = {
  active: boolean;
  amount: number | null;
  createdAt: string;
  customerId: string;
  deliveryAddressId: string | null;
  id: string;
  language: string | null;
  orderProducts: Array<{
    amount: number | null;
    comments: string | null;
    createdAt: string;
    fullAmount: number | null;
    id: string;
    modifierGroupItemIds: string[];
    productId: string;
    quantity: number;
  }>;
  paymentMethod: OrderIntentPaymentMethod;
  paymentProvider: OrderIntentPaymentProvider;
  progressiveDiscountSnapshot: unknown;
  status: OrderIntentStatus;
  tags: string[];
  tipAmount: number | null;
  type: OrderIntentType | null;
  updatedAt: string;
};

export class UpsertOrderIntentUseCase {
  constructor(private readonly repository: OrderIntentRepository) {}

  async execute(
    input: UpsertOrderIntentUseCaseInput,
  ): Promise<UpsertOrderIntentUseCaseOutput> {
    const normalizedInput = normalizeInput(input);
    const updated = await this.repository.upsert(normalizedInput);

    return {
      id: updated.id,
      customerId: updated.customerId,
      active: updated.active,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      language: updated.language,
      status: updated.status,
      type: updated.type,
      paymentMethod: updated.paymentMethod,
      paymentProvider: updated.paymentProvider,
      tipAmount: updated.tipAmount,
      tags: updated.tags,
      progressiveDiscountSnapshot: updated.progressiveDiscountSnapshot,
      amount: updated.amount,
      deliveryAddressId: updated.deliveryAddressId,
      orderProducts: updated.orderProducts.map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        productId: item.productId,
        quantity: item.quantity,
        comments: item.comments,
        fullAmount: item.fullAmount,
        amount: item.amount,
        modifierGroupItemIds: item.modifierGroupItemIds,
      })),
    };
  }
}

function normalizeInput(
  input: UpsertOrderIntentUseCaseInput,
): UpsertOrderIntentInput {
  const orderIntentId = normalizeOptionalId(input.id, "id");
  const branchId = normalizeOptionalId(input.branchId, "branchId");
  const customerPhone = normalizeOptionalPhone(input.customerPhone, "customerPhone");
  const customerName = normalizeOptionalCustomerName(input.customerName);
  const deliveryAddress = normalizeOptionalAddressText(input.deliveryAddress);
  const deliveryAddressId = normalizeOptionalId(
    input.deliveryAddressId,
    "deliveryAddressId",
  );

  if (!orderIntentId && !customerPhone) {
    throw new InvalidUpsertOrderIntentPayloadError("customerPhone");
  }

  if (deliveryAddress && !deliveryAddressId && !branchId) {
    throw new InvalidUpsertOrderIntentPayloadError("branchId");
  }

  return {
    orderIntentId,
    branchId: branchId ?? undefined,
    customerName: customerName ?? undefined,
    customerPhone: customerPhone ?? undefined,
    active: normalizeOptionalBoolean(input.active, "active"),
    language: normalizeOptionalText(input.language, "language"),
    status: normalizeOptionalStatus(input.status),
    type: normalizeOptionalType(input.type),
    paymentMethod: normalizeOptionalPaymentMethod(input.paymentMethod),
    paymentProvider: normalizeOptionalPaymentProvider(input.paymentProvider),
    tipAmount: normalizeOptionalIntegerOrNull(input.tipAmount, "tipAmount"),
    tags: normalizeOptionalTags(input.tags),
    progressiveDiscountSnapshot:
      input.progressiveDiscountSnapshot === undefined
        ? undefined
        : input.progressiveDiscountSnapshot,
    amount: normalizeOptionalIntegerOrNull(input.amount, "amount"),
    deliveryAddress,
    deliveryAddressId,
    orderProducts: normalizeOptionalOrderProducts(input.orderProducts),
  };
}

function normalizeRequiredId(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InvalidUpsertOrderIntentPayloadError(field);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidUpsertOrderIntentPayloadError(field);
  }
  return normalized;
}

function normalizePhone(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InvalidUpsertOrderIntentPayloadError(field);
  }
  const normalized = value.replace(/\D/g, "").trim();
  if (!normalized || normalized.length < 8 || normalized.length > 20) {
    throw new InvalidUpsertOrderIntentPayloadError(field);
  }
  return normalized;
}

function normalizeOptionalPhone(
  value: unknown,
  field: string,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  return normalizePhone(value, field);
}

function normalizeOptionalId(value: unknown, field: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new InvalidUpsertOrderIntentPayloadError(field);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidUpsertOrderIntentPayloadError(field);
  }
  return normalized;
}

function normalizeOptionalText(
  value: unknown,
  field: string,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new InvalidUpsertOrderIntentPayloadError(field);
  }
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > 24) {
    throw new InvalidUpsertOrderIntentPayloadError(field);
  }
  return normalized;
}

function normalizeOptionalAddressText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new InvalidUpsertOrderIntentPayloadError("deliveryAddress");
  }
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > 500) {
    throw new InvalidUpsertOrderIntentPayloadError("deliveryAddress");
  }
  return normalized;
}

function normalizeOptionalCustomerName(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new InvalidUpsertOrderIntentPayloadError("customerName");
  }
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > 120) {
    throw new InvalidUpsertOrderIntentPayloadError("customerName");
  }
  return normalized;
}

function normalizeOptionalBoolean(
  value: unknown,
  field: string,
): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") {
    throw new InvalidUpsertOrderIntentPayloadError(field);
  }
  return value;
}

function normalizeOptionalIntegerOrNull(
  value: unknown,
  field: string,
): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new InvalidUpsertOrderIntentPayloadError(field);
  }
  return value;
}

function normalizeOptionalTags(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new InvalidUpsertOrderIntentPayloadError("tags");
  }

  const tags = value.map((entry) => {
    if (typeof entry !== "string") {
      throw new InvalidUpsertOrderIntentPayloadError("tags");
    }
    const normalized = entry.trim();
    if (!normalized || normalized.length > 60) {
      throw new InvalidUpsertOrderIntentPayloadError("tags");
    }
    return normalized;
  });

  return [...new Set(tags)];
}

function normalizeOptionalStatus(value: unknown): OrderIntentStatus | undefined {
  if (value === undefined) return undefined;
  if (
    value === "ACCEPTED" ||
    value === "PREPARING" ||
    value === "OUT_FOR_DELIVERY" ||
    value === "DELIVERED"
  ) {
    return value;
  }
  throw new InvalidUpsertOrderIntentPayloadError("status");
}

function normalizeOptionalType(value: unknown): OrderIntentType | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === "DELIVERY" || value === "TAKEAWAY") {
    return value;
  }
  throw new InvalidUpsertOrderIntentPayloadError("type");
}

function normalizeOptionalPaymentMethod(
  value: unknown,
): OrderIntentPaymentMethod | undefined {
  if (value === undefined) return undefined;
  if (value === "CASH" || value === "CARD" || value === "ZELLE") {
    return value;
  }
  throw new InvalidUpsertOrderIntentPayloadError("paymentMethod");
}

function normalizeOptionalPaymentProvider(
  value: unknown,
): OrderIntentPaymentProvider | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value === "STRIPE") return value;
  throw new InvalidUpsertOrderIntentPayloadError("paymentProvider");
}

function normalizeOptionalOrderProducts(
  value: unknown,
): UpsertOrderIntentProductInput[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new InvalidUpsertOrderIntentPayloadError("orderProducts");
  }

  return value.map((entry, index) => normalizeOrderProduct(entry, index));
}

function normalizeOrderProduct(
  value: unknown,
  index: number,
): UpsertOrderIntentProductInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InvalidUpsertOrderIntentPayloadError(`orderProducts[${index}]`);
  }

  const row = value as Record<string, unknown>;

  const id = normalizeOptionalId(row.id, `orderProducts[${index}].id`);
  const productId = normalizeRequiredId(
    row.productId,
    `orderProducts[${index}].productId`,
  );
  const quantity = normalizeRequiredPositiveInt(
    row.quantity,
    `orderProducts[${index}].quantity`,
  );
  const comments = normalizeOptionalComment(
    row.comments,
    `orderProducts[${index}].comments`,
  );
  const fullAmount =
    normalizeOptionalIntegerOrNull(
      row.fullAmount,
      `orderProducts[${index}].fullAmount`,
    ) ?? null;
  const amount =
    normalizeOptionalIntegerOrNull(row.amount, `orderProducts[${index}].amount`) ?? null;

  const modifierGroupItemIds = normalizeModifierGroupItemIds(
    row.modifierGroupItemIds,
    index,
  );

  return {
    id: id ?? randomUUID(),
    productId,
    quantity,
    comments,
    fullAmount,
    amount,
    modifierGroupItemIds,
  };
}

function normalizeRequiredPositiveInt(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new InvalidUpsertOrderIntentPayloadError(field);
  }
  return value;
}

function normalizeOptionalComment(
  value: unknown,
  field: string,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new InvalidUpsertOrderIntentPayloadError(field);
  }
  const normalized = value.trim();
  if (normalized.length > 1000) {
    throw new InvalidUpsertOrderIntentPayloadError(field);
  }
  return normalized || null;
}

function normalizeModifierGroupItemIds(value: unknown, index: number): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new InvalidUpsertOrderIntentPayloadError(
      `orderProducts[${index}].modifierGroupItemIds`,
    );
  }

  const ids = value.map((entry) => {
    if (typeof entry !== "string") {
      throw new InvalidUpsertOrderIntentPayloadError(
        `orderProducts[${index}].modifierGroupItemIds`,
      );
    }
    const normalized = entry.trim();
    if (!normalized) {
      throw new InvalidUpsertOrderIntentPayloadError(
        `orderProducts[${index}].modifierGroupItemIds`,
      );
    }
    return normalized;
  });

  return [...new Set(ids)];
}
