const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export type DispatchOrder = {
  id: string;
  createdAt: string;
  scheduleFor: string | null;
  language: string | null;
  paidAt: string | null;
  deliveredAt?: string;
  estimatedDeliveryDurationMinutes: number | null;
  dispatchOrderIndex: number;
  number?: string;
  externalId: string | null;
  delivered: boolean;
  type: string;
  paymentMethod: string;
  tip?: number;
  tipAmount?: number;
  dispatchId?: string;
  customer?: {
    id: string;
    name: string | null;
    phone: string | null;
  };
  deliveryAddress?: {
    id: string;
    description: string;
    street: string;
    number: string;
    city: string;
    state: string;
    zipCode: string;
    lat: string;
    lng: string;
    complement?: string;
    numberComplement?: string;
    deliveryFee?: number;
  };
  orderProducts: Array<{
    id: string;
    productId: string;
    product: {
      id: string;
      name: string;
      description: string | null;
      price: number | null;
      categoryId: string | null;
      comparedAtPrice: number | null;
    };
    comments?: string;
    selectedModifierGroupItems: Array<{
      id: string;
      name: string;
      price: number;
    }>;
    amount: number;
    fullAmount: number;
    quantity: number;
  }>;
};

export type DispatchEntity = {
  id: string;
  createdAt: string;
  queueIndex?: number;
  dispatchAt?: string;
  dispatched: boolean;
  estimatedDeliveryDurationMinutes?: number;
  estimatedRoundTripDurationMinutes?: number;
  driverId?: string;
  driver?: {
    id: string;
    name: string;
    active: boolean;
    priorityLevel: number;
  };
  orders: DispatchOrder[];
};

export async function getNextDispatch(token: string): Promise<DispatchEntity | null> {
  const r = await fetch(`${BASE}/dispatches/next`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw Object.assign(new Error('dispatch_failed'), { data: e, status: r.status });
  }
  return r.json() as Promise<DispatchEntity | null>;
}
