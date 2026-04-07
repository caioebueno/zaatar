import type { DispatchRepository } from "../domain/dispatch.repository";
import type { CreateDispatchInput } from "../domain/dispatch.types";
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

export async function createDispatchUseCase(
  repository: DispatchRepository,
  data: CreateDispatchInput,
) {
  const driverId = data.driverId?.trim();
  const dispatch = await repository.create({
    driverId: driverId || undefined,
    dispatched:
      typeof data.dispatched === "boolean" ? data.dispatched : undefined,
    orderIds: normalizeOrderIds(data.orderIds),
  });

  if (!driverId) {
    await repository.autoAssignDriver(dispatch.id);
  }

  scheduleDispatchRouteMetricsRefresh(repository, dispatch.id);

  return dispatch;
}
