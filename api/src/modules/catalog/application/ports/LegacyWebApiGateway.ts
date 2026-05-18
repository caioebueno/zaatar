export type ForwardLegacyWebApiInput = {
  body?: unknown;
  headers?: Record<string, string | undefined>;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  rawBody?: Buffer;
};

export type ForwardLegacyWebApiOutput = {
  body: unknown;
  statusCode: number;
};

export interface LegacyWebApiGateway {
  forward(input: ForwardLegacyWebApiInput): Promise<ForwardLegacyWebApiOutput>;
}
