import type {
  ForwardLegacyWebApiInput,
  ForwardLegacyWebApiOutput,
  LegacyWebApiGateway,
} from "../../application/ports/LegacyWebApiGateway.js";

const DEFAULT_WEB_API_BASE_URL = "http://localhost:3000";

export class FetchLegacyWebApiGateway implements LegacyWebApiGateway {
  private readonly baseUrl: string;

  constructor(input?: { baseUrl?: string }) {
    this.baseUrl =
      input?.baseUrl?.trim() ||
      process.env.WEB_API_BASE_URL?.trim() ||
      DEFAULT_WEB_API_BASE_URL;
  }

  async forward(
    input: ForwardLegacyWebApiInput,
  ): Promise<ForwardLegacyWebApiOutput> {
    const requestUrl = `${this.baseUrl.replace(/\/$/, "")}/api${input.path}`;
    const headers = new Headers();

    if (input.rawBody) {
      const contentType = input.headers?.["content-type"];
      if (contentType) {
        headers.set("Content-Type", contentType);
      }
    } else if (input.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }

    const businessId = input.headers?.["x-business-id"]?.trim();
    if (businessId) {
      headers.set("x-business-id", businessId);
    }

    const response = await fetch(requestUrl, {
      method: input.method,
      headers,
      ...(input.rawBody && input.rawBody.length > 0
        ? { body: new Uint8Array(input.rawBody) }
        : input.method !== "GET" && input.body !== undefined
          ? { body: JSON.stringify(input.body) }
          : {}),
    });

    const body = await response
      .json()
      .catch(async () => ({ raw: await response.text().catch(() => "") }));

    return {
      statusCode: response.status,
      body,
    };
  }
}
