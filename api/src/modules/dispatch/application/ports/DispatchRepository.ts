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
  preparationStepCategory: unknown[];
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
  dispatchAt?: string;
  dispatched: boolean;
  driver?: DispatchDriver;
  driverId?: string;
  estimatedDeliveryDurationMinutes?: number;
  estimatedRoundTripDurationMinutes?: number;
  id: string;
  orders: DispatchOrder[];
  queueIndex?: number;
};

export type DispatchRepository = {
  findNextForDriver(driverId: string): Promise<DispatchEntity | null>;
};
