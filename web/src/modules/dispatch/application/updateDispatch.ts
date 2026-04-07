import type { DispatchRepository } from "../domain/dispatch.repository";
import type { UpdateDispatchInput } from "../domain/dispatch.types";
import { scheduleDispatchRouteMetricsRefresh } from "./scheduleDispatchRouteMetricsRefresh";

function normalizeOrderIds(orderIds: string[]): string[] {
  const normalizedOrderIds = Array.from(
    new Set(orderIds.map((orderId) => orderId.trim()).filter(Boolean)),
  );

  if (normalizedOrderIds.length === 0) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "orderIds",
      },
    };
  }

  return normalizedOrderIds;
}

export async function updateDispatchUseCase(
  repository: DispatchRepository,
  data: UpdateDispatchInput,
) {
  const dispatchId = data.dispatchId.trim();

  if (!dispatchId) {
    throw {
      code: "INVALID_PARAMS",
      details: {
        field: "dispatchId",
      },
    };
  }

  const driverId = data.driverId?.trim();

  const dispatch = await repository.update({
    dispatchId,
    driverId:
      data.driverId === null ? null : driverId ? driverId : undefined,
    dispatched: data.dispatched,
    orderIds: normalizeOrderIds(data.orderIds),
  });

  scheduleDispatchRouteMetricsRefresh(repository, dispatch.id);

  return dispatch;
}
