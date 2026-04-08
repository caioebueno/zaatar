import type { Driver } from "@/src/modules/driver/domain/driver.types";
import type TAddress from "@/src/types/address";
import type { TOrder } from "@/src/types/order";
import type TCustomer from "@/src/types/customer";

export type Dispatch = {
  id: string;
  createdAt: string;
  dispatchAt?: string;
  dispatched: boolean;
  estimatedDeliveryDurationMinutes?: number;
  estimatedRoundTripDurationMinutes?: number;
  driverId?: string;
  driver?: Driver;
  orders: (Omit<TOrder, "status" | "address"> & {
    customer?: TCustomer;
    delivered: boolean;
    deliveryAddress?: TAddress;
  })[];
};

export type CreateDispatchInput = {
  driverId?: string | null;
  dispatched?: boolean;
  orderIds: string[];
};

export type UpdateDispatchInput = {
  dispatchId: string;
  driverId?: string | null;
  dispatched: boolean;
  orderIds: string[];
};

export type UpdateDispatchStatusInput = {
  dispatchId: string;
  dispatched: boolean;
  dispatchAt?: string | null;
};

export type MoveDispatchOrderInput = {
  orderId: string;
  createNewDispatch?: boolean;
  targetDispatchId?: string;
  targetIndex?: number;
};

export type MoveDispatchOrderResult = {
  orderId: string;
  sourceDispatchId?: string;
  targetDispatchId: string;
  targetIndex: number;
  createdDispatch: boolean;
  sourceDispatchDeleted: boolean;
};
