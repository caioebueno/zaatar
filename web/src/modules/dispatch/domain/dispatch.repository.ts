import type {
  CreateDispatchInput,
  Dispatch,
  UpdateDispatchInput,
  UpdateDispatchStatusInput,
} from "./dispatch.types";

export interface DispatchRepository {
  assignOrder(dispatchId: string, orderId: string): Promise<void>;
  autoAssignDriver(dispatchId: string): Promise<void>;
  create(data: CreateDispatchInput): Promise<Dispatch>;
  findNextForDriver(driverId: string): Promise<Dispatch | undefined>;
  findMatchingOpenDispatchForDeliveryAddress(
    deliveryAddressId: string,
    maxRouteDurationInMinutes: number,
  ): Promise<string | undefined>;
  list(): Promise<Dispatch[]>;
  refreshRouteMetrics(dispatchId: string): Promise<void>;
  update(data: UpdateDispatchInput): Promise<Dispatch>;
  updateStatus(data: UpdateDispatchStatusInput): Promise<Dispatch>;
}
