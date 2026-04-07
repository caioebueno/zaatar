import type { DispatchRepository } from "../domain/dispatch.repository";

export function scheduleDispatchRouteMetricsRefresh(
  repository: DispatchRepository,
  dispatchId: string,
): void {
  queueMicrotask(() => {
    void repository.refreshRouteMetrics(dispatchId).catch((error: unknown) => {
      console.error(
        `Failed to refresh route metrics for dispatch ${dispatchId}:`,
        error,
      );
    });
  });
}
