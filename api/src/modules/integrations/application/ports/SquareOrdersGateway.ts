export type SquareLocationSummary = {
  id: string;
  name: string | null;
  status: string | null;
  timezone: string | null;
};

export type SquareCreateOrderResult = {
  order: unknown;
  rawResponse: unknown;
};

export type SquareRetrieveOrderResult = {
  order: unknown;
  rawResponse: unknown;
};

export type SquareRetrieveCustomerResult = {
  customer: unknown;
  rawResponse: unknown;
};

export type SquareSearchOrdersResult = {
  cursor: string | null;
  orders: unknown[];
  rawResponse: unknown;
};

export interface SquareOrdersGateway {
  createOrder(input: {
    accessToken?: string;
    idempotencyKey: string;
    order: unknown;
  }): Promise<SquareCreateOrderResult>;
  listLocations(input?: {
    accessToken?: string;
  }): Promise<SquareLocationSummary[]>;
  retrieveCustomer(input: {
    accessToken?: string;
    customerId: string;
  }): Promise<SquareRetrieveCustomerResult>;
  retrieveOrder(input: {
    accessToken?: string;
    orderId: string;
  }): Promise<SquareRetrieveOrderResult>;
  searchOrders(input: {
    accessToken?: string;
    locationIds: string[];
    limit?: number;
    query?: unknown;
  }): Promise<SquareSearchOrdersResult>;
}
