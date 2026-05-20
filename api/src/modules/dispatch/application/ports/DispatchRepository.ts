export type DispatchDriver = {
  active: boolean;
  createdAt: string;
  id: string;
  name: string;
  priorityLevel: number;
};

export type DispatchOrder = {
  createdAt: string;
  customer?: {
    id: string;
    name: string | null;
    phone: string | null;
  };
  costumerId?: string;
  delivered: boolean;
  deliveredAt?: string;
  dispatchId?: string;
  dispatchOrderIndex: number;
  estimatedDeliveryDurationMinutes: number | null;
  externalId: string | null;
  id: string;
  language: string | null;
  number?: string;
  orderProducts: unknown[];
  paidAt: string | null;
  paymentMethod: string;
  preparationTaskStation: unknown[];
  progressiveDiscountSnapshot?: unknown;
  redeemedRewards: unknown[];
  scheduleFor: string | null;
  tip?: number;
  tipAmount?: number;
  type: string;
  deliveryAddress?: {
    city: string;
    complement?: string;
    createdAt: string;
    customerId?: string;
    deliveryFee?: number;
    description: string;
    id: string;
    lat: string;
    lng: string;
    number: string;
    numberComplement?: string;
    state: string;
    street: string;
    zipCode: string;
  };
};

export type DispatchEntity = {
  createdAt: string;
  dispatchAt?: string; // legacy
  startedDeliveryAt?: string;
  latestRoutePoint?: {
    accuracyMeters: number | null;
    altitudeMeters: number | null;
    createdAt: string;
    headingDegrees: number | null;
    id: string;
    isMocked: boolean | null;
    lat: number;
    lng: number;
    recordedAt: string;
    sequence: number;
    sessionId: string;
    source: string;
    speedMps: number | null;
  };
  dispatched: boolean;
  status: "PREPARING" | "READY_FOR_DELIVERY" | "OUT_FOR_DELIVERY" | "DELIVERED";
  driver?: DispatchDriver;
  driverId?: string;
  estimatedDeliveryDurationMinutes?: number;
  estimatedRoundTripDurationMinutes?: number;
  id: string;
  orders: DispatchOrder[];
  queueIndex?: number;
};

export type DispatchListFilters = {
  status?: "active";
};

export type UpdateDispatchStatusInput = {
  dispatchAt?: string | null;
  dispatched?: boolean;
  dispatchId: string;
  driverId?: string | null;
  queueIndex?: number;
};

export type MoveDispatchOrderInput = {
  createNewDispatch?: boolean;
  orderId: string;
  targetDispatchId?: string;
  targetIndex?: number;
};

export type MoveDispatchOrderResult = {
  createdDispatch: boolean;
  orderId: string;
  sourceDispatchDeleted: boolean;
  sourceDispatchId?: string;
  targetDispatchId: string;
  targetIndex: number;
};

export type DispatchRepository = {
  driverExists(driverId: string): Promise<boolean>;
  findByDriverDateRange(
    driverId: string,
    start: Date,
    end: Date,
  ): Promise<DispatchEntity[]>;
  list(filters?: DispatchListFilters): Promise<DispatchEntity[]>;
  findNextForDriver(driverId: string): Promise<DispatchEntity | null>;
  findDriverIdByDispatchId(dispatchId: string): Promise<string | null>;
  moveOrder(input: MoveDispatchOrderInput): Promise<MoveDispatchOrderResult>;
  updateStatus(input: UpdateDispatchStatusInput): Promise<DispatchEntity>;
  updateDriverAssignment(
    dispatchId: string,
    driverId: string | null,
  ): Promise<DispatchEntity | null>;
  ensureActiveRouteSession(
    dispatchId: string,
    driverId: string,
    startedAt: Date,
  ): Promise<void>;
  setStartedDeliveryAt(
    dispatchId: string,
    startedDeliveryAt: Date,
  ): Promise<{
    dispatchId: string;
    startedDeliveryAt: string;
  } | null>;
};
