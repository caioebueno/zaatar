import { ChatwootProxyConfigError } from "../../application/errors/ChatwootProxyConfigError.js";
import { ChatwootProxyRequestError } from "../../application/errors/ChatwootProxyRequestError.js";
import type {
  AssignChatwootConversationGatewayInput,
  ChatwootProxyGateway,
  CreateChatwootConversationMessageGatewayInput,
  ListChatwootConversationMessagesGatewayInput,
  ListChatwootChatsGatewayInput,
  MarkChatwootConversationReadGatewayInput,
  ResolveChatwootConversationGatewayInput,
} from "../../application/ports/ChatwootProxyGateway.js";

const DEFAULT_CHATWOOT_BASE_URL =
  "https://chatwoot-production-487ab.up.railway.app";

export class HttpChatwootProxyGateway implements ChatwootProxyGateway {
  async listChats(input: ListChatwootChatsGatewayInput): Promise<unknown> {
    const baseUrl = resolveChatwootBaseUrl();
    const apiAccessToken = resolveRequiredEnv("CHATWOOT_API_ACCESS_TOKEN");
    const endpointPath = `/api/v1/accounts/${encodeURIComponent(
      input.accountId,
    )}/conversations`;
    const baseQuery = { ...input.query };
    logChatwootDebug("listChats:start", {
      accountId: input.accountId,
      sourceId: input.sourceId,
      baseQuery,
      endpointPath,
    });

    // Attempt 1: all statuses without forcing inbox filter.
    const attempt1 = await requestChatwootJson({
      attemptLabel: "listChats.attempt1.status_all",
      baseUrl,
      endpointPath,
      apiAccessToken,
      query: {
        ...baseQuery,
        status: "all",
      },
    });
    if (attempt1.ok) return attempt1.body;

    // Attempt 2: same query, but without explicit status (some installations reject `status=all`).
    if (attempt1.statusCode === 404 || attempt1.statusCode === 400) {
      const { status: _ignored, ...queryWithoutStatus } = baseQuery;
      const attempt2 = await requestChatwootJson({
        attemptLabel: "listChats.attempt2.no_status",
        baseUrl,
        endpointPath,
        apiAccessToken,
        query: queryWithoutStatus,
      });
      if (attempt2.ok) return attempt2.body;

      // Attempt 3: fallback with branch source as inbox scope when upstream expects explicit inbox filter.
      if (attempt2.statusCode === 404 && !baseQuery.inbox_id) {
        const attempt3 = await requestChatwootJson({
          attemptLabel: "listChats.attempt3.status_all_with_inbox",
          baseUrl,
          endpointPath,
          apiAccessToken,
          query: {
            ...baseQuery,
            status: "all",
            inbox_id: input.sourceId,
          },
        });
        if (attempt3.ok) return attempt3.body;
        throw new ChatwootProxyRequestError(attempt3.statusCode, attempt3.body);
      }

      throw new ChatwootProxyRequestError(attempt2.statusCode, attempt2.body);
    }

    throw new ChatwootProxyRequestError(attempt1.statusCode, attempt1.body);
  }

  async listConversationMessages(
    input: ListChatwootConversationMessagesGatewayInput,
  ): Promise<unknown> {
    const baseUrl = resolveChatwootBaseUrl();
    const apiAccessToken = resolveRequiredEnv("CHATWOOT_API_ACCESS_TOKEN");

    const url = new URL(
      `/api/v1/accounts/${encodeURIComponent(
        input.accountId,
      )}/conversations/${encodeURIComponent(input.conversationId)}/messages`,
      baseUrl,
    );
    for (const [key, value] of Object.entries(input.query)) {
      url.searchParams.set(key, value);
    }
    logChatwootDebug("listConversationMessages:request", {
      accountId: input.accountId,
      conversationId: input.conversationId,
      url: url.toString(),
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        api_access_token: apiAccessToken,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const responseBody = await readResponseBody(response);
    logChatwootDebug("listConversationMessages:response", {
      conversationId: input.conversationId,
      statusCode: response.status,
      ok: response.ok,
      body: toDebugBody(responseBody),
    });
    if (!response.ok) {
      throw new ChatwootProxyRequestError(response.status, responseBody);
    }

    return responseBody;
  }

  async assignConversationToAgent(
    input: AssignChatwootConversationGatewayInput,
  ): Promise<unknown> {
    const baseUrl = resolveChatwootBaseUrl();
    const apiAccessToken = resolveRequiredEnv("CHATWOOT_API_ACCESS_TOKEN");

    const url = new URL(
      `/api/v1/accounts/${encodeURIComponent(
        input.accountId,
      )}/conversations/${encodeURIComponent(input.conversationId)}/assignments`,
      baseUrl,
    );
    logChatwootDebug("assignConversationToAgent:request", {
      accountId: input.accountId,
      conversationId: input.conversationId,
      assigneeId: input.assigneeId,
      url: url.toString(),
    });

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        api_access_token: apiAccessToken,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignee_id: input.assigneeId,
      }),
      cache: "no-store",
    });

    const responseBody = await readResponseBody(response);
    logChatwootDebug("assignConversationToAgent:response", {
      conversationId: input.conversationId,
      statusCode: response.status,
      ok: response.ok,
      body: toDebugBody(responseBody),
    });
    if (!response.ok) {
      throw new ChatwootProxyRequestError(response.status, responseBody);
    }

    return responseBody;
  }

  async createConversationMessage(
    input: CreateChatwootConversationMessageGatewayInput,
  ): Promise<unknown> {
    const baseUrl = resolveChatwootBaseUrl();
    const apiAccessToken = resolveRequiredEnv("CHATWOOT_API_ACCESS_TOKEN");
    const url = new URL(
      `/api/v1/accounts/${encodeURIComponent(
        input.accountId,
      )}/conversations/${encodeURIComponent(input.conversationId)}/messages`,
      baseUrl,
    );

    const body = {
      content: input.content,
      message_type: "outgoing",
      private: input.private ?? false,
      ...(input.contentAttributes
        ? { content_attributes: input.contentAttributes }
        : {}),
    };

    logChatwootDebug("createConversationMessage:request", {
      accountId: input.accountId,
      conversationId: input.conversationId,
      url: url.toString(),
      body,
    });

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        api_access_token: apiAccessToken,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const responseBody = await readResponseBody(response);
    logChatwootDebug("createConversationMessage:response", {
      conversationId: input.conversationId,
      statusCode: response.status,
      ok: response.ok,
      body: toDebugBody(responseBody),
    });
    if (!response.ok) {
      throw new ChatwootProxyRequestError(response.status, responseBody);
    }

    return responseBody;
  }

  async resolveConversation(
    input: ResolveChatwootConversationGatewayInput,
  ): Promise<unknown> {
    const baseUrl = resolveChatwootBaseUrl();
    const apiAccessToken = resolveRequiredEnv("CHATWOOT_API_ACCESS_TOKEN");

    const url = new URL(
      `/api/v1/accounts/${encodeURIComponent(
        input.accountId,
      )}/conversations/${encodeURIComponent(input.conversationId)}/toggle_status`,
      baseUrl,
    );

    const body = { status: "resolved" };

    logChatwootDebug("resolveConversation:request", {
      accountId: input.accountId,
      conversationId: input.conversationId,
      url: url.toString(),
      body,
    });

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        api_access_token: apiAccessToken,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const responseBody = await readResponseBody(response);
    logChatwootDebug("resolveConversation:response", {
      conversationId: input.conversationId,
      statusCode: response.status,
      ok: response.ok,
      body: toDebugBody(responseBody),
    });
    if (!response.ok) {
      throw new ChatwootProxyRequestError(response.status, responseBody);
    }

    return responseBody;
  }

  async markConversationRead(
    input: MarkChatwootConversationReadGatewayInput,
  ): Promise<unknown> {
    const baseUrl = resolveChatwootBaseUrl();
    const apiAccessToken = resolveRequiredEnv("CHATWOOT_API_ACCESS_TOKEN");
    const endpointPaths = [
      `/api/v1/accounts/${encodeURIComponent(
        input.accountId,
      )}/conversations/${encodeURIComponent(input.conversationId)}/messages/read`,
      `/api/v1/accounts/${encodeURIComponent(
        input.accountId,
      )}/conversations/${encodeURIComponent(input.conversationId)}/update_last_seen`,
    ];

    let lastFailure:
      | { statusCode: number; responseBody: unknown; endpointPath: string }
      | null = null;

    for (const endpointPath of endpointPaths) {
      const url = new URL(endpointPath, baseUrl);
      logChatwootDebug("markConversationRead:request", {
        accountId: input.accountId,
        conversationId: input.conversationId,
        endpointPath,
        url: url.toString(),
      });

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          api_access_token: apiAccessToken,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        cache: "no-store",
      });

      const responseBody = await readResponseBody(response);
      logChatwootDebug("markConversationRead:response", {
        conversationId: input.conversationId,
        endpointPath,
        statusCode: response.status,
        ok: response.ok,
        body: toDebugBody(responseBody),
      });

      if (response.ok) {
        return responseBody;
      }

      lastFailure = {
        endpointPath,
        statusCode: response.status,
        responseBody,
      };

      if (response.status !== 404) {
        break;
      }
    }

    if (lastFailure) {
      throw new ChatwootProxyRequestError(
        lastFailure.statusCode,
        lastFailure.responseBody,
      );
    }

    throw new ChatwootProxyRequestError(500, {
      error: "CHATWOOT_MARK_READ_FAILED",
    });
  }
}

function resolveChatwootBaseUrl(): string {
  const configured = process.env.CHATWOOT_BASE_URL?.trim();
  const baseUrl = configured || DEFAULT_CHATWOOT_BASE_URL;
  return baseUrl.replace(/\/+$/, "");
}

function resolveRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new ChatwootProxyConfigError(name);
  }

  return value;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().includes("application/json")) {
    return response.json().catch(() => ({}));
  }

  return response.text().catch(() => "");
}

async function requestChatwootJson(input: {
  attemptLabel?: string;
  apiAccessToken: string;
  baseUrl: string;
  endpointPath: string;
  query: Record<string, string>;
}): Promise<{ ok: true; body: unknown } | { ok: false; body: unknown; statusCode: number }> {
  const url = new URL(input.endpointPath, input.baseUrl);
  for (const [key, value] of Object.entries(input.query)) {
    url.searchParams.set(key, value);
  }
  logChatwootDebug("requestChatwootJson:request", {
    attemptLabel: input.attemptLabel ?? null,
    url: url.toString(),
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      api_access_token: input.apiAccessToken,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const responseBody = await readResponseBody(response);
  logChatwootDebug("requestChatwootJson:response", {
    attemptLabel: input.attemptLabel ?? null,
    statusCode: response.status,
    ok: response.ok,
    body: toDebugBody(responseBody),
  });
  if (response.ok) {
    return { ok: true, body: responseBody };
  }

  return {
    ok: false,
    body: responseBody,
    statusCode: response.status,
  };
}

function logChatwootDebug(message: string, payload: Record<string, unknown>): void {
  void message;
  void payload;
}

function toDebugBody(value: unknown): string {
  try {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value ?? {});
    if (serialized.length > 1200) {
      return `${serialized.slice(0, 1200)}...<truncated>`;
    }
    return serialized;
  } catch {
    return "<unserializable>";
  }
}
