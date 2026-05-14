import type { HttpResponse } from "../../../../../shared/http/types.js";

export type NativeRouteRequest = {
  body?: unknown;
  formData?: FormData;
  headers?: Record<string, string | undefined>;
  nextUrl: URL;
  rawBody?: Buffer;
};

export type NextRequestLike = {
  json: () => Promise<unknown>;
  formData: () => Promise<FormData>;
  nextUrl: URL;
};

export function createNextRequestLike(input: NativeRouteRequest): NextRequestLike {
  return {
    nextUrl: input.nextUrl,
    async json() {
      return input.body ?? {};
    },
    async formData() {
      if (input.formData) {
        return input.formData;
      }

      const contentType = input.headers?.["content-type"] ?? "";
      const request = new Request("http://localhost/upload", {
        method: "POST",
        headers: contentType ? { "content-type": contentType } : undefined,
        body: input.rawBody ? new Uint8Array(input.rawBody) : undefined,
      });

      return request.formData();
    },
  };
}

export const NextResponse = {
  json(payload: unknown, init?: { status?: number }): HttpResponse {
    return {
      statusCode: init?.status ?? 200,
      body: payload,
    };
  },
};
