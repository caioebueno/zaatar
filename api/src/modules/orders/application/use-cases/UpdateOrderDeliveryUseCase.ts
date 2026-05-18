import { DriverOrderPermissionDeniedError } from "../errors/DriverOrderPermissionDeniedError.js";
import { InvalidUpdateOrderPayloadError } from "../errors/InvalidUpdateOrderPayloadError.js";
import { OrderNotFoundError } from "../errors/OrderNotFoundError.js";
import type {
  OrdersRepository,
  UpdateOrderDeliveryResult,
} from "../ports/OrdersRepository.js";

export type UpdateOrderDeliveryInput = {
  deliveredAt: unknown;
  driverId?: unknown;
  orderId: unknown;
};

export class UpdateOrderDeliveryUseCase {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async execute(input: UpdateOrderDeliveryInput): Promise<UpdateOrderDeliveryResult> {
    const orderId = normalizeRequiredString(input.orderId, "orderId");
    const deliveredAt = normalizeDeliveredAt(input.deliveredAt);
    const driverId = normalizeOptionalString(input.driverId, "driverId");

    if (driverId) {
      const assignedDriverId =
        await this.ordersRepository.findAssignedDriverIdByOrderId(orderId);

      if (!assignedDriverId) {
        throw new OrderNotFoundError();
      }

      if (assignedDriverId !== driverId) {
        throw new DriverOrderPermissionDeniedError();
      }
    }

    const updated = await this.ordersRepository.updateDelivery({
      orderId,
      deliveredAt,
    });

    if (!updated) {
      throw new OrderNotFoundError();
    }

    return updated;
  }
}

function normalizeRequiredString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new InvalidUpdateOrderPayloadError(field);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidUpdateOrderPayloadError(field);
  }

  return normalized;
}

function normalizeOptionalString(
  value: unknown,
  field: string,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return normalizeRequiredString(value, field);
}

function normalizeDeliveredAt(value: unknown): Date | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new InvalidUpdateOrderPayloadError("deliveredAt");
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new InvalidUpdateOrderPayloadError("deliveredAt");
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new InvalidUpdateOrderPayloadError("deliveredAt");
  }

  return parsed;
}
