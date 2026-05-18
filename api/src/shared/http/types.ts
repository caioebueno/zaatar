export type HttpRequest = {
  auth?: {
    businessId?: string | null;
    email: string;
    name: string;
    userId: string;
  };
  driverAuth?: {
    driverId: string;
    name: string;
    phone: string;
  };
  body?: unknown;
  formData?: FormData;
  headers?: Record<string, string | undefined>;
  method: string;
  path: string;
  rawBody?: Buffer;
};

export type HttpResponse = {
  body: unknown;
  statusCode: number;
};

export type HttpController = {
  handle: (request: HttpRequest) => Promise<HttpResponse>;
};
