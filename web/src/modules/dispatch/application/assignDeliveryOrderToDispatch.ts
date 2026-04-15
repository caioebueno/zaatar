import type { DispatchRepository } from "../domain/dispatch.repository";
import { scheduleDispatchRouteMetricsRefresh } from "./scheduleDispatchRouteMetricsRefresh";

const MAX_ROUTE_DURATION_IN_MINUTES = 10;

type AssignDeliveryOrderToDispatchInput = {
  orderId: string;
  deliveryAddressId: string;
};

export async function assignDeliveryOrderToDispatchUseCase(
  repository: DispatchRepository,
  data: AssignDeliveryOrderToDispatchInput,
): Promise<string> {
  const orderId = data.orderId.trim();
  const deliveryAddressId = data.deliveryAddressId.trim();

  if (!orderId) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "orderId",
      },
    };
  }

  if (!deliveryAddressId) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "deliveryAddressId",
      },
    };
  }

  const isScheduledOrder = await repository.isOrderScheduled(orderId);

  const existingDispatchId = isScheduledOrder
    ? undefined
    : await repository.findMatchingOpenDispatchForDeliveryAddress(
        deliveryAddressId,
        MAX_ROUTE_DURATION_IN_MINUTES,
      );

  if (existingDispatchId) {
    await repository.assignOrder(existingDispatchId, orderId);
    await repository.autoAssignDriver(existingDispatchId);
    scheduleDispatchRouteMetricsRefresh(repository, existingDispatchId);

    return existingDispatchId;
  }

  const dispatch = await repository.create({
    dispatched: false,
    orderIds: [orderId],
  });

  await repository.autoAssignDriver(dispatch.id);
  scheduleDispatchRouteMetricsRefresh(repository, dispatch.id);

  return dispatch.id;
}
